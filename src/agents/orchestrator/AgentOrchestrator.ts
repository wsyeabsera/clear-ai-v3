// Agent Orchestrator for coordinating all agents in the full cycle

import { randomUUID } from 'crypto';
import { FullCycleResult, FullCycleRequest, FeedbackRequest, FeedbackResult, OrchestratorStats } from './types';
import { PlannerAgent } from '../planner/PlannerAgent';
import { ExecutionAgent } from '../executor/ExecutionAgent';
import { AnalyzerAgent } from '../analyzer/AnalyzerAgent';
import { SummarizerAgent } from '../summarizer/SummarizerAgent';
import { PlannerMemoryRepository } from '../memory/planner-memory';
import { AnalyzerMemoryRepository } from '../memory/analyzer-memory';
import { EmbeddingService, OpenAIEmbeddingProvider } from '../memory/embedding-service';
import { PineconeVectorStore } from '../memory/vector-store';
import { PlannerMemoryEntry } from '../memory/types';

export class AgentOrchestrator {
  private plannerAgent: PlannerAgent;
  private executionAgent: ExecutionAgent;
  private analyzerAgent: AnalyzerAgent;
  private summarizerAgent: SummarizerAgent;
  private plannerMemoryRepository: PlannerMemoryRepository;
  private analyzerMemoryRepository: AnalyzerMemoryRepository;

  constructor() {
    // Initialize embedding service
    const embeddingService = new EmbeddingService(
      new OpenAIEmbeddingProvider(
        process.env.OPENAI_API_KEY || '',
        process.env.OPENAI_EMBEDDING_MODEL || 'text-embedding-3-small'
      )
    );

    // Initialize vector store
    const vectorStore = new PineconeVectorStore(
      process.env.PINECONE_API_KEY || '',
      process.env.PINECONE_ENVIRONMENT || '',
      process.env.PINECONE_INDEX_NAME || 'clear-ai-memory'
    );

    // Initialize memory repositories
    this.plannerMemoryRepository = new PlannerMemoryRepository(embeddingService, vectorStore);
    this.analyzerMemoryRepository = new AnalyzerMemoryRepository(embeddingService, vectorStore);

    // Initialize agents
    this.plannerAgent = new PlannerAgent();
    this.executionAgent = new ExecutionAgent();
    this.analyzerAgent = new AnalyzerAgent();
    this.summarizerAgent = new SummarizerAgent();
  }

  async executeFullCycle(request: FullCycleRequest): Promise<FullCycleResult> {
    const startTime = Date.now();
    const requestId = randomUUID();

    try {
      console.log(`🚀 Starting full cycle for query: "${request.query}"`);

      // Step 1: Get historical context for planning
      console.log('📚 Retrieving historical context...');
      const historicalContext = await this.plannerMemoryRepository.search(request.query, 5);
      
      // Step 2: Create plan
      console.log('📋 Creating plan...');
      const plan = await this.plannerAgent.plan(request.query, request.llm_provider);
      
      // Step 3: Execute plan
      console.log('⚡ Executing plan...');
      const execution = await this.executionAgent.executePlan(plan.requestId, request.execution_config);
      
      // Step 4: Analyze execution
      console.log('🔍 Analyzing execution...');
      const analysis = await this.analyzerAgent.analyze(execution.executionId);
      
      // Step 5: Generate summary
      console.log('📝 Generating summary...');
      const summary = await this.summarizerAgent.summarize(
        execution.executionId, 
        request.summary_format as any || 'STRUCTURED'
      );

      // Step 6: Store execution in planner memory for future learning
      console.log('💾 Storing execution in memory...');
      await this.storeExecutionInMemory(plan, execution, analysis, request.query);

      const endTime = Date.now();
      const totalTime = endTime - startTime;

      const result: FullCycleResult = {
        request_id: requestId,
        execution_id: execution.executionId,
        analysis_id: analysis.analysis_id,
        summary_id: summary.summary_id,
        query: request.query,
        plan,
        execution,
        analysis,
        summary,
        success: execution.status === 'COMPLETED',
        total_time_ms: totalTime,
        created_at: new Date()
      };

      console.log(`✅ Full cycle completed in ${totalTime}ms`);
      return result;

    } catch (error) {
      const endTime = Date.now();
      const totalTime = endTime - startTime;
      
      console.error(`❌ Full cycle failed after ${totalTime}ms:`, error);
      
      // Create a partial result for failed cycles
      const result: FullCycleResult = {
        request_id: requestId,
        execution_id: '',
        analysis_id: '',
        summary_id: '',
        query: request.query,
        plan: {} as any,
        execution: {} as any,
        analysis: {} as any,
        summary: {} as any,
        success: false,
        total_time_ms: totalTime,
        created_at: new Date()
      };

      throw new Error(`Full cycle failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  async provideFeedback(feedback: FeedbackRequest): Promise<FeedbackResult> {
    try {
      console.log(`💬 Processing feedback for execution: ${feedback.execution_id}`);

      // Generate embedding for the feedback
      const embeddingService = new EmbeddingService(
        new OpenAIEmbeddingProvider(
          process.env.OPENAI_API_KEY || '',
          process.env.OPENAI_EMBEDDING_MODEL || 'text-embedding-3-small'
        )
      );

      const feedbackText = `${feedback.user_feedback} ${feedback.rating ? `Rating: ${feedback.rating}` : ''} ${feedback.categories ? feedback.categories.join(', ') : ''}`;
      const embedding = await embeddingService.generateEmbedding(feedbackText);

      // Store feedback in analyzer memory
      const analyzerMemoryRepository = new AnalyzerMemoryRepository(
        embeddingService,
        new PineconeVectorStore(
          process.env.PINECONE_API_KEY || '',
          process.env.PINECONE_ENVIRONMENT || '',
          process.env.PINECONE_INDEX_NAME || 'clear-ai-memory'
        )
      );

      await analyzerMemoryRepository.store({
        id: randomUUID(),
        execution_id: feedback.execution_id,
        plan_request_id: '', // Will be filled from execution data
        feedback: feedback.user_feedback,
        evaluation_metrics: {
          success_rate: feedback.rating ? feedback.rating / 5 : 0.5,
          efficiency_score: feedback.rating ? feedback.rating / 5 : 0.5,
          error_patterns: []
        },
        improvement_notes: `User feedback: ${feedback.user_feedback}`,
        embedding,
        metadata: {
          timestamp: new Date(),
          user_query: feedback.user_feedback
        }
      });

      const result: FeedbackResult = {
        feedback_id: randomUUID(),
        execution_id: feedback.execution_id,
        user_feedback: feedback.user_feedback,
        rating: feedback.rating,
        categories: feedback.categories,
        processed: true,
        created_at: new Date()
      };

      console.log(`✅ Feedback processed successfully`);
      return result;

    } catch (error) {
      console.error('❌ Failed to process feedback:', error);
      
      const result: FeedbackResult = {
        feedback_id: randomUUID(),
        execution_id: feedback.execution_id,
        user_feedback: feedback.user_feedback,
        rating: feedback.rating,
        categories: feedback.categories,
        processed: false,
        created_at: new Date()
      };

      return result;
    }
  }

  async getStatistics(): Promise<OrchestratorStats> {
    try {
      // This would typically query a statistics collection or aggregate from existing data
      // For now, return mock data
      return {
        total_cycles: 0,
        successful_cycles: 0,
        failed_cycles: 0,
        average_cycle_time_ms: 0,
        success_rate: 0,
        average_plan_steps: 0,
        average_execution_time_ms: 0,
        common_failure_patterns: [],
        top_queries: []
      };
    } catch (error) {
      console.error('Failed to get statistics:', error);
      throw new Error('Failed to retrieve statistics');
    }
  }

  private async storeExecutionInMemory(
    plan: any,
    execution: any,
    analysis: any,
    query: string
  ): Promise<void> {
    try {
      // Generate embedding for the execution summary
      const embeddingService = new EmbeddingService(
        new OpenAIEmbeddingProvider(
          process.env.OPENAI_API_KEY || '',
          process.env.OPENAI_EMBEDDING_MODEL || 'text-embedding-3-small'
        )
      );

      const summaryText = `${query} ${analysis.feedback} ${analysis.improvement_notes}`;
      const embedding = await embeddingService.generateEmbedding(summaryText);

      // Create planner memory entry
      const memoryEntry: PlannerMemoryEntry = {
        id: randomUUID(),
        request_id: plan.requestId,
        query: query,
        goal: `Execute: ${query}`,
        plan_schema: { steps: plan.plan.steps },
        execution_summary: analysis.feedback,
        embedding,
        metadata: {
          success: execution.status === 'COMPLETED',
          execution_time_ms: execution.completedAt && execution.startedAt 
            ? execution.completedAt.getTime() - execution.startedAt.getTime()
            : 0,
          total_steps: plan.plan.steps.length,
          timestamp: new Date()
        }
      };

      // Store in planner memory
      await this.plannerMemoryRepository.store(memoryEntry);

    } catch (error) {
      console.warn('Failed to store execution in memory:', error);
      // Don't throw - this is not critical for the main flow
    }
  }
}
