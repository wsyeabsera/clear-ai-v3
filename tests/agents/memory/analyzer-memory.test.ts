// Tests for Analyzer Memory Repository

import { AnalyzerMemoryRepository } from '../../../src/agents/memory/analyzer-memory';
import { AnalyzerMemoryEntry } from '../../../src/agents/memory/types';

// Mock dependencies
jest.mock('../../../src/agents/memory/embedding-service');
jest.mock('../../../src/agents/memory/vector-store');

describe('AnalyzerMemoryRepository', () => {
  let repository: AnalyzerMemoryRepository;
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

    repository = new AnalyzerMemoryRepository(mockEmbeddingService, mockVectorStore);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('store', () => {
    it('should store analyzer memory entry', async () => {
      const entry: AnalyzerMemoryEntry = {
        id: 'test-id',
        execution_id: 'exec-123',
        plan_request_id: 'req-123',
        feedback: 'test feedback',
        evaluation_metrics: {
          success_rate: 0.95,
          efficiency_score: 0.87,
          error_patterns: ['timeout', 'validation']
        },
        improvement_notes: 'test notes',
        embedding: [0.1, 0.2, 0.3],
        metadata: {
          timestamp: new Date(),
          user_query: 'test query'
        }
      };

      mockVectorStore.upsert.mockResolvedValue(undefined);

      await repository.store(entry);

      expect(mockVectorStore.upsert).toHaveBeenCalledWith([{
        id: 'test-id',
        vector: [0.1, 0.2, 0.3],
        metadata: {
          execution_id: 'exec-123',
          plan_request_id: 'req-123',
          feedback: 'test feedback',
          evaluation_metrics: {
            success_rate: 0.95,
            efficiency_score: 0.87,
            error_patterns: ['timeout', 'validation']
          },
          improvement_notes: 'test notes',
          timestamp: entry.metadata.timestamp,
          user_query: 'test query'
        },
        namespace: 'analyzer_memory'
      }]);
    });

    it('should handle storage errors', async () => {
      const entry: AnalyzerMemoryEntry = {
        id: 'test-id',
        execution_id: 'exec-123',
        plan_request_id: 'req-123',
        feedback: 'test feedback',
        evaluation_metrics: {
          success_rate: 0.95,
          efficiency_score: 0.87,
          error_patterns: []
        },
        improvement_notes: 'test notes',
        embedding: [0.1, 0.2, 0.3],
        metadata: {
          timestamp: new Date(),
          user_query: 'test query'
        }
      };

      mockVectorStore.upsert.mockRejectedValue(new Error('Storage failed'));

      await expect(repository.store(entry)).rejects.toThrow('Storage failed');
    });
  });

  describe('search', () => {
    it('should search analyzer memory entries', async () => {
      const mockResults = [
        {
          id: 'test-id-1',
          score: 0.95,
          metadata: {
            execution_id: 'exec-123',
            plan_request_id: 'req-123',
            feedback: 'test feedback',
            evaluation_metrics: {
              success_rate: 0.95,
              efficiency_score: 0.87,
              error_patterns: []
            },
            improvement_notes: 'test notes',
            timestamp: new Date(),
            user_query: 'test query'
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
        'analyzer_memory',
        undefined
      );
      expect(results).toHaveLength(1);
      expect(results[0].id).toBe('test-id-1');
    });

    it('should search with filter', async () => {
      const mockResults: any[] = [];
      mockEmbeddingService.generateEmbedding.mockResolvedValue([0.1, 0.2, 0.3]);
      mockVectorStore.query.mockResolvedValue(mockResults);

      await repository.search('test query', 5, { 'evaluation_metrics.success_rate': { $gte: 0.8 } });

      expect(mockVectorStore.query).toHaveBeenCalledWith(
        [0.1, 0.2, 0.3],
        5,
        'analyzer_memory',
        { 'evaluation_metrics.success_rate': { $gte: 0.8 } }
      );
    });

    it('should handle search errors', async () => {
      mockEmbeddingService.generateEmbedding.mockRejectedValue(new Error('Embedding failed'));

      await expect(repository.search('test query', 5)).rejects.toThrow('Embedding failed');
    });
  });

  describe('getByExecutionId', () => {
    it('should get analyzer memory entry by execution id', async () => {
      const mockResults = [
        {
          id: 'test-id',
          score: 1.0,
          metadata: {
            execution_id: 'exec-123',
            plan_request_id: 'req-123',
            feedback: 'test feedback',
            evaluation_metrics: {
              success_rate: 0.95,
              efficiency_score: 0.87,
              error_patterns: []
            },
            improvement_notes: 'test notes',
            timestamp: new Date(),
            user_query: 'test query'
          }
        }
      ];

      mockVectorStore.query.mockResolvedValue(mockResults);

      const result = await repository.getByExecutionId('exec-123');

      expect(mockVectorStore.query).toHaveBeenCalledWith(
        expect.any(Array),
        1,
        'analyzer_memory',
        { execution_id: 'exec-123' }
      );
      expect(result).toBeDefined();
      expect(result?.id).toBe('test-id');
    });

    it('should return null if no entry found', async () => {
      const mockResults: any[] = [];
      mockVectorStore.query.mockResolvedValue(mockResults);

      const result = await repository.getByExecutionId('nonexistent');

      expect(result).toBeNull();
    });
  });
});
