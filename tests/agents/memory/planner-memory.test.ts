// Tests for Planner Memory Repository

import { PlannerMemoryRepository } from '../../../src/agents/memory/planner-memory';
import { PlannerMemoryEntry } from '../../../src/agents/memory/types';

// Mock dependencies
jest.mock('../../../src/agents/memory/embedding-service');
jest.mock('../../../src/agents/memory/vector-store');

describe('PlannerMemoryRepository', () => {
  let repository: PlannerMemoryRepository;
  let mockEmbeddingService: any;
  let mockVectorStore: any;

  beforeEach(() => {
    const { EmbeddingService } = require('../../../src/agents/memory/embedding-service');
    const { PineconeVectorStore } = require('../../../src/agents/memory/vector-store');
    
    mockEmbeddingService = {
      generateEmbedding: jest.fn(),
      generateEmbeddings: jest.fn()
    };
    
    mockVectorStore = {
      upsert: jest.fn(),
      query: jest.fn(),
      delete: jest.fn(),
      update: jest.fn()
    };

    repository = new PlannerMemoryRepository(mockEmbeddingService, mockVectorStore);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('store', () => {
    it('should store planner memory entry', async () => {
      const entry: PlannerMemoryEntry = {
        id: 'test-id',
        request_id: 'req-123',
        query: 'test query',
        goal: 'test goal',
        plan_schema: { steps: [] },
        execution_summary: 'test summary',
        embedding: [0.1, 0.2, 0.3],
        metadata: {
          success: true,
          execution_time_ms: 1000,
          total_steps: 3,
          timestamp: new Date()
        }
      };

      mockVectorStore.upsert.mockResolvedValue(undefined);

      await repository.store(entry);

      expect(mockVectorStore.upsert).toHaveBeenCalledWith([{
        id: 'test-id',
        vector: [0.1, 0.2, 0.3],
        metadata: {
          request_id: 'req-123',
          query: 'test query',
          goal: 'test goal',
          plan_schema: { steps: [] },
          execution_summary: 'test summary',
          success: true,
          execution_time_ms: 1000,
          total_steps: 3,
          timestamp: entry.metadata.timestamp
        },
        namespace: 'planner_memory'
      }]);
    });

    it('should handle storage errors', async () => {
      const entry: PlannerMemoryEntry = {
        id: 'test-id',
        request_id: 'req-123',
        query: 'test query',
        goal: 'test goal',
        plan_schema: { steps: [] },
        execution_summary: 'test summary',
        embedding: [0.1, 0.2, 0.3],
        metadata: {
          success: true,
          execution_time_ms: 1000,
          total_steps: 3,
          timestamp: new Date()
        }
      };

      mockVectorStore.upsert.mockRejectedValue(new Error('Storage failed'));

      await expect(repository.store(entry)).rejects.toThrow('Storage failed');
    });
  });

  describe('search', () => {
    it('should search planner memory entries', async () => {
      const mockResults = [
        {
          id: 'test-id-1',
          score: 0.95,
          metadata: {
            request_id: 'req-123',
            query: 'test query',
            goal: 'test goal',
            plan_schema: { steps: [] },
            execution_summary: 'test summary',
            success: true,
            execution_time_ms: 1000,
            total_steps: 3,
            timestamp: new Date()
          }
        }
      ];

      mockEmbeddingService.generateEmbedding.mockResolvedValue([0.1, 0.2, 0.3]);
      mockVectorStore.query.mockResolvedValue(mockResults);

      const results = await repository.search('test query', 5);

      expect(mockEmbeddingService.generateEmbedding).toHaveBeenCalledWith('test query');
      expect(mockVectorStore.query).toHaveBeenCalledWith(
        [0.1, 0.2, 0.3],
        5,
        'planner_memory',
        undefined
      );
      expect(results).toHaveLength(1);
      expect(results[0].id).toBe('test-id-1');
    });

    it('should search with filter', async () => {
      const mockResults: any[] = [];
      mockEmbeddingService.generateEmbedding.mockResolvedValue([0.1, 0.2, 0.3]);
      mockVectorStore.query.mockResolvedValue(mockResults);

      await repository.search('test query', 5, { success: true });

      expect(mockVectorStore.query).toHaveBeenCalledWith(
        [0.1, 0.2, 0.3],
        5,
        'planner_memory',
        { success: true }
      );
    });

    it('should handle search errors', async () => {
      mockEmbeddingService.generateEmbedding.mockRejectedValue(new Error('Embedding failed'));

      await expect(repository.search('test query', 5)).rejects.toThrow('Embedding failed');
    });
  });

  describe('getByRequestId', () => {
    it('should get planner memory entry by request id', async () => {
      const mockResults = [
        {
          id: 'test-id',
          score: 1.0,
          metadata: {
            request_id: 'req-123',
            query: 'test query',
            goal: 'test goal',
            plan_schema: { steps: [] },
            execution_summary: 'test summary',
            success: true,
            execution_time_ms: 1000,
            total_steps: 3,
            timestamp: new Date()
          }
        }
      ];

      mockVectorStore.query.mockResolvedValue(mockResults);

      const result = await repository.getByRequestId('req-123');

      expect(mockVectorStore.query).toHaveBeenCalledWith(
        expect.any(Array),
        1,
        'planner_memory',
        { request_id: 'req-123' }
      );
      expect(result).toBeDefined();
      expect(result?.id).toBe('test-id');
    });

    it('should return null if no entry found', async () => {
      const mockResults: any[] = [];
      mockVectorStore.query.mockResolvedValue(mockResults);

      const result = await repository.getByRequestId('nonexistent');

      expect(result).toBeNull();
    });
  });
});
