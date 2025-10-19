// Analyzer Agent for evaluating execution results and providing feedback

import { randomUUID } from 'crypto';
import { AnalysisResult, AnalysisContext, EvaluationMetrics } from './types';
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

      // Store analysis in MongoDB
      await AnalyzerStorage.saveAnalysis(analysisResult);

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

    // Calculate efficiency score (higher is better)
    const efficiencyScore = Math.max(0, Math.min(1, 
      (successRate * 0.6) + 
      ((1 - retryFrequency) * 0.2) + 
      (execution_time_ms < 30000 ? 0.2 : 0) // Bonus for quick execution
    ));

    // Extract error patterns
    const errorPatterns = execution_results
      .filter(r => r.status === 'FAILED' && r.error)
      .map(r => r.error!)
      .filter((error, index, arr) => arr.indexOf(error) === index); // Remove duplicates

    return {
      success_rate: successRate,
      efficiency_score: efficiencyScore,
      step_success_rates: stepSuccessRates,
      error_patterns: errorPatterns,
      retry_frequency: retryFrequency,
      average_step_time_ms: averageStepTimeMs
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

      return JSON.parse(content);
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
      ? `\n\nHistorical Context:\n${historicalContext.map(h => 
          `- Previous execution: ${h.feedback}\n  Success rate: ${h.evaluation_metrics.success_rate}\n  Patterns: ${h.evaluation_metrics.error_patterns.join(', ')}`
        ).join('\n')}`
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
}
