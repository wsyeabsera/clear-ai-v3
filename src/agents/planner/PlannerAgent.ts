// Intelligent Planner Agent (LLM-powered)

import { randomUUID } from 'crypto';
import { PlannerState, Plan, PlanResponse, PlanStatus, MCPTool, PlanningContext, LLMToolSelectionRequest, LLMPlanGenerationRequest, LLMPlanRefinementRequest } from './types';
import { ToolAdapter } from './tool-adapter';
import { PlanValidator } from './validator';
import { PlanStorage } from './storage';
import { OpenAIService, createOpenAIService } from './openai-service';
import { GroqService, createGroqService } from './groq-service';
import { PromptBuilder } from './prompts';
import { ParameterResolver } from './parameter-resolver';

export class PlannerAgent {
  private tools: MCPTool[];
  private openaiService: OpenAIService;
  private groqService: GroqService;
  private validator: PlanValidator;
  private defaultProvider: string;
  
  constructor() {
    this.tools = ToolAdapter.getAvailableTools();
    this.openaiService = createOpenAIService();
    this.groqService = createGroqService();
    this.validator = new PlanValidator(this.tools);
    this.defaultProvider = process.env.DEFAULT_LLM_PROVIDER || 'groq';
  }
  
  /**
   * Create a plan for a given query using LLM-powered intelligence
   */
  async plan(query: string, llmProvider?: string, skipDatabase: boolean = false): Promise<PlanResponse> {
    const requestId = randomUUID();
    const startTime = new Date();
    const provider = llmProvider || this.defaultProvider;
    
    try {
      console.log(`🤖 Creating intelligent plan for: "${query}" using ${provider}`);
      
      // Step 1: Select tools using LLM
      const toolSelection = await this.selectToolsWithLLM(query, provider);
      console.log(`🔧 Selected tools: ${toolSelection.tools.join(', ')}`);
      console.log(`💭 Reasoning: ${toolSelection.reasoning}`);
      
      // Step 2: Generate plan using LLM
      const planGeneration = await this.generatePlanWithLLM(query, toolSelection, requestId, provider);
      console.log(`📋 Generated plan with ${planGeneration.plan.steps.length} steps`);
      
      // Ensure the plan metadata uses the correct requestId
      planGeneration.plan.metadata.requestId = requestId;
      
      // Step 3: Validate plan
      const validation = this.validator.validatePlan(planGeneration.plan);
      
      // Step 4: Refine plan if needed (skip for Groq due to token limits)
      let finalPlan = planGeneration.plan;
      let refinementCount = 0;
      const maxRefinements = provider === 'groq' ? 0 : 3; // Skip refinement for Groq

      while (!validation.isValid && refinementCount < maxRefinements) {
        console.log(`🔧 Refining plan (attempt ${refinementCount + 1}/${maxRefinements})`);
        const refinement = await this.refinePlanWithLLM(query, finalPlan, validation.errors, provider);
        finalPlan = 'refinedPlan' in refinement ? refinement.refinedPlan : refinement.plan;
        
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
  private async selectToolsWithLLM(query: string, provider: string = 'groq') {
    if (provider === 'groq') {
      // Multi-stage approach for Groq to stay within token limits
      return await this.selectToolsWithGroqMultiStage(query);
    } else {
      // Single-stage approach for OpenAI (no token limits)
      return await this.selectToolsWithOpenAISingleStage(query);
    }
  }

  /**
   * Multi-stage tool selection for Groq (Stage 1: Categories, Stage 2: Tools)
   */
  private async selectToolsWithGroqMultiStage(query: string) {
    // Stage 1: Category selection
    const categoryMetadata = ToolAdapter.getCategoryMetadata();
    const categorySelection = await this.groqService.selectCategories({
      query,
      availableCategories: categoryMetadata
    });

    console.log(`🎯 Selected categories: ${categorySelection.categories.join(', ')}`);
    console.log(`💭 Category reasoning: ${categorySelection.reasoning}`);

    // Expand categories with dependencies
    const expandedCategories = ToolAdapter.expandCategoriesWithDependencies(categorySelection.categories);
    console.log(`🔗 Expanded categories with dependencies: ${expandedCategories.join(', ')}`);

    // Stage 2: Tool selection with compressed schemas
    const filteredTools = ToolAdapter.getToolsByCategories(this.tools, expandedCategories);
    const compressedTools = ToolAdapter.formatToolsCompact(filteredTools);

    const toolSchemas = filteredTools.reduce((acc, tool) => {
      acc[tool.name] = tool.inputSchema;
      return acc;
    }, {} as Record<string, any>);

    return await this.groqService.selectTools({
      query,
      availableTools: compressedTools,
      toolSchemas
    });
  }

  /**
   * Single-stage tool selection for OpenAI
   */
  private async selectToolsWithOpenAISingleStage(query: string) {
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
  private async generatePlanWithLLM(query: string, toolSelection: any, requestId: string, provider: string = 'groq') {
    if (provider === 'groq') {
      // For Groq, we need to get the filtered tools that were used in tool selection
      // We'll need to reconstruct the filtered tools based on the selected tools
      const selectedToolNames = toolSelection.tools;
      const filteredTools = this.tools.filter(tool => selectedToolNames.includes(tool.name));
      const toolSchemas = filteredTools.reduce((acc, tool) => {
        acc[tool.name] = tool.inputSchema;
        return acc;
      }, {} as Record<string, any>);

      return await this.groqService.generatePlan({
        query,
        selectedTools: toolSelection.tools,
        toolSchemas,
        requestId
      });
    } else {
      // For OpenAI, use all tools as before
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
  }
  
  /**
   * Refine plan using LLM intelligence
   */
  private async refinePlanWithLLM(query: string, plan: Plan, validationErrors: string[], provider: string = 'groq') {
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
    
    if (provider === 'groq') {
      return await this.groqService.refinePlan({
        query,
        originalPlan: plan,
        validationErrors,
        toolSchemas
      });
    } else {
      return await this.openaiService.refinePlan(request);
    }
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
