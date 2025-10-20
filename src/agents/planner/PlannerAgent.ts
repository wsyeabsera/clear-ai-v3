// Intelligent Planner Agent (LLM-powered)

import { randomUUID } from 'crypto';
import { PlannerState, Plan, PlanResponse, PlanStatus, MCPTool, PlanningContext, LLMToolSelectionRequest, LLMPlanGenerationRequest, LLMPlanRefinementRequest, PlanStep } from './types';
import { ToolAdapter } from './tool-adapter';
import { PlanValidator } from './validator';
import { PlanStorage } from './storage';
import { OpenAIService, createOpenAIService } from './openai-service';
import { GroqService, createGroqService } from './groq-service';
import { PromptBuilder } from './prompts';
import { ParameterResolver } from './parameter-resolver';
import { AnalyzerMemoryRepository } from '../memory/analyzer-memory';
import { EmbeddingService, OpenAIEmbeddingProvider } from '../memory/embedding-service';
import { PineconeVectorStore } from '../memory/vector-store';
import { AnalyzerStorage } from '../analyzer/storage';
import { ExecutionStorage } from '../executor/storage';
import { AnalyzerMemoryEntry } from '../memory/types';
import { DataAssessmentService } from './data-assessment';
import { QueryRealismValidator } from './query-realism-validator';
import { SmartFilterGenerator } from './smart-filter-generator';

export class PlannerAgent {
  private tools: MCPTool[];
  private openaiService: OpenAIService;
  private groqService: GroqService;
  private validator: PlanValidator;
  private defaultProvider: string;
  private analyzerMemoryRepository: AnalyzerMemoryRepository;

  constructor() {
    this.tools = ToolAdapter.getAvailableTools();
    this.openaiService = createOpenAIService();
    this.groqService = createGroqService();
    this.validator = new PlanValidator(this.tools);
    this.defaultProvider = process.env.DEFAULT_LLM_PROVIDER || 'groq';

    // Initialize analyzer memory repository for feedback loop
    const embeddingService = new EmbeddingService(
      new OpenAIEmbeddingProvider(
        process.env.OPENAI_API_KEY || '',
        process.env.OPENAI_EMBEDDING_MODEL || 'text-embedding-3-small'
      )
    );

    this.analyzerMemoryRepository = new AnalyzerMemoryRepository(
      embeddingService,
      new PineconeVectorStore(
        process.env.PINECONE_API_KEY || '',
        process.env.PINECONE_ENVIRONMENT || '',
        process.env.PINECONE_INDEX_NAME || 'clear-ai-memory'
      )
    );
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

      // Step 1.5: Get analysis feedback from past executions
      const analysisFeedback = await this.getAnalysisFeedback(query);
      if (analysisFeedback) {
        console.log(`📚 Retrieved analysis feedback from past executions`);
      }

      // Step 1.6: Assess data availability and validate query realism
      const dataAssessment = await this.assessDataAvailability(query);
      if (dataAssessment) {
        console.log(`📊 Data assessment: ${dataAssessment.overallAvailability * 100}% availability`);
        if (dataAssessment.warnings.length > 0) {
          console.log(`⚠️  Data warnings: ${dataAssessment.warnings.join(', ')}`);
        }
      }

      // Step 1: Select tools using LLM
      const toolSelection = await this.selectToolsWithLLM(query, provider, analysisFeedback);
      console.log(`🔧 Selected tools: ${toolSelection.tools.join(', ')}`);
      console.log(`💭 Reasoning: ${toolSelection.reasoning}`);

      // Step 2: Generate plan using LLM
      const planGeneration = await this.generatePlanWithLLM(query, toolSelection, requestId, provider, analysisFeedback);
      console.log(`📋 Generated plan with ${planGeneration.plan.steps.length} steps`);

      // Step 2.5: Enhance plan with data-aware optimizations
      const enhancedPlan = await this.enhancePlanWithDataAwareness(planGeneration.plan, query, dataAssessment);
      if (enhancedPlan !== planGeneration.plan) {
        console.log(`🔧 Enhanced plan with data-aware optimizations`);
        planGeneration.plan = enhancedPlan as any;
      }

      // Clean up the plan data to ensure proper types
      planGeneration.plan.steps = planGeneration.plan.steps.map(step => {
        const cleanedStep = {
          ...step,
          parallel: this.cleanBoolean(step.parallel),
          dependsOn: this.cleanDependsOn(step.dependsOn)
        };
        console.log(`🔧 Cleaned step: parallel=${cleanedStep.parallel} (was ${step.parallel}), dependsOn=${JSON.stringify(cleanedStep.dependsOn)} (was ${JSON.stringify(step.dependsOn)})`);
        return cleanedStep;
      });

      // Post-process to fix common LLM variable mistakes
      planGeneration.plan.steps = this.fixCommonVariableMistakes(planGeneration.plan.steps).map(step => ({
        ...step,
        description: step.description || `Execute ${step.tool}`
      }));

      // Ensure the plan metadata uses the correct requestId
      if (planGeneration.plan.metadata) {
        planGeneration.plan.metadata.requestId = requestId;
      } else {
        planGeneration.plan.metadata = {
          query,
          requestId,
          totalSteps: planGeneration.plan.steps.length,
          parallelSteps: planGeneration.plan.steps.filter(step => step.parallel).length
        };
      }

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
          return parsed.map(item => typeof item === 'number' ? item : parseInt(item, 10)).filter(item => !isNaN(item));
        }
      } catch (e) {
        // If parsing fails, return empty array
      }
    }

    // If it's an array but contains non-numbers, try to convert them
    if (Array.isArray(dependsOn)) {
      return dependsOn.map(item => typeof item === 'number' ? item : parseInt(item, 10)).filter(item => !isNaN(item));
    }

    // If it's a single number, wrap it in an array
    if (typeof dependsOn === 'number') {
      return [dependsOn];
    }

    // If it's a string representation of a single number, wrap it in an array
    if (typeof dependsOn === 'string' && !isNaN(parseInt(dependsOn, 10))) {
      return [parseInt(dependsOn, 10)];
    }

    return [];
  }

  /**
   * Enhanced analysis feedback with empty result pattern learning
   */
  private async getAnalysisFeedback(query: string): Promise<string> {
    try {
      const historicalAnalyses = await this.analyzerMemoryRepository.search(query, 5);

      if (historicalAnalyses.length === 0) {
        return '';
      }

      // Analyze patterns in historical data
      const emptyResultPatterns = this.analyzeEmptyResultPatterns(historicalAnalyses);
      const dataQualityPatterns = this.analyzeDataQualityPatterns(historicalAnalyses);
      const adaptiveSuggestions = this.generateAdaptiveSuggestions(query, historicalAnalyses);

      const feedbackSummary = historicalAnalyses
        .map(analysis => {
          const evaluationMetrics = analysis.evaluation_metrics || {};
          const successRate = evaluationMetrics.success_rate || 0;
          const efficiency = evaluationMetrics.efficiency_score || 0;
          const emptyResultRate = (evaluationMetrics as any).empty_result_rate || 0;
          const dataQualityScore = (evaluationMetrics as any).data_quality_score || 0;
          const meaningfulResultsRate = (evaluationMetrics as any).meaningful_results_rate || 0;
          const recommendations = analysis.improvement_notes || 'None';
          const failurePatterns = evaluationMetrics.error_patterns || [];

          return `Previous Execution Analysis:
- Success Rate: ${(successRate * 100).toFixed(1)}%
- Efficiency Score: ${(efficiency * 100).toFixed(1)}%
- Empty Result Rate: ${(emptyResultRate * 100).toFixed(1)}%
- Data Quality Score: ${(dataQualityScore * 100).toFixed(1)}%
- Meaningful Results: ${(meaningfulResultsRate * 100).toFixed(1)}%
- Recommendations: ${recommendations}
- Common Issues: ${failurePatterns.join(', ') || 'None identified'}`;
        })
        .join('\n\n');

      const patternInsights = this.buildPatternInsights(emptyResultPatterns, dataQualityPatterns);
      const adaptiveGuidance = this.buildAdaptiveGuidance(adaptiveSuggestions);

      return `Historical Context from Similar Queries:\n\n${feedbackSummary}\n\n${patternInsights}\n\n${adaptiveGuidance}`;
    } catch (error) {
      console.warn('Failed to retrieve analysis feedback:', error);
      return '';
    }
  }

  /**
   * Select tools using LLM intelligence
   */
  private async selectToolsWithLLM(query: string, provider: string = 'groq', analysisFeedback?: string) {
    if (provider === 'groq') {
      // Multi-stage approach for Groq to stay within token limits
      return await this.selectToolsWithGroqMultiStage(query, analysisFeedback);
    } else {
      // Single-stage approach for OpenAI (no token limits)
      return await this.selectToolsWithOpenAISingleStage(query, analysisFeedback);
    }
  }

  /**
   * Multi-stage tool selection for Groq (Stage 1: Categories, Stage 2: Tools)
   */
  private async selectToolsWithGroqMultiStage(query: string, analysisFeedback?: string) {
    // Stage 1: Category selection
    const categoryMetadata = ToolAdapter.getCategoryMetadata();
    const categorySelection = await this.groqService.selectCategories({
      query,
      availableCategories: categoryMetadata,
      analysisFeedback
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
      toolSchemas,
      analysisFeedback
    });
  }

  /**
   * Single-stage tool selection for OpenAI
   */
  private async selectToolsWithOpenAISingleStage(query: string, analysisFeedback?: string) {
    const toolSchemas = this.tools.reduce((acc, tool) => {
      acc[tool.name] = tool.inputSchema;
      return acc;
    }, {} as Record<string, any>);

    const availableToolsDescription = ToolAdapter.formatToolsForLLMWithContext(this.tools);

    const request: LLMToolSelectionRequest = {
      query,
      availableTools: this.tools,
      analysisFeedback
    };

    return await this.openaiService.selectTools({
      query,
      availableTools: availableToolsDescription,
      toolSchemas,
      analysisFeedback
    });
  }

  /**
   * Generate plan using LLM intelligence
   */
  private async generatePlanWithLLM(query: string, toolSelection: any, requestId: string, provider: string = 'groq', analysisFeedback?: string) {
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
        requestId,
        analysisFeedback
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
        requestId,
        analysisFeedback
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
  async getRecentPlans(limit: number = 50): Promise<PlanResponse[]> {
    const plans = await PlanStorage.getRecentPlans(limit);
    return plans.map(plan => ({
      requestId: plan.requestId,
      query: plan.query,
      plan: plan.plan,
      status: plan.status,
      createdAt: plan.createdAt.toISOString(),
      executionTimeMs: plan.executionTimeMs,
      validationErrors: plan.validationErrors
    }));
  }

  /**
   * Delete a plan
   */
  async deletePlan(requestId: string): Promise<boolean> {
    return await PlanStorage.deletePlan(requestId);
  }

  /**
   * Provide feedback from an analysis to improve future plans
   */
  async provideFeedback(planRequestId: string, analysisId: string): Promise<{ success: boolean; message: string; feedbackId: string }> {
    try {
      console.log(`📝 Providing feedback for plan ${planRequestId} with analysis ${analysisId}`);

      // Step 1: Fetch analysis data from MongoDB
      const analysisData = await AnalyzerStorage.getAnalysisById(analysisId);
      if (!analysisData) {
        return {
          success: false,
          message: `Analysis with ID ${analysisId} not found`,
          feedbackId: ''
        };
      }

      // Step 2: Fetch execution data from MongoDB (optional - we have what we need from analysis)
      const executionData = await ExecutionStorage.getExecutionById(analysisData.execution_id);

      // Step 3: Generate embedding for the feedback content
      const embeddingService = new EmbeddingService(
        new OpenAIEmbeddingProvider(
          process.env.OPENAI_API_KEY || '',
          process.env.OPENAI_EMBEDDING_MODEL || 'text-embedding-3-small'
        )
      );

      const feedbackContent = `${analysisData.feedback} ${analysisData.improvement_notes} ${analysisData.recommendations.join(' ')}`;
      const embedding = await embeddingService.generateEmbedding(feedbackContent);

      // Step 4: Create AnalyzerMemoryEntry
      const memoryEntry: AnalyzerMemoryEntry = {
        id: randomUUID(),
        execution_id: analysisData.execution_id,
        plan_request_id: planRequestId,
        feedback: analysisData.feedback,
        evaluation_metrics: {
          success_rate: analysisData.evaluation_metrics.success_rate,
          efficiency_score: analysisData.evaluation_metrics.efficiency_score,
          error_patterns: analysisData.evaluation_metrics.error_patterns
        },
        improvement_notes: analysisData.improvement_notes,
        embedding: embedding,
        metadata: {
          timestamp: new Date(),
          user_query: analysisData.user_query
        }
      };

      // Step 5: Store in vector memory
      await this.analyzerMemoryRepository.store(memoryEntry);

      console.log(`✅ Successfully stored feedback for future plan improvements`);

      return {
        success: true,
        message: 'Feedback successfully stored for future plan improvements',
        feedbackId: memoryEntry.id
      };

    } catch (error) {
      console.error('Failed to provide feedback:', error);
      return {
        success: false,
        message: `Failed to provide feedback: ${error instanceof Error ? error.message : 'Unknown error'}`,
        feedbackId: ''
      };
    }
  }

  /**
   * Fix common LLM variable mistakes in plan steps
   */
  private fixCommonVariableMistakes(steps: PlanStep[]): PlanStep[] {
    return steps.map((step, stepIndex) => {
      const fixedParams = this.fixVariableReferencesInParams(step.params, stepIndex);

      // Additional fix: Convert .uid to ._id and fix path structure in variable references
      const uidFixedParams = this.fixUidToIdReferences(fixedParams);

      if (JSON.stringify(uidFixedParams) !== JSON.stringify(step.params)) {
        console.log(`🔧 Fixed variable references in step ${stepIndex}: ${step.tool}`);
      }

      return {
        ...step,
        params: uidFixedParams
      };
    });
  }

  /**
   * Fix .uid references to ._id and .items[0] to [0] in variable references
   */
  private fixUidToIdReferences(params: any): any {
    if (typeof params !== 'object' || params === null) {
      return params;
    }

    const fixed: any = Array.isArray(params) ? [] : {};

    for (const [key, value] of Object.entries(params)) {
      if (typeof value === 'string' && (value.includes('.uid') || value.includes('.items['))) {
        // Convert .uid to ._id and .items[0] to [0] in variable references
        let fixedValue = value.replace(/\.uid/g, '._id');
        fixedValue = fixedValue.replace(/\.items\[/g, '[');
        fixed[key] = fixedValue;
      } else if (typeof value === 'object') {
        // Recursively fix nested objects
        fixed[key] = this.fixUidToIdReferences(value);
      } else {
        fixed[key] = value;
      }
    }

    return fixed;
  }

  /**
   * Fix variable references in parameters
   */
  private fixVariableReferencesInParams(params: any, currentStepIndex: number): any {
    if (typeof params !== 'object' || params === null) {
      return params;
    }

    const fixed: any = Array.isArray(params) ? [] : {};

    for (const [key, value] of Object.entries(params)) {
      if (typeof value === 'string' && value.includes('${')) {
        // Fix common variable patterns
        fixed[key] = this.fixVariableReference(value, currentStepIndex);
      } else if (typeof value === 'object') {
        // Recursively fix nested objects
        fixed[key] = this.fixVariableReferencesInParams(value, currentStepIndex);
      } else {
        fixed[key] = value;
      }
    }

    return fixed;
  }

  /**
   * Fix a single variable reference
   */
  private fixVariableReference(expression: string, currentStepIndex: number): string {
    // Fix entity patterns like ${facility_1.uid} to ${step_0.result.uid}
    const entityMatch = expression.match(/\$\{(\w+)_(\d+)\.(\w+)\}/);
    if (entityMatch) {
      const entityType = entityMatch[1];
      const entityIndex = parseInt(entityMatch[2]);
      const field = entityMatch[3];

      // Find the step that produces this entity type
      const candidateStepIndex = this.findStepForEntityType(entityType, entityIndex, currentStepIndex);

      if (candidateStepIndex !== -1) {
        return expression.replace(entityMatch[0], `\${step_${candidateStepIndex}.result.${field}}`);
      }
    }

    // Fix other common patterns
    if (expression.includes('${first_')) {
      return expression.replace(/\$\{first_(\w+)\}/g, '${step_0.result.$1}');
    }

    if (expression.includes('${result_')) {
      return expression.replace(/\$\{result_(\d+)\}/g, '${step_$1.result}');
    }

    return expression;
  }

  /**
   * Find the step index that produces a specific entity type
   */
  private findStepForEntityType(entityType: string, entityIndex: number, currentStepIndex: number): number {
    // This is a simplified implementation - in practice, you'd analyze tool schemas
    // to determine what entity types each tool produces

    for (let i = 0; i < currentStepIndex; i++) {
      // Check if this step might produce the entity type
      if (entityType === 'facility' && i < currentStepIndex) {
        return i;
      } else if (entityType === 'shipment' && i < currentStepIndex) {
        return i;
      } else if (entityType === 'client' && i < currentStepIndex) {
        return i;
      } else if (entityType === 'contract' && i < currentStepIndex) {
        return i;
      }
    }

    return -1;
  }

  /**
   * Analyze empty result patterns from historical data
   */
  private analyzeEmptyResultPatterns(historicalAnalyses: any[]): {
    commonReasons: string[];
    affectedTools: string[];
    averageEmptyRate: number;
    suggestions: string[];
  } {
    const emptyResultReasons: string[] = [];
    const affectedTools: string[] = [];
    let totalEmptyRate = 0;
    let emptyResultCount = 0;

    historicalAnalyses.forEach(analysis => {
      const metrics = analysis.evaluation_metrics || {};
      const emptyResultRate = metrics.empty_result_rate || 0;

      if (emptyResultRate > 0) {
        emptyResultCount++;
        totalEmptyRate += emptyResultRate;

        // Extract patterns from error patterns
        const errorPatterns = metrics.error_patterns || [];
        errorPatterns.forEach((pattern: string) => {
          if (pattern.includes('Empty result')) {
            emptyResultReasons.push(pattern);
          }
        });
      }
    });

    const averageEmptyRate = emptyResultCount > 0 ? totalEmptyRate / emptyResultCount : 0;
    const commonReasons = this.getMostCommonReasons(emptyResultReasons);
    const suggestions = this.generateEmptyResultSuggestions(commonReasons);

    return {
      commonReasons,
      affectedTools,
      averageEmptyRate,
      suggestions
    };
  }

  /**
   * Analyze data quality patterns from historical data
   */
  private analyzeDataQualityPatterns(historicalAnalyses: any[]): {
    averageQualityScore: number;
    qualityTrend: 'improving' | 'declining' | 'stable';
    commonQualityIssues: string[];
    suggestions: string[];
  } {
    const qualityScores: number[] = [];
    const qualityIssues: string[] = [];

    historicalAnalyses.forEach(analysis => {
      const metrics = analysis.evaluation_metrics || {};
      const qualityScore = metrics.data_quality_score || 0;

      if (qualityScore > 0) {
        qualityScores.push(qualityScore);
      }

      // Extract quality-related issues from recommendations
      const recommendations = analysis.improvement_notes || '';
      if (recommendations.includes('quality') || recommendations.includes('data')) {
        qualityIssues.push(recommendations);
      }
    });

    const averageQualityScore = qualityScores.length > 0
      ? qualityScores.reduce((sum, score) => sum + score, 0) / qualityScores.length
      : 0;

    const qualityTrend = this.determineQualityTrend(qualityScores);
    const commonQualityIssues = this.getMostCommonReasons(qualityIssues);
    const suggestions = this.generateQualitySuggestions(commonQualityIssues);

    return {
      averageQualityScore,
      qualityTrend,
      commonQualityIssues,
      suggestions
    };
  }

  /**
   * Generate adaptive suggestions based on query and historical data
   */
  private generateAdaptiveSuggestions(query: string, historicalAnalyses: any[]): string[] {
    const suggestions: string[] = [];
    const queryLower = query.toLowerCase();

    // Analyze query patterns that led to empty results
    const emptyResultQueries = historicalAnalyses.filter(analysis => {
      const metrics = analysis.evaluation_metrics || {};
      return (metrics.empty_result_rate || 0) > 0.3; // 30% or more empty results
    });

    if (emptyResultQueries.length > 0) {
      suggestions.push('Consider using broader search criteria to avoid empty results');
      suggestions.push('Try removing specific filters that may be too restrictive');
    }

    // Analyze query patterns that led to good results
    const goodResultQueries = historicalAnalyses.filter(analysis => {
      const metrics = analysis.evaluation_metrics || {};
      return (metrics.meaningful_results_rate || 0) > 0.8; // 80% or more meaningful results
    });

    if (goodResultQueries.length > 0) {
      suggestions.push('Use similar query patterns that have worked well in the past');
    }

    // Query-specific suggestions
    if (queryLower.includes('facility')) {
      suggestions.push('For facility queries, consider including location or type filters');
    } else if (queryLower.includes('shipment')) {
      suggestions.push('For shipment queries, consider including date range or status filters');
    } else if (queryLower.includes('contract')) {
      suggestions.push('For contract queries, ensure client_id parameter is provided');
    }

    return suggestions;
  }

  /**
   * Build pattern insights from analysis
   */
  private buildPatternInsights(emptyResultPatterns: any, dataQualityPatterns: any): string {
    let insights = '';

    if (emptyResultPatterns.averageEmptyRate > 0.2) {
      insights += `⚠️ Empty Result Patterns Detected:\n`;
      insights += `- Average Empty Rate: ${(emptyResultPatterns.averageEmptyRate * 100).toFixed(1)}%\n`;
      insights += `- Common Reasons: ${emptyResultPatterns.commonReasons.join(', ')}\n`;
      insights += `- Suggestions: ${emptyResultPatterns.suggestions.join('; ')}\n\n`;
    }

    if (dataQualityPatterns.averageQualityScore < 0.7) {
      insights += `📊 Data Quality Issues:\n`;
      insights += `- Average Quality Score: ${(dataQualityPatterns.averageQualityScore * 100).toFixed(1)}%\n`;
      insights += `- Quality Trend: ${dataQualityPatterns.qualityTrend}\n`;
      insights += `- Common Issues: ${dataQualityPatterns.commonQualityIssues.join(', ')}\n`;
      insights += `- Suggestions: ${dataQualityPatterns.suggestions.join('; ')}\n\n`;
    }

    return insights;
  }

  /**
   * Build adaptive guidance from suggestions
   */
  private buildAdaptiveGuidance(adaptiveSuggestions: string[]): string {
    if (adaptiveSuggestions.length === 0) {
      return '';
    }

    return `🎯 Adaptive Query Guidance:\n${adaptiveSuggestions.map(s => `- ${s}`).join('\n')}`;
  }

  /**
   * Get most common reasons from a list
   */
  private getMostCommonReasons(reasons: string[]): string[] {
    const reasonCounts: Record<string, number> = {};
    reasons.forEach(reason => {
      reasonCounts[reason] = (reasonCounts[reason] || 0) + 1;
    });

    return Object.entries(reasonCounts)
      .sort(([,a], [,b]) => b - a)
      .slice(0, 3)
      .map(([reason]) => reason);
  }

  /**
   * Generate suggestions for empty result issues
   */
  private generateEmptyResultSuggestions(commonReasons: string[]): string[] {
    const suggestions: string[] = [];

    if (commonReasons.some(r => r.includes('Restrictive filters'))) {
      suggestions.push('Use broader filter criteria');
    }
    if (commonReasons.some(r => r.includes('Invalid parameters'))) {
      suggestions.push('Validate parameter formats and values');
    }
    if (commonReasons.some(r => r.includes('Date range'))) {
      suggestions.push('Use realistic date ranges');
    }
    if (commonReasons.some(r => r.includes('Location'))) {
      suggestions.push('Verify location parameters match existing data');
    }

    return suggestions;
  }

  /**
   * Generate suggestions for data quality issues
   */
  private generateQualitySuggestions(commonIssues: string[]): string[] {
    const suggestions: string[] = [];

    if (commonIssues.some(issue => issue.includes('completeness'))) {
      suggestions.push('Ensure all required fields are populated');
    }
    if (commonIssues.some(issue => issue.includes('consistency'))) {
      suggestions.push('Use consistent data formats and structures');
    }
    if (commonIssues.some(issue => issue.includes('validation'))) {
      suggestions.push('Add data validation checks');
    }

    return suggestions;
  }

  /**
   * Determine quality trend from scores
   */
  private determineQualityTrend(qualityScores: number[]): 'improving' | 'declining' | 'stable' {
    if (qualityScores.length < 2) return 'stable';

    const firstHalf = qualityScores.slice(0, Math.floor(qualityScores.length / 2));
    const secondHalf = qualityScores.slice(Math.floor(qualityScores.length / 2));

    const firstHalfAvg = firstHalf.reduce((sum, score) => sum + score, 0) / firstHalf.length;
    const secondHalfAvg = secondHalf.reduce((sum, score) => sum + score, 0) / secondHalf.length;

    const difference = secondHalfAvg - firstHalfAvg;
    const threshold = 0.1; // 10% change threshold

    if (difference > threshold) return 'improving';
    if (difference < -threshold) return 'declining';
    return 'stable';
  }

  /**
   * Test the agent with a simple query
   */
  async test(query: string = 'List all shipments'): Promise<PlanResponse> {
    console.log(`Testing planner agent with query: "${query}"`);
    return await this.plan(query);
  }

  /**
   * Assess data availability for a query
   */
  private async assessDataAvailability(query: string): Promise<any> {
    try {
      const dataAssessment = await DataAssessmentService.assessDataAvailability([query]);
      return dataAssessment;
    } catch (error) {
      console.error('Data assessment failed:', error);
      return null;
    }
  }

  /**
   * Validate query realism based on available data
   */
  private async validateQueryRealism(query: string): Promise<any> {
    try {
      const validation = await QueryRealismValidator.validateQuery(query);
      return validation;
    } catch (error) {
      console.error('Query realism validation failed:', error);
      return null;
    }
  }

  /**
   * Generate smart filters for a query
   */
  private async generateSmartFilters(query: string, entityType: string): Promise<any> {
    try {
      const context = {
        entityType,
        baseQuery: query,
        existingFilters: {},
        userPreferences: {
          maxResults: 50
        }
      };

      const smartFilters = await SmartFilterGenerator.generateSmartFilters(context);
      return smartFilters;
    } catch (error) {
      console.error('Smart filter generation failed:', error);
      return null;
    }
  }

  /**
   * Enhance plan with data-aware optimizations
   */
  private async enhancePlanWithDataAwareness(
    plan: Plan,
    query: string,
    dataAssessment: any
  ): Promise<Plan> {
    try {
      if (!dataAssessment || dataAssessment.overallAvailability < 0.5) {
        console.log('⚠️  Low data availability detected, using conservative plan');
        return plan;
      }

      // Optimize steps based on data availability
      const optimizedSteps = plan.steps.map(step => {
        const entityType = this.extractEntityTypeFromTool(step.tool);
        if (entityType && dataAssessment.entityAvailability) {
          const entityData = dataAssessment.entityAvailability.find(
            (e: any) => e.entityType === entityType
          );

          if (entityData && entityData.totalCount < 10) {
            // Add pagination for small datasets
            if (!step.params.limit) {
              step.params.limit = Math.min(10, entityData.totalCount);
            }
          }
        }
        return step;
      });

      return {
        ...plan,
        steps: optimizedSteps
      };
    } catch (error) {
      console.error('Data-aware plan enhancement failed:', error);
      return plan;
    }
  }

  /**
   * Extract entity type from tool name
   */
  private extractEntityTypeFromTool(toolName: string): string | null {
    const toolToEntityMap: Record<string, string> = {
      'shipments_list': 'shipments',
      'facilities_list': 'facilities',
      'contracts_list': 'contracts',
      'waste_codes_list': 'waste_codes',
      'waste_generators_list': 'waste_generators',
      'inspections_list': 'inspections',
      'contaminants_list': 'contaminants'
    };

    return toolToEntityMap[toolName] || null;
  }
}
