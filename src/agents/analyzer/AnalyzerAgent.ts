// Analyzer Agent for evaluating execution results and providing feedback

import { randomUUID } from 'crypto';
import { AnalysisResult, AnalysisContext, EvaluationMetrics, AnalysisStorage } from './types';
import { ExecutionStorage } from '../executor/storage';
import { PlanStorage } from '../planner/storage';
import { AnalyzerStorage } from './storage';
import { AnalyzerMemoryRepository } from '../memory/analyzer-memory';
import { EmbeddingService, OpenAIEmbeddingProvider } from '../memory/embedding-service';
import { PineconeVectorStore } from '../memory/vector-store';
import { AnalyzerMemoryEntry } from '../memory/types';
import OpenAI from 'openai';

export class AnalyzerAgent {
  private analyzerMemoryRepository: AnalyzerMemoryRepository;
  private embeddingService: EmbeddingService;
  private openai: OpenAI;

  constructor() {
    this.embeddingService = new EmbeddingService(
      new OpenAIEmbeddingProvider(
        process.env.OPENAI_API_KEY || '',
        process.env.OPENAI_EMBEDDING_MODEL || 'text-embedding-3-small'
      )
    );
    this.analyzerMemoryRepository = new AnalyzerMemoryRepository(
      this.embeddingService,
      new PineconeVectorStore(
        process.env.PINECONE_API_KEY || '',
        process.env.PINECONE_ENVIRONMENT || '',
        process.env.PINECONE_INDEX_NAME || 'clear-ai-memory'
      )
    );
    this.openai = new OpenAI({
      apiKey: process.env.OPENAI_API_KEY || ''
    });
  }

  async analyze(executionId: string): Promise<AnalysisResult> {
    try {
      // Fetch execution data
      const execution = await ExecutionStorage.getExecutionById(executionId);
      if (!execution) {
        throw new Error('Execution not found');
      }

      // Fetch plan data
      const plan = await PlanStorage.getPlanByRequestId(execution.planRequestId);
      if (!plan) {
        throw new Error('Plan not found');
      }

      // Build analysis context
      const context: AnalysisContext = {
        execution_id: executionId,
        plan_request_id: execution.planRequestId,
        user_query: plan.query,
        plan: plan.plan,
        execution_results: execution.results,
        execution_status: execution.status,
        execution_time_ms: execution.completedAt && execution.startedAt
          ? execution.completedAt.getTime() - execution.startedAt.getTime()
          : 0,
        started_at: execution.startedAt,
        completed_at: execution.completedAt
      };

      // Calculate evaluation metrics
      const metrics = this.calculateEvaluationMetrics(context);

      // Get historical context for better analysis
      const historicalContext = await this.getHistoricalContext(context.user_query);

      // Generate LLM feedback
      const llmFeedback = await this.generateLLMFeedback(context, metrics, historicalContext);

      // Create analysis result
      const analysisResult: AnalysisResult = {
        analysis_id: randomUUID(),
        execution_id: executionId,
        plan_request_id: execution.planRequestId,
        feedback: llmFeedback.feedback,
        evaluation_metrics: metrics,
        improvement_notes: llmFeedback.improvement_notes,
        success_indicators: llmFeedback.success_indicators,
        failure_patterns: llmFeedback.failure_patterns,
        recommendations: llmFeedback.recommendations
      };

      // Create storage object with user_query
      const analysisStorage: AnalysisStorage = {
        ...analysisResult,
        user_query: context.user_query,
        created_at: new Date(),
        updated_at: new Date()
      };

      // Store analysis in MongoDB
      await AnalyzerStorage.saveAnalysis(analysisStorage);

      // Store in vector memory for future learning
      await this.storeInVectorMemory(analysisResult, context);

      return analysisResult;

    } catch (error) {
      if (error instanceof Error) {
        throw new Error(`Analysis failed: ${error.message}`);
      }
      throw new Error('Analysis failed: Unknown error');
    }
  }

  async getHistoricalContext(query: string): Promise<AnalyzerMemoryEntry[]> {
    try {
      return await this.analyzerMemoryRepository.search(query, 5);
    } catch (error) {
      console.warn('Failed to retrieve historical context:', error);
      return [];
    }
  }

  private calculateEvaluationMetrics(context: AnalysisContext): EvaluationMetrics {
    const { execution_results, execution_status, execution_time_ms } = context;

    // Calculate success rate
    const totalSteps = execution_results.length;
    const completedSteps = execution_results.filter(r => r.status === 'COMPLETED').length;
    const successRate = totalSteps > 0 ? completedSteps / totalSteps : 0;

    // Calculate step success rates
    const stepSuccessRates: Record<number, number> = {};
    execution_results.forEach(result => {
      stepSuccessRates[result.stepIndex] = result.status === 'COMPLETED' ? 1 : 0;
    });

    // Calculate retry frequency
    const totalRetries = execution_results.reduce((sum, result) => sum + result.retryCount, 0);
    const retryFrequency = totalRetries / totalSteps;

    // Calculate average step time
    const averageStepTimeMs = execution_time_ms / totalSteps;

    // Enhanced empty result analysis
    const emptyResultAnalysis = this.analyzeEmptyResults(execution_results);
    const dataQualityAnalysis = this.analyzeDataQuality(execution_results);

    // Calculate efficiency score (higher is better) with empty result penalty
    const emptyResultPenalty = emptyResultAnalysis.emptyResultRate * 0.3;
    const dataQualityBonus = dataQualityAnalysis.averageQualityScore * 0.1;
    const efficiencyScore = Math.max(0, Math.min(1,
      (successRate * 0.5) +
      ((1 - retryFrequency) * 0.2) +
      (execution_time_ms < 30000 ? 0.2 : 0) + // Bonus for quick execution
      dataQualityBonus -
      emptyResultPenalty
    ));

    // Extract error patterns including empty result patterns
    const errorPatterns = execution_results
      .filter(r => r.status === 'FAILED' && r.error)
      .map(r => r.error!)
      .filter((error, index, arr) => arr.indexOf(error) === index); // Remove duplicates

    // Add empty result patterns
    const emptyResultPatterns = emptyResultAnalysis.patterns;
    errorPatterns.push(...emptyResultPatterns);

    return {
      success_rate: successRate,
      efficiency_score: efficiencyScore,
      step_success_rates: stepSuccessRates,
      error_patterns: errorPatterns,
      retry_frequency: retryFrequency,
      average_step_time_ms: averageStepTimeMs,
      // Enhanced metrics
      empty_result_rate: emptyResultAnalysis.emptyResultRate,
      data_quality_score: dataQualityAnalysis.averageQualityScore,
      meaningful_results_rate: 1 - emptyResultAnalysis.emptyResultRate
    };
  }

  private async generateLLMFeedback(
    context: AnalysisContext,
    metrics: EvaluationMetrics,
    historicalContext: AnalyzerMemoryEntry[]
  ): Promise<{
    feedback: string;
    improvement_notes: string;
    success_indicators: string[];
    failure_patterns: string[];
    recommendations: string[];
  }> {
    try {
      const prompt = this.buildAnalysisPrompt(context, metrics, historicalContext);

      const response = await this.openai.chat.completions.create({
        model: process.env.ANALYZER_LLM_MODEL || 'gpt-4o-mini',
        temperature: parseFloat(process.env.ANALYZER_TEMPERATURE || '0.3'),
        messages: [
          {
            role: 'system',
            content: 'You are an AI execution analyzer. Analyze the provided execution data and provide structured feedback. Respond with valid JSON only.'
          },
          {
            role: 'user',
            content: prompt
          }
        ]
      });

      const content = response.choices[0]?.message?.content;
      if (!content) {
        throw new Error('No response from LLM');
      }

      // Clean the content to extract JSON from markdown if present
      let jsonContent = content.trim();
      if (jsonContent.startsWith('```json')) {
        jsonContent = jsonContent.replace(/^```json\s*/, '').replace(/\s*```$/, '');
      } else if (jsonContent.startsWith('```')) {
        jsonContent = jsonContent.replace(/^```\s*/, '').replace(/\s*```$/, '');
      }

      return JSON.parse(jsonContent);
    } catch (error) {
      if (error instanceof Error) {
        throw new Error(`LLM feedback generation failed: ${error.message}`);
      }
      throw new Error('LLM feedback generation failed: Unknown error');
    }
  }

  private buildAnalysisPrompt(
    context: AnalysisContext,
    metrics: EvaluationMetrics,
    historicalContext: AnalyzerMemoryEntry[]
  ): string {
    const historicalInsights = historicalContext.length > 0
      ? `\n\nHistorical Context:\n${historicalContext.map(h => {
          const evaluationMetrics = h.evaluation_metrics || {};
          const successRate = evaluationMetrics.success_rate || 0;
          const errorPatterns = evaluationMetrics.error_patterns || [];
          return `- Previous execution: ${h.feedback}\n  Success rate: ${successRate}\n  Patterns: ${errorPatterns.join(', ')}`;
        }).join('\n')}`
      : '';

    return `
Analyze this execution and provide structured feedback:

Execution Context:
- Query: "${context.user_query}"
- Status: ${context.execution_status}
- Total Steps: ${context.execution_results.length}
- Completed Steps: ${context.execution_results.filter(r => r.status === 'COMPLETED').length}
- Failed Steps: ${context.execution_results.filter(r => r.status === 'FAILED').length}
- Execution Time: ${context.execution_time_ms}ms
- Success Rate: ${metrics.success_rate}
- Efficiency Score: ${metrics.efficiency_score}
- Retry Frequency: ${metrics.retry_frequency}
- Error Patterns: ${metrics.error_patterns.join(', ')}

Step Details:
${context.execution_results.map((result, index) =>
  `- Step ${index}: ${result.status} (retries: ${result.retryCount})${result.error ? ` - Error: ${result.error}` : ''}`
).join('\n')}
${historicalInsights}

Provide your analysis as JSON with these fields:
{
  "feedback": "Brief summary of the execution analysis",
  "improvement_notes": "Specific areas for improvement",
  "success_indicators": ["List of positive indicators"],
  "failure_patterns": ["List of failure patterns identified"],
  "recommendations": ["List of actionable recommendations"]
}
    `.trim();
  }

  private async storeInVectorMemory(analysisResult: AnalysisResult, context: AnalysisContext): Promise<void> {
    try {
      // Generate embedding for the feedback
      const feedbackText = `${analysisResult.feedback} ${analysisResult.improvement_notes} ${analysisResult.recommendations.join(' ')}`;
      const embedding = await this.embeddingService.generateEmbedding(feedbackText);

      // Create analyzer memory entry
      const memoryEntry: AnalyzerMemoryEntry = {
        id: randomUUID(),
        execution_id: analysisResult.execution_id,
        plan_request_id: analysisResult.plan_request_id,
        feedback: analysisResult.feedback,
        evaluation_metrics: analysisResult.evaluation_metrics,
        improvement_notes: analysisResult.improvement_notes,
        embedding,
        metadata: {
          timestamp: new Date(),
          user_query: context.user_query
        }
      };

      // Store in vector memory
      await this.analyzerMemoryRepository.store(memoryEntry);
    } catch (error) {
      console.warn('Failed to store analysis in vector memory:', error);
      // Don't throw - this is not critical for the main analysis flow
    }
  }

  /**
   * Analyze empty results across execution steps
   */
  private analyzeEmptyResults(executionResults: any[]): {
    emptyResultRate: number;
    patterns: string[];
    emptySteps: number[];
    commonReasons: string[];
  } {
    const emptySteps: number[] = [];
    const patterns: string[] = [];
    const reasons: string[] = [];

    executionResults.forEach(result => {
      if (result.status === 'COMPLETED' && this.isResultEmpty(result.result)) {
        emptySteps.push(result.stepIndex);

        // Analyze why the result is empty
        const reason = this.determineEmptyReason(result);
        if (reason) {
          reasons.push(reason);
          patterns.push(`Empty result: ${reason}`);
        }
      }
    });

    const emptyResultRate = executionResults.length > 0 ? emptySteps.length / executionResults.length : 0;
    const commonReasons = this.getCommonReasons(reasons);

    return {
      emptyResultRate,
      patterns,
      emptySteps,
      commonReasons
    };
  }

  /**
   * Analyze data quality across execution steps
   */
  private analyzeDataQuality(executionResults: any[]): {
    averageQualityScore: number;
    qualityBreakdown: Record<string, number>;
    poorQualitySteps: number[];
  } {
    const qualityScores: number[] = [];
    const qualityBreakdown: Record<string, number> = {
      excellent: 0,
      good: 0,
      poor: 0,
      empty: 0
    };
    const poorQualitySteps: number[] = [];

    executionResults.forEach(result => {
      if (result.status === 'COMPLETED' && result.result) {
        const quality = this.assessResultQuality(result);
        qualityScores.push(quality.score);
        qualityBreakdown[quality.level]++;

        if (quality.level === 'poor') {
          poorQualitySteps.push(result.stepIndex);
        }
      }
    });

    const averageQualityScore = qualityScores.length > 0
      ? qualityScores.reduce((sum, score) => sum + score, 0) / qualityScores.length
      : 0;

    return {
      averageQualityScore: averageQualityScore / 100, // Normalize to 0-1
      qualityBreakdown,
      poorQualitySteps
    };
  }

  /**
   * Check if a result is empty
   */
  private isResultEmpty(result: any): boolean {
    if (!result) return true;
    if (Array.isArray(result)) return result.length === 0;
    if (result.items && Array.isArray(result.items)) return result.items.length === 0;
    if (result.data && Array.isArray(result.data)) return result.data.length === 0;
    return false;
  }

  /**
   * Determine why a result is empty
   */
  private determineEmptyReason(result: any): string | null {
    if (!this.isResultEmpty(result.result)) return null;

    const tool = result.tool.toLowerCase();
    const params = result.params;

    // Check for common empty result patterns
    if (this.hasRestrictiveFilters(params)) {
      return 'Restrictive filters';
    }

    if (this.hasInvalidParameters(params)) {
      return 'Invalid parameters';
    }

    if (this.hasDateRangeIssues(params)) {
      return 'Date range issues';
    }

    if (this.hasLocationIssues(params)) {
      return 'Location filter issues';
    }

    // Tool-specific checks
    if (tool.includes('contract') && !params.client_id) {
      return 'Missing client_id for contract query';
    }

    if (tool.includes('shipment') && !params.facility_id) {
      return 'Missing facility_id for shipment query';
    }

    return 'No data matches criteria';
  }

  /**
   * Assess the quality of a result
   */
  private assessResultQuality(result: any): { level: string; score: number } {
    const data = result.result;
    if (!data) return { level: 'empty', score: 0 };

    let dataArray: any[] = [];
    if (Array.isArray(data)) {
      dataArray = data;
    } else if (data.items && Array.isArray(data.items)) {
      dataArray = data.items;
    } else if (data.data && Array.isArray(data.data)) {
      dataArray = data.data;
    } else if (typeof data === 'object') {
      dataArray = [data];
    }

    if (dataArray.length === 0) {
      return { level: 'empty', score: 0 };
    }

    // Calculate quality score based on data characteristics
    let score = 50; // Base score

    // Data count bonus
    if (dataArray.length >= 10) score += 20;
    else if (dataArray.length >= 5) score += 10;
    else if (dataArray.length >= 1) score += 5;

    // Data completeness bonus
    const completenessScore = this.calculateCompletenessScore(dataArray, result.tool);
    score += completenessScore;

    // Data consistency bonus
    const consistencyScore = this.calculateConsistencyScore(dataArray);
    score += consistencyScore;

    const finalScore = Math.min(100, Math.max(0, score));

    if (finalScore >= 80) return { level: 'excellent', score: finalScore };
    if (finalScore >= 60) return { level: 'good', score: finalScore };
    if (finalScore >= 30) return { level: 'poor', score: finalScore };
    return { level: 'empty', score: finalScore };
  }

  /**
   * Calculate completeness score based on required fields
   */
  private calculateCompletenessScore(dataArray: any[], tool: string): number {
    if (dataArray.length === 0) return 0;

    const toolName = tool.toLowerCase();
    let requiredFields: string[] = [];

    // Define required fields based on tool type
    if (toolName.includes('facility')) {
      requiredFields = ['name', 'location'];
    } else if (toolName.includes('shipment')) {
      requiredFields = ['weight', 'status'];
    } else if (toolName.includes('client')) {
      requiredFields = ['name', 'email'];
    } else if (toolName.includes('contract')) {
      requiredFields = ['client_id', 'start_date'];
    }

    if (requiredFields.length === 0) return 10; // Default bonus

    const completenessRatio = dataArray.reduce((sum, item) => {
      const presentFields = requiredFields.filter(field =>
        item[field] !== undefined && item[field] !== null && item[field] !== ''
      ).length;
      return sum + (presentFields / requiredFields.length);
    }, 0) / dataArray.length;

    return Math.round(completenessRatio * 20); // Up to 20 points
  }

  /**
   * Calculate consistency score based on data uniformity
   */
  private calculateConsistencyScore(dataArray: any[]): number {
    if (dataArray.length <= 1) return 10; // Default bonus for single items

    // Check for consistent field presence
    const allFields = new Set<string>();
    dataArray.forEach(item => {
      if (typeof item === 'object' && item !== null) {
        Object.keys(item).forEach(key => allFields.add(key));
      }
    });

    const fieldConsistency = Array.from(allFields).reduce((sum, field) => {
      const presentCount = dataArray.filter(item =>
        item && typeof item === 'object' && item[field] !== undefined
      ).length;
      const consistency = presentCount / dataArray.length;
      return sum + consistency;
    }, 0) / allFields.size;

    return Math.round(fieldConsistency * 10); // Up to 10 points
  }

  /**
   * Check for restrictive filters
   */
  private hasRestrictiveFilters(params: any): boolean {
    if (!params || typeof params !== 'object') return false;

    const restrictivePatterns = [
      'status' in params && params.status !== 'active',
      'date_from' in params && this.isOldDate(params.date_from),
      'limit' in params && params.limit === 1,
      'page' in params && params.page > 10
    ];

    return restrictivePatterns.some(Boolean);
  }

  /**
   * Check for invalid parameters
   */
  private hasInvalidParameters(params: any): boolean {
    if (!params || typeof params !== 'object') return false;

    // Check for invalid ID formats
    const idFields = ['_id', 'id', 'facility_id', 'client_id', 'shipment_id'];
    for (const field of idFields) {
      if (params[field] && typeof params[field] === 'string') {
        if (params[field].length < 3 || params[field].includes('PLACEHOLDER')) {
          return true;
        }
      }
    }

    return false;
  }

  /**
   * Check for date range issues
   */
  private hasDateRangeIssues(params: any): boolean {
    if (!params || typeof params !== 'object') return false;

    const dateFrom = params.date_from || params.start_date;
    const dateTo = params.date_to || params.end_date;

    if (dateFrom && dateTo) {
      const fromDate = new Date(dateFrom);
      const toDate = new Date(dateTo);

      // Check if date range is in the future
      if (fromDate > new Date()) {
        return true;
      }

      // Check if date range is too narrow
      const diffDays = (toDate.getTime() - fromDate.getTime()) / (1000 * 60 * 60 * 24);
      if (diffDays < 1) {
        return true;
      }
    }

    return false;
  }

  /**
   * Check for location issues
   */
  private hasLocationIssues(params: any): boolean {
    if (!params || typeof params !== 'object') return false;

    const locationFields = ['location', 'city', 'state', 'country'];
    for (const field of locationFields) {
      if (params[field] && typeof params[field] === 'string') {
        if (params[field].includes('PLACEHOLDER') ||
            params[field].length < 2 ||
            params[field].includes('Mock')) {
          return true;
        }
      }
    }

    return false;
  }

  /**
   * Get common reasons for empty results
   */
  private getCommonReasons(reasons: string[]): string[] {
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
   * Check if a date is old (more than 1 year ago)
   */
  private isOldDate(dateStr: string): boolean {
    if (!dateStr) return false;
    const date = new Date(dateStr);
    const oneYearAgo = new Date();
    oneYearAgo.setFullYear(oneYearAgo.getFullYear() - 1);
    return date < oneYearAgo;
  }
}
