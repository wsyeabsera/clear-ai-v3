// Groq service for intelligent planning

import { Groq } from 'groq-sdk';
import dotenv from 'dotenv';

dotenv.config();

export interface GroqConfig {
  apiKey: string;
  model: string;
  temperature: number;
  maxTokens: number;
  timeout: number;
}

export interface ToolSelectionRequest {
  query: string;
  availableTools: string;
  toolSchemas: Record<string, any>;
  analysisFeedback?: string;
  failedTools?: string[];
}

export interface ToolSelectionResponse {
  tools: string[];
  reasoning: string;
  entities: string[];
  confidence: number;
}

export interface CategorySelectionRequest {
  query: string;
  availableCategories: string;
  analysisFeedback?: string;
}

export interface CategorySelectionResponse {
  categories: string[];
  reasoning: string;
  confidence: number;
}

export interface PlanGenerationRequest {
  query: string;
  selectedTools: string[];
  toolSchemas: Record<string, any>;
  requestId: string;
  analysisFeedback?: string;
  historicalContext?: string;
  failedTools?: string[];
}

export interface PlanGenerationResponse {
  plan: {
    steps: Array<{
      tool: string;
      params: Record<string, any>;
      dependsOn: number[];
      parallel: boolean;
      description: string;
    }>;
    metadata: {
      query: string;
      requestId: string;
      estimatedDurationMs: number;
      totalSteps: number;
      parallelSteps: number;
    };
  };
  reasoning: string;
  confidence: number;
}

export interface PlanRefinementRequest {
  query: string;
  originalPlan: any;
  validationErrors: string[];
  toolSchemas: Record<string, any>;
}

export interface PlanRefinementResponse {
  refinedPlan: any;
  reasoning: string;
  confidence: number;
}

export class GroqService {
  private groq: Groq;
  private config: GroqConfig;

  constructor(config?: Partial<GroqConfig>) {
    this.config = {
      apiKey: process.env.GROQ_API_KEY || '',
      model: process.env.GROQ_MODEL || 'llama-3.1-8b-instant',
      temperature: parseFloat(process.env.PLANNER_TEMPERATURE || '0.3'),
      maxTokens: parseInt(process.env.PLANNER_MAX_TOKENS || '4000'),
      timeout: parseInt(process.env.PLANNER_TIMEOUT_MS || '30000'),
      ...config
    };

    if (!this.config.apiKey) {
      throw new Error('GROQ_API_KEY environment variable is required');
    }

    this.groq = new Groq({
      apiKey: this.config.apiKey,
      dangerouslyAllowBrowser: false
    });
  }

  async selectCategories(request: CategorySelectionRequest): Promise<CategorySelectionResponse> {
    try {
      const prompt = this.buildCategorySelectionPrompt(request);
      
      const response = await this.groq.chat.completions.create({
        model: this.config.model,
        temperature: this.config.temperature,
        max_tokens: this.config.maxTokens,
        messages: [
          {
            role: 'system',
            content: 'You are an AI assistant that selects the most relevant categories for waste management queries. Analyze the query and select 1-3 primary categories that are most relevant. Respond with valid JSON only.'
          },
          {
            role: 'user',
            content: prompt
          }
        ]
      });

      const content = response.choices[0]?.message?.content;
      if (!content) {
        throw new Error('No response from Groq');
      }

      // Clean up the response to extract JSON from markdown if needed
      const cleanedContent = this.extractJSONFromResponse(content);
      const result = JSON.parse(cleanedContent);
      return {
        categories: result.categories || [],
        reasoning: result.reasoning || '',
        confidence: result.confidence || 0.5
      };
    } catch (error) {
      console.error('Groq category selection error:', error);
      throw new Error(`Category selection failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  async selectTools(request: ToolSelectionRequest): Promise<ToolSelectionResponse> {
    try {
      const prompt = this.buildToolSelectionPrompt(request);
      
      const response = await this.groq.chat.completions.create({
        model: this.config.model,
        temperature: this.config.temperature,
        max_tokens: this.config.maxTokens,
        messages: [
          {
            role: 'system',
            content: 'You are an AI assistant that selects the most appropriate tools for executing user queries. Analyze the query and available tools, then select the best tools with reasoning. Respond with valid JSON only.'
          },
          {
            role: 'user',
            content: prompt
          }
        ]
      });

      const content = response.choices[0]?.message?.content;
      if (!content) {
        throw new Error('No response from Groq');
      }

      // Clean up the response to extract JSON from markdown if needed
      const cleanedContent = this.extractJSONFromResponse(content);
      const result = JSON.parse(cleanedContent);
      return {
        tools: result.tools || [],
        reasoning: result.reasoning || '',
        entities: result.entities || [],
        confidence: result.confidence || 0.5
      };
    } catch (error) {
      console.error('Groq tool selection error:', error);
      throw new Error(`Tool selection failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  async generatePlan(request: PlanGenerationRequest): Promise<PlanGenerationResponse> {
    try {
      const prompt = this.buildPlanGenerationPrompt(request);
      
      const response = await this.groq.chat.completions.create({
        model: this.config.model,
        temperature: this.config.temperature,
        max_tokens: this.config.maxTokens,
        messages: [
          {
            role: 'system',
            content: 'You are an AI assistant that creates execution plans for waste management operations. Generate detailed, executable plans with proper parameter resolution and dependency management. CRITICAL: You MUST respond with valid, complete JSON only. No markdown, no explanations, no additional text. The JSON must be properly formatted with correct syntax, no trailing commas, and all brackets properly closed.'
          },
          {
            role: 'user',
            content: prompt
          }
        ]
      });

      const content = response.choices[0]?.message?.content;
      if (!content) {
        throw new Error('No response from Groq');
      }

      // Clean up the response to extract JSON from markdown if needed
      const cleanedContent = this.extractJSONFromResponse(content);
      
      // Validate JSON before parsing
      const validation = this.validateJSON(cleanedContent);
      if (!validation.valid) {
        console.error('JSON validation failed:', validation.errors);
        console.error('Content length:', cleanedContent.length);
        console.error('First 500 chars:', cleanedContent.substring(0, 500));
        console.error('Last 500 chars:', cleanedContent.substring(Math.max(0, cleanedContent.length - 500)));

        // Check for truncation specifically
        if (this.detectTruncation(cleanedContent)) {
          throw new Error(`Response was truncated. Content length: ${cleanedContent.length}. Consider increasing maxTokens or simplifying the query.`);
        }
      }

      let result;
      try {
        result = JSON.parse(cleanedContent);
      } catch (parseError) {
        console.error('JSON parsing failed, attempting to fix:', parseError);
        console.error('Content length:', cleanedContent.length);
        console.error('First 500 chars:', cleanedContent.substring(0, 500));
        console.error('Last 500 chars:', cleanedContent.substring(Math.max(0, cleanedContent.length - 500)));

        // Check for truncation
        if (this.detectTruncation(cleanedContent)) {
          const errorMessage = parseError instanceof Error ? parseError.message : String(parseError);
          const position = errorMessage.match(/position (\d+)/)?.[1] || 'unknown';
          throw new Error(`Response was truncated at position ${position}. Content length: ${cleanedContent.length}. Consider increasing maxTokens or simplifying the query.`);
        }
        
        // Try to fix common JSON issues
        let fixedContent = this.fixCommonJSONIssues(cleanedContent);
        
        try {
          result = JSON.parse(fixedContent);
        } catch (secondError) {
          console.error('First fix failed, trying aggressive fix:', secondError);
          
          // Try more aggressive JSON fixing
          fixedContent = this.aggressiveJSONFix(cleanedContent);
          result = JSON.parse(fixedContent);
        }
      }
      
      // Clean up dependsOn values to ensure they are arrays of numbers
      if (result.plan && result.plan.steps) {
        result.plan.steps = result.plan.steps.map((step: any) => ({
          ...step,
          dependsOn: this.cleanDependsOn(step.dependsOn),
          parallel: this.cleanBoolean(step.parallel)
        }));
      }
      
      return {
        plan: result.plan,
        reasoning: result.reasoning || '',
        confidence: result.confidence || 0.5
      };
    } catch (error) {
      console.error('Groq plan generation error:', error);
      throw new Error(`Plan generation failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  async refinePlan(request: PlanRefinementRequest): Promise<PlanRefinementResponse> {
    try {
      const prompt = this.buildPlanRefinementPrompt(request);
      
      const response = await this.groq.chat.completions.create({
        model: this.config.model,
        temperature: this.config.temperature,
        max_tokens: this.config.maxTokens,
        messages: [
          {
            role: 'system',
            content: 'You are an AI assistant that refines execution plans based on validation errors. Fix the identified issues and improve the plan. Respond with valid JSON only.'
          },
          {
            role: 'user',
            content: prompt
          }
        ]
      });

      const content = response.choices[0]?.message?.content;
      if (!content) {
        throw new Error('No response from Groq');
      }

      // Clean up the response to extract JSON from markdown if needed
      const cleanedContent = this.extractJSONFromResponse(content);
      const result = JSON.parse(cleanedContent);
      return {
        refinedPlan: result.refinedPlan,
        reasoning: result.reasoning || '',
        confidence: result.confidence || 0.5
      };
    } catch (error) {
      console.error('Groq plan refinement error:', error);
      throw new Error(`Plan refinement failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  /**
   * Validate JSON content before parsing
   */
  private validateJSON(content: string): { valid: boolean; errors: string[] } {
    const errors: string[] = [];

    // Check for truncation indicators
    if (this.detectTruncation(content)) {
      errors.push('Response appears to be truncated');
    }

    // Check for unterminated strings
    const stringMatches = content.match(/"[^"]*$/);
    if (stringMatches) {
      errors.push('Unterminated string detected');
    }

    // Check for missing closing brackets
    const openBraces = (content.match(/\{/g) || []).length;
    const closeBraces = (content.match(/\}/g) || []).length;
    if (openBraces !== closeBraces) {
      errors.push(`Mismatched braces: ${openBraces} open, ${closeBraces} close`);
    }

    const openBrackets = (content.match(/\[/g) || []).length;
    const closeBrackets = (content.match(/\]/g) || []).length;
    if (openBrackets !== closeBrackets) {
      errors.push(`Mismatched brackets: ${openBrackets} open, ${closeBrackets} close`);
    }

    return {
      valid: errors.length === 0,
      errors
    };
  }

  /**
   * Detect if JSON response was truncated
   */
  private detectTruncation(content: string): boolean {
    // Check for common truncation patterns
    if (content.endsWith('...') || content.endsWith('...\n')) {
      return true;
    }

    // Check if content ends mid-string
    const lastQuoteIndex = content.lastIndexOf('"');
    const lastNewlineIndex = content.lastIndexOf('\n');
    if (lastQuoteIndex > lastNewlineIndex && !content.endsWith('"')) {
      return true;
    }

    // Check if content ends mid-object/array
    const trimmed = content.trim();
    if (!trimmed.endsWith('}') && !trimmed.endsWith(']')) {
      return true;
    }

    // Check for extremely long repeated patterns (hallucination)
    const repeatedPattern = /(.)\1{100,}/;
    if (repeatedPattern.test(content)) {
      return true;
    }

    return false;
  }

  /**
   * Extract JSON from response, handling markdown formatting
   */
  private extractJSONFromResponse(content: string): string {
    // Remove markdown code blocks if present
    let cleaned = content.trim();

    // Check if response is wrapped in markdown code blocks
    if (cleaned.startsWith('```json') && cleaned.endsWith('```')) {
      cleaned = cleaned.slice(7, -3).trim();
    } else if (cleaned.startsWith('```') && cleaned.endsWith('```')) {
      cleaned = cleaned.slice(3, -3).trim();
    }

    // Remove any leading/trailing text that's not JSON
    const lines = cleaned.split('\n');
    let jsonLines: string[] = [];
    let inJson = false;
    let braceCount = 0;
    
    for (const line of lines) {
      const trimmedLine = line.trim();
      
      // Start of JSON object
      if (trimmedLine.startsWith('{')) {
        inJson = true;
        braceCount = 0;
      }
      
      if (inJson) {
        jsonLines.push(line);
        
        // Count braces to track JSON object boundaries
        for (const char of line) {
          if (char === '{') braceCount++;
          if (char === '}') braceCount--;
        }
        
        // End of JSON object
        if (braceCount === 0 && trimmedLine.endsWith('}')) {
          break;
        }
      }
    }

    if (jsonLines.length > 0) {
      cleaned = jsonLines.join('\n');
    } else {
      // Fallback: find JSON object boundaries
      const startIndex = cleaned.indexOf('{');
      const lastIndex = cleaned.lastIndexOf('}');
      
      if (startIndex !== -1 && lastIndex !== -1 && lastIndex > startIndex) {
        cleaned = cleaned.substring(startIndex, lastIndex + 1);
      }
    }
    
    return cleaned;
  }

  /**
   * Fix common JSON issues that might cause parsing failures
   */
  private fixCommonJSONIssues(content: string): string {
    let fixed = content;
    
    // Fix trailing commas
    fixed = fixed.replace(/,(\s*[}\]])/g, '$1');
    
    // Fix unquoted keys
    fixed = fixed.replace(/([{,]\s*)([a-zA-Z_][a-zA-Z0-9_]*)\s*:/g, '$1"$2":');
    
    // Fix single quotes to double quotes
    fixed = fixed.replace(/'/g, '"');
    
    // Fix missing quotes around string values that should be quoted
    fixed = fixed.replace(/:\s*([a-zA-Z_][a-zA-Z0-9_]*)\s*([,}])/g, ': "$1"$2');
    
    // Remove any trailing commas before closing braces/brackets
    fixed = fixed.replace(/,(\s*[}\]])/g, '$1');
    
    // Fix incomplete JSON by adding missing closing brackets
    const openBraces = (fixed.match(/\{/g) || []).length;
    const closeBraces = (fixed.match(/\}/g) || []).length;
    const openBrackets = (fixed.match(/\[/g) || []).length;
    const closeBrackets = (fixed.match(/\]/g) || []).length;
    
    // Add missing closing brackets
    for (let i = 0; i < openBrackets - closeBrackets; i++) {
      fixed += ']';
    }
    
    // Add missing closing braces
    for (let i = 0; i < openBraces - closeBraces; i++) {
      fixed += '}';
    }
    
    return fixed;
  }

  /**
   * More aggressive JSON fixing for complex malformed JSON
   */
  private aggressiveJSONFix(content: string): string {
    let fixed = content;
    
    // Remove any text before the first {
    const firstBrace = fixed.indexOf('{');
    if (firstBrace > 0) {
      fixed = fixed.substring(firstBrace);
    }
    
    // Remove any text after the last }
    const lastBrace = fixed.lastIndexOf('}');
    if (lastBrace !== -1 && lastBrace < fixed.length - 1) {
      fixed = fixed.substring(0, lastBrace + 1);
    }
    
    // Fix common issues
    fixed = this.fixCommonJSONIssues(fixed);
    
    // Try to fix incomplete JSON by finding the last complete object
    let lastCompleteIndex = -1;
    let braceCount = 0;
    
    for (let i = 0; i < fixed.length; i++) {
      if (fixed[i] === '{') braceCount++;
      if (fixed[i] === '}') braceCount--;
      
      if (braceCount === 0 && fixed[i] === '}') {
        lastCompleteIndex = i;
      }
    }
    
    if (lastCompleteIndex !== -1 && lastCompleteIndex < fixed.length - 1) {
      fixed = fixed.substring(0, lastCompleteIndex + 1);
    }
    
    return fixed;
  }

  /**
   * Clean up dependsOn values to ensure they are arrays of numbers
   */
  private cleanDependsOn(dependsOn: any): number[] {
    if (!dependsOn) return [];
    
    // If it's already an array of numbers, return as is
    if (Array.isArray(dependsOn) && dependsOn.every(item => typeof item === 'number')) {
      return dependsOn;
    }
    
    // If it's a string representation of an array, try to parse it
    if (typeof dependsOn === 'string') {
      try {
        const parsed = JSON.parse(dependsOn);
        if (Array.isArray(parsed)) {
          // Extract step numbers from objects like [{step: 0, output: 'id'}]
          return parsed.map(item => {
            if (typeof item === 'number') return item;
            if (typeof item === 'object' && item.step !== undefined) return item.step;
            return 0;
          }).filter(num => typeof num === 'number');
        }
      } catch (e) {
        // If parsing fails, return empty array
        return [];
      }
    }
    
    // If it's an array of objects, extract step numbers
    if (Array.isArray(dependsOn)) {
      return dependsOn.map(item => {
        if (typeof item === 'number') return item;
        if (typeof item === 'object' && item.step !== undefined) return item.step;
        return 0;
      }).filter(num => typeof num === 'number');
    }
    
    return [];
  }

  /**
   * Clean up boolean values to ensure they are actual booleans
   */
  private cleanBoolean(value: any): boolean {
    if (typeof value === 'boolean') {
      return value;
    }
    
    if (typeof value === 'string') {
      const lowerValue = value.toLowerCase();
      if (lowerValue === 'true') return true;
      if (lowerValue === 'false') return false;
    }
    
    // Default to false for any other value
    return false;
  }

  private buildCategorySelectionPrompt(request: CategorySelectionRequest): string {
    return `
Analyze this query and select the most relevant categories:

Query: "${request.query}"

${request.availableCategories}

${request.analysisFeedback ? `\nHistorical Context from Past Executions:\n${request.analysisFeedback}\n` : ''}

Select 1-3 primary categories that are most relevant to answering this query. Consider:
1. What type of data is being requested?
2. What entities are involved?
3. What operations are needed?
${request.analysisFeedback ? '4. What worked well in similar past queries?' : ''}
${request.analysisFeedback ? '5. What issues should be avoided based on past experience?' : ''}

Respond with JSON in this format:
{
  "categories": ["category1", "category2"],
  "reasoning": "Explanation of why these categories were selected",
  "confidence": 0.8
}
    `.trim();
  }

  private buildToolSelectionPrompt(request: ToolSelectionRequest): string {
    return `
Analyze this query and select the most appropriate tools:

Query: "${request.query}"

Available Tools (Compact Format):
${request.availableTools}

${request.analysisFeedback ? `\nHistorical Context from Past Executions:\n${request.analysisFeedback}\n` : ''}

CRITICAL INSTRUCTIONS:
- ONLY select tools from the "Available Tools" list above
- NEVER invent, create, or hallucinate tool names
- DO NOT use tools that are not explicitly listed
${request.failedTools && request.failedTools.length > 0 ? `- NEVER use these tools (they failed in past executions): ${request.failedTools.join(', ')}` : ''}

Tool Selection Rules:
- If a tool doesn't exist for a comparison operation, use multiple retrieval tools instead
- For "compare X between A and B", use: lookup A, lookup B, retrieve X from A, retrieve X from B
- The comparison can be done by retrieving data from both sources separately

Select the tools that are most relevant to answering this query. Consider:
1. What data needs to be retrieved?
2. What operations need to be performed?
3. What relationships exist between entities (see 'deps' field)?
${request.analysisFeedback ? '4. What tools worked well in similar past queries?' : ''}
${request.analysisFeedback ? '5. What tools caused issues in past executions?' : ''}

Respond with JSON in this format:
{
  "tools": ["tool1", "tool2"],
  "reasoning": "Explanation of why these tools were selected",
  "entities": ["entity1", "entity2"],
  "confidence": 0.8
}
    `.trim();
  }

  private buildPlanGenerationPrompt(request: PlanGenerationRequest): string {
    return `
Create an execution plan for this query:

Query: "${request.query}"
Selected Tools: ${request.selectedTools.join(', ')}
Request ID: ${request.requestId}

${request.historicalContext ? `Historical Context:\n${request.historicalContext}\n` : ''}
${request.analysisFeedback ? `\nAnalysis Feedback from Past Executions:\n${request.analysisFeedback}\n` : ''}

Tool Schemas:
${JSON.stringify(request.toolSchemas, null, 2)}

CRITICAL TOOL USAGE RULES:
- ONLY use tools from the "Selected Tools" list: ${request.selectedTools.join(', ')}
- NEVER create, invent, or hallucinate tool names
- Each step MUST use a tool from the Selected Tools list
- If you cannot complete the query with available tools, use the closest available tools
${request.failedTools && request.failedTools.length > 0 ? `- FORBIDDEN TOOLS (known to fail): ${request.failedTools.join(', ')} - DO NOT USE THESE` : ''}

Generate a detailed execution plan with:
1. Proper parameter resolution (use actual values, not placeholders or text descriptions)
2. Dependency management between steps (dependsOn must be array of step indices as numbers)
3. Parallel execution where possible
4. Clear descriptions for each step
${request.analysisFeedback ? '5. Apply lessons learned from past executions' : ''}
${request.analysisFeedback ? '6. Avoid patterns that caused issues in similar queries' : ''}

VARIABLE REFERENCE FORMAT (MANDATORY):
- ALWAYS use: \${step_N.result.field} or \${step_N.result[index].field}
- NEVER use: \${entity_name.field}, \${facility_1.uid}, \${shipment_2.id}, etc.
- N is the step index (0-based) that produces the data you need
- The step must be listed in dependsOn array

FACILITY LOOKUP PATTERN (CRITICAL):
When the query mentions facility NAMES (not IDs), you MUST:
1. Use facilities_list to search by name first
2. Extract the facility UID from results
3. Use that UID in subsequent steps

NEVER generate fake facility IDs like "5f9b3a3a3a3a..."
ALWAYS use facilities_list to find facilities by name first

COMPARISON QUERY PATTERN (NEW):
For comparison queries (e.g., "Compare X between facility A and facility B"):
1. Mark facility lookups as parallel (no dependencies between them)
2. Use facilities_list to search by name for each facility
3. Extract facility IDs and use them in subsequent data retrieval steps
4. Mark data retrieval steps as parallel if they don't depend on each other
5. Ensure proper variable references using \${step_N.result} format

STEP-BY-STEP EXAMPLES:

Example 1: List and Get Pattern
Query: "Get details for the first 3 facilities"
Step 0: facilities_list → returns {items: [{uid: "abc"}, {uid: "def"}, {uid: "ghi"}]}
Step 1: facilities_get → params: {"id": "\${step_0.result[0]._id}"}, dependsOn: [0]
Step 2: facilities_get → params: {"id": "\${step_0.result[1]._id}"}, dependsOn: [0]
Step 3: facilities_get → params: {"id": "\${step_0.result[2]._id}"}, dependsOn: [0]

Example 2: Get and Update Pattern
Query: "Update facility ABC's name"
Step 0: facilities_get → params: {"id": "ABC"}
Step 1: facilities_update → params: {"id": "\${step_0.result._id}", "name": "New Name"}, dependsOn: [0]

Example 3: List with Filter Pattern
Query: "Get shipments for facility ABC"
Step 0: facilities_get → params: {"id": "ABC"}
Step 1: shipments_list → params: {"facility_id": "\${step_0.result[0]._id}", "page": 1, "limit": 10}, dependsOn: [0]

Example 4: Complex CRUD Chain
Query: "Create shipment for first facility and update its status"
Step 0: facilities_list → params: {"page": 1, "limit": 1}
Step 1: shipments_create → params: {"facility_id": "\${step_0.result[0]._id}", "waste_type": "hazardous"}, dependsOn: [0]
Step 2: shipments_update → params: {"id": "\${step_1.result._id}", "status": "in_transit"}, dependsOn: [1]

Example 5: Facility Name Search (CRITICAL)
Query: "Get shipments from Bosco, Bruen and Wehner Sorting Center"
Step 0: facilities_list → params: {"page": 1, "limit": 10, "name": "Bosco, Bruen and Wehner"}
Step 1: shipments_list → params: {"facility_id": "\${step_0.result[0]._id}", "page": 1, "limit": 10}, dependsOn: [0]

Example 6: Multiple Facility Names
Query: "Get shipments from ABC and XYZ facilities"
Step 0: facilities_list → params: {"page": 1, "limit": 20}
Step 1: shipments_list → params: {"page": 1, "limit": 100}, dependsOn: [0]
Note: Filter by facility names in analysis step

Example 7: Comparison Query Pattern (CRITICAL)
Query: "Compare contaminants found in 'Bosco, Bruen and Wehner Sorting Center' and 'Tremblay Inc Waste Processing Facility'"
Step 0: facilities_list → params: {"name": "Bosco, Bruen and Wehner Sorting Center", "page": 1, "limit": 1}, parallel: true, dependsOn: []
Step 1: facilities_list → params: {"name": "Tremblay Inc Waste Processing Facility", "page": 1, "limit": 1}, parallel: true, dependsOn: []
Step 2: contaminants_list → params: {"facility_id": "\${step_0.result[0]._id}", "page": 1, "limit": 100}, parallel: true, dependsOn: [0]
Step 3: contaminants_list → params: {"facility_id": "\${step_1.result[0]._id}", "page": 1, "limit": 100}, parallel: true, dependsOn: [1]

Example 7: Single Facility Name
Query: "Show me all shipments from ABC Facility"
Step 0: facilities_list → params: {"page": 1, "limit": 10, "name": "ABC Facility"}
Step 1: shipments_list → params: {"facility_id": "\${step_0.result[0]._id}", "page": 1, "limit": 10}, dependsOn: [0]

ANTI-PATTERNS (NEVER DO THIS):
❌ {"id": "\${facility_1._id}"} - Wrong! Use step index
❌ {"id": "\${first_facility}"} - Wrong! Use step index
❌ {"id": "result_from_step_0"} - Wrong! Use \${step_0.result.field}
❌ {"id": ""} - Wrong! Never use empty strings
❌ {"id": "placeholder"} - Wrong! No placeholder text
❌ {"id": "ObjectId of..."} - Wrong! No descriptive text
❌ {"page": "1", "limit": "10"} - Wrong! Use numbers not strings
❌ {"id": "5f9b3a3a3a3a3a3a3a3a..."} - Wrong! Never generate fake facility IDs
❌ {"id": "Bosco, Bruen and Wehner"} - Wrong! Use facilities_list to find by name first

CRITICAL PARAMETER RULES:
- For list operations: ALWAYS include page: 1, limit: 10
- For get operations: Use step references like {"id": "\${step_0.result[0]._id}"}
- For optional filters: Use null (not "null" string) or omit the parameter
- For dates: Use ISO 8601 format: "2024-01-01T00:00:00.000Z"
- For booleans: Use true/false (not strings)
- Use EXACT parameter names from tool schemas (e.g., "uid" not "id")
- NEVER use placeholder text like "ObjectId of..." or "null" as strings

IMPORTANT: dependsOn must be an array of numbers representing step indices (e.g., [0, 1] not [{"step": 0}]).

CRITICAL: Generate COMPLETE JSON with all required closing brackets and braces. Do not truncate the response.

Respond with JSON in this format:
{
  "plan": {
    "steps": [
      {
        "tool": "tool_name",
        "params": {"param1": "value1"},
        "dependsOn": [0],
        "parallel": false,
        "description": "What this step does"
      }
    ],
    "metadata": {
      "query": "${request.query}",
      "requestId": "${request.requestId}",
      "estimatedDurationMs": 5000,
      "totalSteps": 1,
      "parallelSteps": 0
    }
  },
  "reasoning": "Explanation of the plan",
  "confidence": 0.8
}
    `.trim();
  }

  private buildPlanRefinementPrompt(request: PlanRefinementRequest): string {
    return `
Refine this execution plan based on validation errors:

Query: "${request.query}"

Original Plan:
${JSON.stringify(request.originalPlan, null, 2)}

Validation Errors:
${request.validationErrors.join('\n')}

Tool Schemas:
${JSON.stringify(request.toolSchemas, null, 2)}

Fix the identified issues and improve the plan. Respond with JSON in this format:
{
  "refinedPlan": {
    "steps": [...],
    "metadata": {...}
  },
  "reasoning": "Explanation of the refinements made",
  "confidence": 0.8
}
    `.trim();
  }
}

export function createGroqService(config?: Partial<GroqConfig>): GroqService {
  return new GroqService(config);
}
