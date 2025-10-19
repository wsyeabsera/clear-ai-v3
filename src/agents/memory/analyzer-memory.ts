// Analyzer Memory Repository for storing and retrieving analysis feedback

import { AnalyzerMemoryEntry } from './types';
import { EmbeddingService } from './embedding-service';
import { VectorStore } from './types';

export class AnalyzerMemoryRepository {
  private embeddingService: EmbeddingService;
  private vectorStore: VectorStore;

  constructor(embeddingService: EmbeddingService, vectorStore: VectorStore) {
    this.embeddingService = embeddingService;
    this.vectorStore = vectorStore;
  }

  async store(entry: AnalyzerMemoryEntry): Promise<void> {
    try {
      await this.vectorStore.upsert([{
        id: entry.id,
        vector: entry.embedding,
        metadata: {
          execution_id: entry.execution_id,
          plan_request_id: entry.plan_request_id,
          feedback: entry.feedback,
          success_rate: entry.evaluation_metrics.success_rate,
          efficiency_score: entry.evaluation_metrics.efficiency_score,
          error_patterns: entry.evaluation_metrics.error_patterns,
          improvement_notes: entry.improvement_notes,
          timestamp: entry.metadata.timestamp.toISOString(),
          user_query: entry.metadata.user_query
        },
        namespace: 'analyzer_memory'
      }]);
    } catch (error) {
      if (error instanceof Error) {
        throw new Error(`Failed to store analyzer memory entry: ${error.message}`);
      }
      throw new Error('Failed to store analyzer memory entry: Unknown error');
    }
  }

  async search(query: string, topK: number = 10, filter?: Record<string, any>): Promise<AnalyzerMemoryEntry[]> {
    try {
      const embedding = await this.embeddingService.generateEmbedding(query);
      const results = await this.vectorStore.query(embedding, topK, 'analyzer_memory', filter);

      return results.map(result => ({
        id: result.id,
        execution_id: result.metadata.execution_id,
        plan_request_id: result.metadata.plan_request_id,
        feedback: result.metadata.feedback,
        evaluation_metrics: {
          success_rate: result.metadata.success_rate,
          efficiency_score: result.metadata.efficiency_score,
          error_patterns: result.metadata.error_patterns
        },
        improvement_notes: result.metadata.improvement_notes,
        embedding: [], // Not returned from search
        metadata: {
          timestamp: new Date(result.metadata.timestamp),
          user_query: result.metadata.user_query
        }
      }));
    } catch (error) {
      if (error instanceof Error) {
        throw new Error(`Failed to search analyzer memory: ${error.message}`);
      }
      throw new Error('Failed to search analyzer memory: Unknown error');
    }
  }

  async getByExecutionId(executionId: string): Promise<AnalyzerMemoryEntry | null> {
    try {
      // Use a dummy embedding for exact match search
      const dummyEmbedding = new Array(1536).fill(0);
      const results = await this.vectorStore.query(
        dummyEmbedding, 
        1, 
        'analyzer_memory', 
        { execution_id: executionId }
      );

      if (results.length === 0) {
        return null;
      }

      const result = results[0];
      return {
        id: result.id,
        execution_id: result.metadata.execution_id,
        plan_request_id: result.metadata.plan_request_id,
        feedback: result.metadata.feedback,
        evaluation_metrics: {
          success_rate: result.metadata.success_rate,
          efficiency_score: result.metadata.efficiency_score,
          error_patterns: result.metadata.error_patterns
        },
        improvement_notes: result.metadata.improvement_notes,
        embedding: [], // Not returned from search
        metadata: {
          timestamp: new Date(result.metadata.timestamp),
          user_query: result.metadata.user_query
        }
      };
    } catch (error) {
      if (error instanceof Error) {
        throw new Error(`Failed to get analyzer memory by execution ID: ${error.message}`);
      }
      throw new Error('Failed to get analyzer memory by execution ID: Unknown error');
    }
  }

  async delete(id: string): Promise<void> {
    try {
      await this.vectorStore.delete([id], 'analyzer_memory');
    } catch (error) {
      if (error instanceof Error) {
        throw new Error(`Failed to delete analyzer memory entry: ${error.message}`);
      }
      throw new Error('Failed to delete analyzer memory entry: Unknown error');
    }
  }

  async update(entry: AnalyzerMemoryEntry): Promise<void> {
    try {
      await this.vectorStore.update([{
        id: entry.id,
        vector: entry.embedding,
        metadata: {
          execution_id: entry.execution_id,
          plan_request_id: entry.plan_request_id,
          feedback: entry.feedback,
          success_rate: entry.evaluation_metrics.success_rate,
          efficiency_score: entry.evaluation_metrics.efficiency_score,
          error_patterns: entry.evaluation_metrics.error_patterns,
          improvement_notes: entry.improvement_notes,
          timestamp: entry.metadata.timestamp.toISOString(),
          user_query: entry.metadata.user_query
        },
        namespace: 'analyzer_memory'
      }]);
    } catch (error) {
      if (error instanceof Error) {
        throw new Error(`Failed to update analyzer memory entry: ${error.message}`);
      }
      throw new Error('Failed to update analyzer memory entry: Unknown error');
    }
  }
}
