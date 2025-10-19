// Tests for Vector Store

import { PineconeVectorStore } from '../../../src/agents/memory/vector-store';
import { VectorEntry, VectorSearchResult } from '../../../src/agents/memory/types';

// Mock Pinecone
jest.mock('@pinecone-database/pinecone', () => ({
  Pinecone: jest.fn().mockImplementation(() => ({
    index: jest.fn().mockReturnValue({
      upsert: jest.fn(),
      query: jest.fn(),
      deleteMany: jest.fn(),
      update: jest.fn()
    })
  }))
}));

describe('PineconeVectorStore', () => {
  let store: PineconeVectorStore;
  let mockIndex: any;

  beforeEach(() => {
    const { Pinecone } = require('@pinecone-database/pinecone');
    const mockPinecone = new Pinecone();
    mockIndex = mockPinecone.index();
    store = new PineconeVectorStore('test-api-key', 'test-environment', 'test-index');
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('upsert', () => {
    it('should upsert single entry', async () => {
      const entry: VectorEntry = {
        id: 'test-id',
        vector: [0.1, 0.2, 0.3],
        metadata: { test: 'data' },
        namespace: 'test-namespace'
      };

      mockIndex.upsert.mockResolvedValue({ upsertedCount: 1 });

      await store.upsert([entry]);

      expect(mockIndex.upsert).toHaveBeenCalledWith({
        vectors: [{
          id: 'test-id',
          values: [0.1, 0.2, 0.3],
          metadata: { test: 'data' }
        }],
        namespace: 'test-namespace'
      });
    });

    it('should upsert multiple entries', async () => {
      const entries: VectorEntry[] = [
        {
          id: 'test-id-1',
          vector: [0.1, 0.2, 0.3],
          metadata: { test: 'data1' }
        },
        {
          id: 'test-id-2',
          vector: [0.4, 0.5, 0.6],
          metadata: { test: 'data2' }
        }
      ];

      mockIndex.upsert.mockResolvedValue({ upsertedCount: 2 });

      await store.upsert(entries);

      expect(mockIndex.upsert).toHaveBeenCalledWith({
        vectors: [
          {
            id: 'test-id-1',
            values: [0.1, 0.2, 0.3],
            metadata: { test: 'data1' }
          },
          {
            id: 'test-id-2',
            values: [0.4, 0.5, 0.6],
            metadata: { test: 'data2' }
          }
        ]
      });
    });

    it('should handle upsert errors', async () => {
      const entry: VectorEntry = {
        id: 'test-id',
        vector: [0.1, 0.2, 0.3],
        metadata: { test: 'data' }
      };

      mockIndex.upsert.mockRejectedValue(new Error('Upsert failed'));

      await expect(store.upsert([entry])).rejects.toThrow('Upsert failed');
    });
  });

  describe('query', () => {
    it('should query vectors with basic parameters', async () => {
      const mockResponse = {
        matches: [
          {
            id: 'test-id-1',
            score: 0.95,
            metadata: { test: 'data1' }
          },
          {
            id: 'test-id-2',
            score: 0.87,
            metadata: { test: 'data2' }
          }
        ]
      };

      mockIndex.query.mockResolvedValue(mockResponse);

      const result = await store.query([0.1, 0.2, 0.3], 5);

      expect(mockIndex.query).toHaveBeenCalledWith({
        vector: [0.1, 0.2, 0.3],
        topK: 5,
        includeMetadata: true
      });

      expect(result).toEqual([
        {
          id: 'test-id-1',
          score: 0.95,
          metadata: { test: 'data1' }
        },
        {
          id: 'test-id-2',
          score: 0.87,
          metadata: { test: 'data2' }
        }
      ]);
    });

    it('should query with namespace and filter', async () => {
      const mockResponse = { matches: [] };
      mockIndex.query.mockResolvedValue(mockResponse);

      await store.query([0.1, 0.2, 0.3], 5, 'test-namespace', { category: 'test' });

      expect(mockIndex.query).toHaveBeenCalledWith({
        vector: [0.1, 0.2, 0.3],
        topK: 5,
        namespace: 'test-namespace',
        filter: { category: 'test' },
        includeMetadata: true
      });
    });

    it('should handle query errors', async () => {
      mockIndex.query.mockRejectedValue(new Error('Query failed'));

      await expect(store.query([0.1, 0.2, 0.3], 5)).rejects.toThrow('Query failed');
    });
  });

  describe('delete', () => {
    it('should delete vectors by ids', async () => {
      mockIndex.deleteMany.mockResolvedValue({ deletedCount: 2 });

      await store.delete(['id1', 'id2'], 'test-namespace');

      expect(mockIndex.deleteMany).toHaveBeenCalledWith({
        ids: ['id1', 'id2'],
        namespace: 'test-namespace'
      });
    });

    it('should handle delete errors', async () => {
      mockIndex.deleteMany.mockRejectedValue(new Error('Delete failed'));

      await expect(store.delete(['id1'], 'test-namespace')).rejects.toThrow('Delete failed');
    });
  });

  describe('update', () => {
    it('should update vectors', async () => {
      const entries: VectorEntry[] = [
        {
          id: 'test-id',
          vector: [0.1, 0.2, 0.3],
          metadata: { test: 'updated' }
        }
      ];

      mockIndex.update.mockResolvedValue({ updatedCount: 1 });

      await store.update(entries);

      expect(mockIndex.update).toHaveBeenCalledWith({
        vectors: [{
          id: 'test-id',
          values: [0.1, 0.2, 0.3],
          metadata: { test: 'updated' }
        }]
      });
    });

    it('should handle update errors', async () => {
      const entries: VectorEntry[] = [
        {
          id: 'test-id',
          vector: [0.1, 0.2, 0.3],
          metadata: { test: 'data' }
        }
      ];

      mockIndex.update.mockRejectedValue(new Error('Update failed'));

      await expect(store.update(entries)).rejects.toThrow('Update failed');
    });
  });

  describe('namespace isolation', () => {
    it('should use different namespaces for different operations', async () => {
      const entry: VectorEntry = {
        id: 'test-id',
        vector: [0.1, 0.2, 0.3],
        metadata: { test: 'data' },
        namespace: 'planner_memory'
      };

      mockIndex.upsert.mockResolvedValue({ upsertedCount: 1 });

      await store.upsert([entry]);

      expect(mockIndex.upsert).toHaveBeenCalledWith({
        vectors: [{
          id: 'test-id',
          values: [0.1, 0.2, 0.3],
          metadata: { test: 'data' }
        }],
        namespace: 'planner_memory'
      });
    });
  });
});
