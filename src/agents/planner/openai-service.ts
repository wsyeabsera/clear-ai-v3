// OpenAI service for intelligent planning

import OpenAI from 'openai';
import dotenv from 'dotenv';

dotenv.config();

export interface OpenAIConfig {
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
}

export interface ToolSelectionResponse {
  tools: string[];
  reasoning: string;
  entities: string[];
  confidence: number;
}

export interface PlanGenerationRequest {
  query: string;
  selectedTools: string[];
  toolSchemas: Record<string, any>;
  entities: string[];
  requestId: string;
  analysisFeedback?: string;
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
      totalSteps: number;
      parallelSteps: number;
    };
  };
  reasoning: string;
  confidence: number;
}

export interface PlanRefinementRequest {
  query: string;
  plan: any;
  validationErrors: string[];
  toolSchemas: Record<string, any>;
}

export class OpenAIService {
  private client: OpenAI;
  private config: OpenAIConfig;

  constructor(config: OpenAIConfig) {
    this.config = config;
    this.client = new OpenAI({
      apiKey: config.apiKey,
      timeout: config.timeout,
    });
  }

  /**
   * Select tools for a given query using LLM reasoning
   */
  async selectTools(request: ToolSelectionRequest): Promise<ToolSelectionResponse> {
    const prompt = this.buildToolSelectionPrompt(request);
    
    try {
      const response = await this.client.chat.completions.create({
        model: this.config.model,
        messages: [
          {
            role: 'system',
            content: this.getSystemPrompt()
          },
          {
            role: 'user',
            content: prompt
          }
        ],
        temperature: this.config.temperature,
        max_tokens: this.config.maxTokens,
        response_format: { type: 'json_object' }
      });

      const content = response.choices[0]?.message?.content;
      if (!content) {
        throw new Error('No response content from OpenAI');
      }

      const result = JSON.parse(content) as ToolSelectionResponse;
      
      // Validate response structure
      if (!result.tools || !Array.isArray(result.tools)) {
        throw new Error('Invalid tool selection response structure');
      }

      return result;
    } catch (error) {
      console.error('OpenAI tool selection error:', error);
      throw new Error(`Tool selection failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  /**
   * Generate a plan using selected tools
   */
  async generatePlan(request: PlanGenerationRequest): Promise<PlanGenerationResponse> {
    const prompt = this.buildPlanGenerationPrompt(request);
    
    try {
      const response = await this.client.chat.completions.create({
        model: this.config.model,
        messages: [
          {
            role: 'system',
            content: this.getSystemPrompt()
          },
          {
            role: 'user',
            content: prompt
          }
        ],
        temperature: this.config.temperature,
        max_tokens: this.config.maxTokens,
        response_format: { type: 'json_object' }
      });

      const content = response.choices[0]?.message?.content;
      if (!content) {
        throw new Error('No response content from OpenAI');
      }

      const result = JSON.parse(content) as PlanGenerationResponse;
      
      // Validate response structure
      if (!result.plan || !result.plan.steps || !Array.isArray(result.plan.steps)) {
        throw new Error('Invalid plan generation response structure');
      }

      return result;
    } catch (error) {
      console.error('OpenAI plan generation error:', error);
      throw new Error(`Plan generation failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  /**
   * Refine a plan based on validation errors
   */
  async refinePlan(request: PlanRefinementRequest): Promise<PlanGenerationResponse> {
    const prompt = this.buildPlanRefinementPrompt(request);
    
    try {
      const response = await this.client.chat.completions.create({
        model: this.config.model,
        messages: [
          {
            role: 'system',
            content: this.getSystemPrompt()
          },
          {
            role: 'user',
            content: prompt
          }
        ],
        temperature: this.config.temperature,
        max_tokens: this.config.maxTokens,
        response_format: { type: 'json_object' }
      });

      const content = response.choices[0]?.message?.content;
      if (!content) {
        throw new Error('No response content from OpenAI');
      }

      const result = JSON.parse(content) as PlanGenerationResponse;
      
      // Validate response structure
      if (!result.plan || !result.plan.steps || !Array.isArray(result.plan.steps)) {
        throw new Error('Invalid plan refinement response structure');
      }

      return result;
    } catch (error) {
      console.error('OpenAI plan refinement error:', error);
      throw new Error(`Plan refinement failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  private getSystemPrompt(): string {
    return `You are an expert planning agent for waste management operations. Your role is to:

1. Analyze user queries and understand their intent
2. Select appropriate tools from the available MCP (Model Context Protocol) tools
3. Generate structured execution plans with proper dependencies
4. Handle complex multi-step operations intelligently

Key principles:
- Always consider data dependencies (e.g., need facility_id before querying bunkers)
- Use proper parameter values, never placeholders
- Identify opportunities for parallel execution
- Create clear, human-readable step descriptions
- Handle natural language date/time expressions
- Consider pagination and filtering requirements

Available tool categories:
- clients: Client management (create, get, update, delete, list)
- facilities: Facility management
- shipments: Shipment tracking and management
- contaminants: Contaminant tracking
- inspections: Inspection records
- contracts: Contract management
- waste_codes: Waste code classifications
- waste_generators: Waste generator records
- waste_properties: Waste property details
- bunkers: Bunker management

Always respond with valid JSON matching the expected response format.`;
  }

  private buildToolSelectionPrompt(request: ToolSelectionRequest): string {
    return `Analyze this query and select the appropriate tools:

Query: "${request.query}"

Available Tools:
${request.availableTools}

Tool Schemas:
${JSON.stringify(request.toolSchemas, null, 2)}

${request.analysisFeedback ? `\nHistorical Context from Past Executions:\n${request.analysisFeedback}\n` : ''}

Please respond with JSON in this exact format:
{
  "tools": ["tool1", "tool2"],
  "reasoning": "Explanation of why these tools were selected",
  "entities": ["entity1", "entity2"],
  "confidence": 0.95
}`;
  }

  private buildPlanGenerationPrompt(request: PlanGenerationRequest): string {
    return `Generate an execution plan for this query:

Query: "${request.query}"
Request ID: "${request.requestId}"

Selected Tools: ${request.selectedTools.join(', ')}
Entities: ${request.entities.join(', ')}

Tool Schemas:
${JSON.stringify(request.toolSchemas, null, 2)}

${request.analysisFeedback ? `\nAnalysis Feedback from Past Executions:\n${request.analysisFeedback}\n` : ''}

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

Requirements:
- Use proper parameter values (no placeholders)
- Create dependency chains using \${step_N.result.field} syntax
- Mark parallel steps where appropriate
- Add clear descriptions for each step
- Handle pagination intelligently (use reasonable limits)
- Extract dates from natural language
- Use the EXACT requestId provided in the query (do not generate a new one)
${request.analysisFeedback ? '- Apply lessons learned from past executions' : ''}
${request.analysisFeedback ? '- Avoid patterns that caused issues in similar queries' : ''}

Please respond with JSON in this exact format:
{
  "plan": {
    "steps": [
      {
        "tool": "tool_name",
        "params": { "param1": "value1" },
        "dependsOn": [0],
        "parallel": false,
        "description": "Clear description of what this step does"
      }
    ],
    "metadata": {
      "query": "original query",
      "requestId": "${request.requestId}",
      "totalSteps": 2,
      "parallelSteps": 0
    }
  },
  "reasoning": "Explanation of the plan structure and logic",
  "confidence": 0.95
}`;
  }

  private buildPlanRefinementPrompt(request: PlanRefinementRequest): string {
    return `Refine this plan to fix the validation errors:

Original Query: "${request.query}"

Current Plan:
${JSON.stringify(request.plan, null, 2)}

Validation Errors:
${request.validationErrors.join('\n')}

Tool Schemas:
${JSON.stringify(request.toolSchemas, null, 2)}

Please fix the errors and respond with JSON in this exact format:
{
  "plan": {
    "steps": [
      {
        "tool": "tool_name",
        "params": { "param1": "value1" },
        "dependsOn": [0],
        "parallel": false,
        "description": "Clear description of what this step does"
      }
    ],
    "metadata": {
      "query": "original query",
      "requestId": "same_request_id",
      "totalSteps": 2,
      "parallelSteps": 0
    }
  },
  "reasoning": "Explanation of what was fixed",
  "confidence": 0.95
}`;
  }
}

/**
 * Create OpenAI service with environment configuration
 */
export function createOpenAIService(): OpenAIService {
  const config: OpenAIConfig = {
    apiKey: process.env.OPENAI_API_KEY || '',
    model: process.env.OPENAI_MODEL || 'gpt-4o-mini',
    temperature: parseFloat(process.env.PLANNER_TEMPERATURE || '0.3'),
    maxTokens: parseInt(process.env.PLANNER_MAX_TOKENS || '2000'),
    timeout: parseInt(process.env.PLANNER_TIMEOUT_MS || '30000')
  };

  if (!config.apiKey) {
    throw new Error('OPENAI_API_KEY environment variable is required');
  }

  return new OpenAIService(config);
}
