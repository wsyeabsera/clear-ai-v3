// Intelligent Planner Agent (LLM-powered)

import { randomUUID } from 'crypto';
import { PlannerState, Plan, PlanResponse, PlanStatus, MCPTool, PlanningContext, LLMToolSelectionRequest, LLMPlanGenerationRequest, LLMPlanRefinementRequest } from './types';
import { ToolAdapter } from './tool-adapter';
import { PlanValidator } from './validator';
import { PlanStorage } from './storage';
import { OpenAIService, createOpenAIService } from './openai-service';
import { PromptBuilder } from './prompts';
import { ParameterResolver } from './parameter-resolver';

export class PlannerAgent {
  private tools: MCPTool[];
  private openaiService: OpenAIService;
  private validator: PlanValidator;
  
  constructor() {
    this.tools = ToolAdapter.getAvailableTools();
    this.openaiService = createOpenAIService();
    this.validator = new PlanValidator(this.tools);
  }
  
  /**
   * Create a plan for a given query using LLM-powered intelligence
   */
  async plan(query: string, llmProvider?: string, skipDatabase: boolean = false): Promise<PlanResponse> {
    const requestId = randomUUID();
    const startTime = new Date();
    
    try {
      console.log(`🤖 Creating intelligent plan for: "${query}"`);
      
      // Step 1: Select tools using LLM
      const toolSelection = await this.selectToolsWithLLM(query);
      console.log(`🔧 Selected tools: ${toolSelection.tools.join(', ')}`);
      console.log(`💭 Reasoning: ${toolSelection.reasoning}`);
      
      // Step 2: Generate plan using LLM
      const planGeneration = await this.generatePlanWithLLM(query, toolSelection, requestId);
      console.log(`📋 Generated plan with ${planGeneration.plan.steps.length} steps`);
      
      // Ensure the plan metadata uses the correct requestId
      planGeneration.plan.metadata.requestId = requestId;
      
      // Step 3: Validate plan
      const validation = this.validator.validatePlan(planGeneration.plan);
      
      // Step 4: Refine plan if needed
      let finalPlan = planGeneration.plan;
      let refinementCount = 0;
      const maxRefinements = 3;

      while (!validation.isValid && refinementCount < maxRefinements) {
        console.log(`🔧 Refining plan (attempt ${refinementCount + 1}/${maxRefinements})`);
        const refinement = await this.refinePlanWithLLM(query, finalPlan, validation.errors);
        finalPlan = refinement.plan;
        
        // Ensure the refined plan metadata uses the correct requestId
        finalPlan.metadata.requestId = requestId;

        const newValidation = this.validator.validatePlan(finalPlan);
        if (newValidation.isValid) {
          console.log(`✅ Plan refined successfully`);
          break;
        }

        refinementCount++;
      }

      const endTime = Date.now();
      const executionTime = endTime - startTime.getTime();

      // Step 5: Save plan (only if not skipping database)
      if (!skipDatabase) {
        try {
          await PlanStorage.savePlan(
            requestId,
            query,
            finalPlan,
            llmProvider || 'openai',
            validation.errors
          );

          // Update status
          await PlanStorage.updatePlanStatus(requestId, PlanStatus.COMPLETED, executionTime);
        } catch (dbError) {
          console.warn('Database operation failed, continuing without persistence:', dbError);
        }
      }

      console.log(`✅ Plan created successfully in ${executionTime}ms`);

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
      console.error('❌ Planner agent error:', error);
      
      // Update status to failed (only if not skipping database)
      if (!skipDatabase) {
        try {
          await PlanStorage.updatePlanStatus(requestId, PlanStatus.FAILED);
        } catch (dbError) {
          console.warn('Database operation failed:', dbError);
        }
      }
      
      const endTime = Date.now();
      const executionTime = endTime - startTime.getTime();
      
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
        executionTimeMs: executionTime,
        validationErrors: [error instanceof Error ? error.message : 'Unknown error']
      };
    }
  }
  
  /**
   * Select tools using LLM intelligence
   */
  private async selectToolsWithLLM(query: string) {
    const toolSchemas = this.tools.reduce((acc, tool) => {
      acc[tool.name] = tool.inputSchema;
      return acc;
    }, {} as Record<string, any>);
    
    const availableToolsDescription = ToolAdapter.formatToolsForLLMWithContext(this.tools);
    
    const request: LLMToolSelectionRequest = {
      query,
      availableTools: this.tools
    };
    
    return await this.openaiService.selectTools({
      query,
      availableTools: availableToolsDescription,
      toolSchemas
    });
  }
  
  /**
   * Generate plan using LLM intelligence
   */
  private async generatePlanWithLLM(query: string, toolSelection: any, requestId: string) {
    const toolSchemas = this.tools.reduce((acc, tool) => {
      acc[tool.name] = tool.inputSchema;
      return acc;
    }, {} as Record<string, any>);
    
    const request: LLMPlanGenerationRequest = {
      query,
      selectedTools: toolSelection.tools,
      toolSchemas,
      entities: toolSelection.entities,
      requestId
    };
    
    return await this.openaiService.generatePlan(request);
  }
  
  /**
   * Refine plan using LLM intelligence
   */
  private async refinePlanWithLLM(query: string, plan: Plan, validationErrors: string[]) {
    const toolSchemas = this.tools.reduce((acc, tool) => {
      acc[tool.name] = tool.inputSchema;
      return acc;
    }, {} as Record<string, any>);
    
    const request: LLMPlanRefinementRequest = {
      query,
      plan,
      validationErrors,
      toolSchemas
    };
    
    return await this.openaiService.refinePlan(request);
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
    console.log(`Testing planner agent with query: "${query}"`);
    return await this.plan(query);
  }
}
