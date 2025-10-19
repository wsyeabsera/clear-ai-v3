// Planner Memory Repository for storing and retrieving planning experiences

import { PlannerMemoryEntry } from './types';
import { EmbeddingService } from './embedding-service';
import { VectorStore } from './types';

export class PlannerMemoryRepository {
  private embeddingService: EmbeddingService;
  private vectorStore: VectorStore;

  constructor(embeddingService: EmbeddingService, vectorStore: VectorStore) {
    this.embeddingService = embeddingService;
    this.vectorStore = vectorStore;
  }

  async store(entry: PlannerMemoryEntry): Promise<void> {
    try {
      await this.vectorStore.upsert([{
        id: entry.id,
        vector: entry.embedding,
        metadata: {
          request_id: entry.request_id,
          query: entry.query,
          goal: entry.goal,
          plan_schema: entry.plan_schema,
          execution_summary: entry.execution_summary,
          success: entry.metadata.success,
          execution_time_ms: entry.metadata.execution_time_ms,
          total_steps: entry.metadata.total_steps,
          timestamp: entry.metadata.timestamp
        },
        namespace: 'planner_memory'
      }]);
    } catch (error) {
      if (error instanceof Error) {
        throw new Error(`Failed to store planner memory entry: ${error.message}`);
      }
      throw new Error('Failed to store planner memory entry: Unknown error');
    }
  }

  async search(query: string, topK: number = 10, filter?: Record<string, any>): Promise<PlannerMemoryEntry[]> {
    try {
      const embedding = await this.embeddingService.generateEmbedding(query);
      const results = await this.vectorStore.query(embedding, topK, 'planner_memory', filter);

      return results.map(result => ({
        id: result.id,
        request_id: result.metadata.request_id,
        query: result.metadata.query,
        goal: result.metadata.goal,
        plan_schema: result.metadata.plan_schema,
        execution_summary: result.metadata.execution_summary,
        embedding: [], // Not returned from search
        metadata: {
          success: result.metadata.success,
          execution_time_ms: result.metadata.execution_time_ms,
          total_steps: result.metadata.total_steps,
          timestamp: new Date(result.metadata.timestamp)
        }
      }));
    } catch (error) {
      if (error instanceof Error) {
        throw new Error(`Failed to search planner memory: ${error.message}`);
      }
      throw new Error('Failed to search planner memory: Unknown error');
    }
  }

  async getByRequestId(requestId: string): Promise<PlannerMemoryEntry | null> {
    try {
      // Use a dummy embedding for exact match search
      const dummyEmbedding = new Array(1536).fill(0);
      const results = await this.vectorStore.query(
        dummyEmbedding, 
        1, 
        'planner_memory', 
        { request_id: requestId }
      );

      if (results.length === 0) {
        return null;
      }

      const result = results[0];
      return {
        id: result.id,
        request_id: result.metadata.request_id,
        query: result.metadata.query,
        goal: result.metadata.goal,
        plan_schema: result.metadata.plan_schema,
        execution_summary: result.metadata.execution_summary,
        embedding: [], // Not returned from search
        metadata: {
          success: result.metadata.success,
          execution_time_ms: result.metadata.execution_time_ms,
          total_steps: result.metadata.total_steps,
          timestamp: new Date(result.metadata.timestamp)
        }
      };
    } catch (error) {
      if (error instanceof Error) {
        throw new Error(`Failed to get planner memory by request ID: ${error.message}`);
      }
      throw new Error('Failed to get planner memory by request ID: Unknown error');
    }
  }

  async delete(id: string): Promise<void> {
    try {
      await this.vectorStore.delete([id], 'planner_memory');
    } catch (error) {
      if (error instanceof Error) {
        throw new Error(`Failed to delete planner memory entry: ${error.message}`);
      }
      throw new Error('Failed to delete planner memory entry: Unknown error');
    }
  }

  async update(entry: PlannerMemoryEntry): Promise<void> {
    try {
      await this.vectorStore.update([{
        id: entry.id,
        vector: entry.embedding,
        metadata: {
          request_id: entry.request_id,
          query: entry.query,
          goal: entry.goal,
          plan_schema: entry.plan_schema,
          execution_summary: entry.execution_summary,
          success: entry.metadata.success,
          execution_time_ms: entry.metadata.execution_time_ms,
          total_steps: entry.metadata.total_steps,
          timestamp: entry.metadata.timestamp
        },
        namespace: 'planner_memory'
      }]);
    } catch (error) {
      if (error instanceof Error) {
        throw new Error(`Failed to update planner memory entry: ${error.message}`);
      }
      throw new Error('Failed to update planner memory entry: Unknown error');
    }
  }
}
