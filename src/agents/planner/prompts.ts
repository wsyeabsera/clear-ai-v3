// Advanced prompt templates for intelligent planning

import { MCPTool } from './types';

export interface PromptContext {
  query: string;
  availableTools: MCPTool[];
  selectedTools?: string[];
  entities?: string[];
  toolSchemas?: Record<string, any>;
  validationErrors?: string[];
  currentPlan?: any;
  requestId?: string;
}

export class PromptBuilder {
  /**
   * Build system prompt for the planning agent
   */
  static buildSystemPrompt(): string {
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

  /**
   * Build tool selection prompt
   */
  static buildToolSelectionPrompt(context: PromptContext): string {
    const toolsDescription = this.formatToolsForSelection(context.availableTools);
    
    return `Analyze this query and select the appropriate tools:

Query: "${context.query}"

Available Tools:
${toolsDescription}

Please respond with JSON in this exact format:
{
  "tools": ["tool1", "tool2"],
  "reasoning": "Explanation of why these tools were selected",
  "entities": ["entity1", "entity2"],
  "confidence": 0.95
}

Guidelines:
- Select tools that are necessary to fulfill the query
- Consider data dependencies (e.g., need facilities before bunkers)
- Include tools for both data retrieval and any modifications
- Be specific about which entity types are involved`;
  }

  /**
   * Build plan generation prompt
   */
  static buildPlanGenerationPrompt(context: PromptContext): string {
    const toolSchemas = this.formatToolSchemas(context.availableTools);
    
    return `Generate an execution plan for this query:

Query: "${context.query}"
Request ID: "${context.requestId || 'generate_uuid_here'}"

Selected Tools: ${context.selectedTools?.join(', ') || 'None specified'}
Entities: ${context.entities?.join(', ') || 'None specified'}

Tool Schemas:
${toolSchemas}

Requirements:
- Use proper parameter values (no placeholders)
- Create dependency chains using \${step_N.result.field} syntax
- Mark parallel steps where appropriate
- Add clear descriptions for each step
- Handle pagination intelligently (use reasonable limits)
- Extract dates from natural language
- Use the provided requestId in metadata

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
      "requestId": "${context.requestId}",
      "totalSteps": 2,
      "parallelSteps": 0
    }
  },
  "reasoning": "Explanation of the plan structure and logic",
  "confidence": 0.95
}`;
  }

  /**
   * Build plan refinement prompt
   */
  static buildPlanRefinementPrompt(context: PromptContext): string {
    const toolSchemas = this.formatToolSchemas(context.availableTools);
    
    return `Refine this plan to fix the validation errors:

Original Query: "${context.query}"

Current Plan:
${JSON.stringify(context.currentPlan, null, 2)}

Validation Errors:
${context.validationErrors?.join('\n') || 'No specific errors'}

Tool Schemas:
${toolSchemas}

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

  /**
   * Format tools for selection prompt
   */
  private static formatToolsForSelection(tools: MCPTool[]): string {
    const categories = this.groupToolsByCategory(tools);
    
    let result = '';
    for (const [category, categoryTools] of Object.entries(categories)) {
      result += `\n${category.toUpperCase()}:\n`;
      categoryTools.forEach(tool => {
        result += `  - ${tool.name}: ${tool.description}\n`;
      });
    }
    
    return result;
  }

  /**
   * Format tool schemas for plan generation
   */
  private static formatToolSchemas(tools: MCPTool[]): string {
    const schemas: Record<string, any> = {};
    
    tools.forEach(tool => {
      schemas[tool.name] = {
        description: tool.description,
        inputSchema: tool.inputSchema
      };
    });
    
    return JSON.stringify(schemas, null, 2);
  }

  /**
   * Group tools by category
   */
  private static groupToolsByCategory(tools: MCPTool[]): Record<string, MCPTool[]> {
    const categories: Record<string, MCPTool[]> = {};
    
    tools.forEach(tool => {
      const category = tool.name.split('_')[0];
      if (!categories[category]) {
        categories[category] = [];
      }
      categories[category].push(tool);
    });
    
    return categories;
  }
}

/**
 * Pre-built prompts for common scenarios
 */
export const CommonPrompts = {
  /**
   * Prompt for complex multi-entity queries
   */
  complexQuery: (query: string) => `This is a complex query that may require multiple steps:

"${query}"

Consider:
- Data relationships between entities
- Proper sequencing of operations
- Parallel execution where possible
- Parameter dependencies between steps`,

  /**
   * Prompt for date/time extraction
   */
  dateExtraction: (query: string) => `Extract and convert date/time expressions from this query:

"${query}"

Convert to ISO 8601 format:
- "last week" → 7 days ago
- "yesterday" → 1 day ago
- "this month" → start of current month
- "last month" → start of previous month
- "today" → start of current day`,

  /**
   * Prompt for parameter resolution
   */
  parameterResolution: (query: string, toolName: string, requiredParams: string[]) => `Resolve parameters for tool "${toolName}" based on this query:

Query: "${query}"
Required Parameters: ${requiredParams.join(', ')}

Extract values from the query or provide reasonable defaults:
- For dates: convert natural language to ISO format
- For IDs: use dependency expressions like \${step_N.result.id}
- For filters: extract relevant terms from query
- For pagination: use reasonable defaults (page: 1, limit: 50)`
};
