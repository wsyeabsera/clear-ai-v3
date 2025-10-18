// LangChain-based Planner Agent (simplified workflow)

import { randomUUID } from 'crypto';
// import { BaseLanguageModel } from '@langchain/core/dist/language_models/base';
import { HumanMessage, SystemMessage } from '@langchain/core/dist/messages';
import { PlannerState, Plan, PlanResponse, PlanStatus, MCPTool } from './types';
import { ToolAdapter } from './tool-adapter';
import { PlanValidator } from './validator';
import { PlanStorage } from './storage';
import { LLMProviderFactory } from './llm-provider';
import { getPlannerConfig } from './config';

export class LangChainPlannerAgent {
  private llmFactory: LLMProviderFactory;
  private tools: MCPTool[];
  
  constructor() {
    const config = getPlannerConfig();
    this.llmFactory = new LLMProviderFactory(config);
    this.tools = ToolAdapter.getAvailableTools();
  }
  
  /**
   * Create a plan for a given query using LangChain
   */
  async plan(query: string, llmProvider?: string): Promise<PlanResponse> {
    const requestId = randomUUID();
    const startTime = new Date();
    
    try {
      // Initialize LLM
      const llm = await this.llmFactory.createWithFallback(llmProvider);
      
      // Step 1: Parse query
      const parsedQuery = await this.parseQuery(llm, query);
      
      // Step 2: Select tools
      const selectedTools = await this.selectTools(llm, query, parsedQuery);
      
      // Step 3: Generate plan
      const plan = await this.generatePlan(llm, query, selectedTools, requestId);
      
      // Step 4: Validate plan
      const validator = new PlanValidator(this.tools);
      const validation = validator.validatePlan(plan);
      
      // Step 5: Refine if needed
      let finalPlan = plan;
      let refinementCount = 0;
      const maxRefinements = 3;
      
      while (!validation.isValid && refinementCount < maxRefinements) {
        finalPlan = await this.refinePlan(llm, plan, validation.errors);
        const newValidation = validator.validatePlan(finalPlan);
        if (newValidation.isValid) {
          break;
        }
        refinementCount++;
      }
      
      // Step 6: Save plan
      await PlanStorage.savePlan(
        requestId,
        query,
        finalPlan,
        llmProvider || 'openai',
        validation.errors
      );
      
      const endTime = Date.now();
      const executionTime = endTime - startTime.getTime();
      
      // Update status
      await PlanStorage.updatePlanStatus(requestId, PlanStatus.COMPLETED, executionTime);
      
      return {
        requestId,
        query,
        plan: finalPlan,
        status: PlanStatus.COMPLETED,
        createdAt: startTime.toISOString(),
        executionTimeMs: executionTime,
        validationErrors: validation.errors
      };
      
    } catch (error) {
      console.error('Planner agent error:', error);
      
      // Update status to failed
      await PlanStorage.updatePlanStatus(requestId, PlanStatus.FAILED);
      
      return {
        requestId,
        query,
        plan: {
          steps: [],
          metadata: {
            query,
            requestId,
            totalSteps: 0,
            parallelSteps: 0
          }
        },
        status: PlanStatus.FAILED,
        createdAt: startTime.toISOString(),
        validationErrors: [error instanceof Error ? error.message : 'Unknown error']
      };
    }
  }
  
  /**
   * Parse user query using LLM
   */
  private async parseQuery(llm: any, query: string): Promise<any> {
    const systemPrompt = `You are a planning agent that analyzes user queries to understand their intent and requirements.

Your task is to:
1. Extract the main intent from the user query
2. Identify key entities and parameters mentioned
3. Determine the complexity of the request

Respond with a JSON object containing:
- intent: A clear description of what the user wants to accomplish
- entities: Array of key entities mentioned (e.g., "shipments", "facilities", "contaminants")
- parameters: Object of parameters mentioned (e.g., {"date_range": "last week", "status": "contaminated"})
- complexity: "simple", "moderate", or "complex"

User Query: "${query}"`;

    const messages = [
      new SystemMessage(systemPrompt),
      new HumanMessage(query)
    ];
    
    const response = await llm.invoke(messages);
    return JSON.parse(response.content as string);
  }
  
  /**
   * Select tools using LLM
   */
  private async selectTools(llm: any, query: string, parsedQuery: any): Promise<string[]> {
    const toolsDescription = ToolAdapter.formatToolsForLLM(this.tools);
    
    const systemPrompt = `You are a tool selection expert. Based on the user query, select the most appropriate tools from the available options.

${toolsDescription}

Rules:
1. Only select tools that are directly relevant to the query
2. Consider the query intent and entities
3. Select tools in logical order (e.g., list before get, create before update)
4. Be conservative - it's better to select fewer tools than too many

Respond with a JSON object containing:
- selectedTools: Array of tool names
- reasoning: Brief explanation of why these tools were selected
- confidence: Number between 0 and 1

User Query: "${query}"`;

    const messages = [
      new SystemMessage(systemPrompt),
      new HumanMessage(query)
    ];
    
    const response = await llm.invoke(messages);
    const result = JSON.parse(response.content as string);
    
    // Filter to only include tools that actually exist
    return result.selectedTools.filter((toolName: string) => 
      this.tools.some(tool => tool.name === toolName)
    );
  }
  
  /**
   * Generate plan using LLM
   */
  private async generatePlan(llm: any, query: string, selectedTools: string[], requestId: string): Promise<Plan> {
    const toolsDescription = ToolAdapter.formatToolsForLLM(
      this.tools.filter(tool => selectedTools.includes(tool.name))
    );
    
    const systemPrompt = `You are a planning expert. Create a detailed execution plan using the selected tools.

${toolsDescription}

Rules:
1. Create steps that use the selected tools
2. Identify dependencies between steps (use dependsOn array with step indices)
3. Mark steps that can run in parallel (parallel: true)
4. Provide realistic parameters for each tool
5. Add descriptions for each step
6. Ensure logical flow and data dependencies

Respond with a JSON object containing:
- plan: Object with steps array and metadata
- reasoning: Explanation of the plan structure
- confidence: Number between 0 and 1

Plan structure:
{
  "steps": [
    {
      "tool": "tool_name",
      "params": {"param1": "value1"},
      "dependsOn": [0],
      "parallel": false,
      "description": "Step description"
    }
  ],
  "metadata": {
    "query": "original query",
    "requestId": "request_id",
    "totalSteps": 2,
    "parallelSteps": 0
  }
}

User Query: "${query}"
Selected Tools: ${selectedTools.join(', ')}`;

    const messages = [
      new SystemMessage(systemPrompt),
      new HumanMessage(query)
    ];
    
    const response = await llm.invoke(messages);
    const result = JSON.parse(response.content as string);
    
    return result.plan;
  }
  
  /**
   * Refine plan using LLM
   */
  private async refinePlan(llm: any, plan: Plan, errors: string[]): Promise<Plan> {
    const systemPrompt = `You are a plan refinement expert. Fix the validation errors in the plan.

Current Plan:
${JSON.stringify(plan, null, 2)}

Validation Errors:
${errors.join('\n')}

Available Tools:
${ToolAdapter.formatToolsForLLM(this.tools)}

Rules:
1. Fix all validation errors
2. Maintain the original intent
3. Use only available tools
4. Ensure proper parameter types and required fields
5. Fix dependency issues

Respond with the corrected plan in the same JSON format.`;

    const messages = [
      new SystemMessage(systemPrompt),
      new HumanMessage(`Fix these errors: ${errors.join(', ')}`)
    ];
    
    const response = await llm.invoke(messages);
    return JSON.parse(response.content as string);
  }
  
  /**
   * Get a plan by request ID
   */
  async getPlan(requestId: string): Promise<PlanResponse | null> {
    const planRequest = await PlanStorage.getPlanByRequestId(requestId);
    
    if (!planRequest) {
      return null;
    }
    
    return {
      requestId: planRequest.requestId,
      query: planRequest.query,
      plan: planRequest.plan,
      status: planRequest.status,
      createdAt: planRequest.createdAt.toISOString(),
      executionTimeMs: planRequest.executionTimeMs,
      validationErrors: planRequest.validationErrors
    };
  }
  
  /**
   * Get plan statistics
   */
  async getStatistics() {
    return await PlanStorage.getPlanStatistics();
  }
  
  /**
   * Get recent plans
   */
  async getRecentPlans(limit: number = 50) {
    const plans = await PlanStorage.getRecentPlans(limit);
    return plans.map(plan => ({
      requestId: plan.requestId,
      query: plan.query,
      status: plan.status,
      createdAt: plan.createdAt.toISOString(),
      executionTimeMs: plan.executionTimeMs
    }));
  }
  
  /**
   * Delete a plan
   */
  async deletePlan(requestId: string): Promise<boolean> {
    return await PlanStorage.deletePlan(requestId);
  }
  
  /**
   * Test the agent with a simple query
   */
  async test(query: string = 'List all shipments'): Promise<PlanResponse> {
    console.log(`Testing LangChain planner agent with query: "${query}"`);
    return await this.plan(query);
  }
}
