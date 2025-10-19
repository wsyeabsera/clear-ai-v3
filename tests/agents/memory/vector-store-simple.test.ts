// Simple tests for Vector Store

import { PineconeVectorStore } from '../../../src/agents/memory/vector-store';
import { VectorEntry } from '../../../src/agents/memory/types';

// Mock Pinecone
const mockUpsert = jest.fn();
const mockQuery = jest.fn();
const mockDeleteMany = jest.fn();
const mockUpdate = jest.fn();

jest.mock('@pinecone-database/pinecone', () => ({
  Pinecone: jest.fn().mockImplementation(() => ({
    index: jest.fn().mockReturnValue({
      upsert: mockUpsert,
      query: mockQuery,
      deleteMany: mockDeleteMany,
      update: mockUpdate
    })
  }))
}));

describe('PineconeVectorStore', () => {
  let store: PineconeVectorStore;

  beforeEach(() => {
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

      mockUpsert.mockResolvedValue({ upsertedCount: 1 });

      await store.upsert([entry]);

      expect(mockUpsert).toHaveBeenCalledWith({
        vectors: [{
          id: 'test-id',
          values: [0.1, 0.2, 0.3],
          metadata: { test: 'data' }
        }],
        namespace: 'test-namespace'
      });
    });

    it('should handle upsert errors', async () => {
      const entry: VectorEntry = {
        id: 'test-id',
        vector: [0.1, 0.2, 0.3],
        metadata: { test: 'data' }
      };

      mockUpsert.mockRejectedValue(new Error('Upsert failed'));

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
          }
        ]
      };

      mockQuery.mockResolvedValue(mockResponse);

      const result = await store.query([0.1, 0.2, 0.3], 5);

      expect(mockQuery).toHaveBeenCalledWith({
        vector: [0.1, 0.2, 0.3],
        topK: 5,
        includeMetadata: true
      });

      expect(result).toEqual([
        {
          id: 'test-id-1',
          score: 0.95,
          metadata: { test: 'data1' }
        }
      ]);
    });

    it('should handle query errors', async () => {
      mockQuery.mockRejectedValue(new Error('Query failed'));

      await expect(store.query([0.1, 0.2, 0.3], 5)).rejects.toThrow('Query failed');
    });
  });

  describe('delete', () => {
    it('should delete vectors by ids', async () => {
      mockDeleteMany.mockResolvedValue({ deletedCount: 2 });

      await store.delete(['id1', 'id2'], 'test-namespace');

      expect(mockDeleteMany).toHaveBeenCalledWith({
        ids: ['id1', 'id2'],
        namespace: 'test-namespace'
      });
    });

    it('should handle delete errors', async () => {
      mockDeleteMany.mockRejectedValue(new Error('Delete failed'));

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

      mockUpdate.mockResolvedValue({ updatedCount: 1 });

      await store.update(entries);

      expect(mockUpdate).toHaveBeenCalledWith({
        vectors: [{
          id: 'test-id',
          values: [0.1, 0.2, 0.3],
          metadata: { test: 'updated' }
        }],
        namespace: 'default'
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

      mockUpdate.mockRejectedValue(new Error('Update failed'));

      await expect(store.update(entries)).rejects.toThrow('Update failed');
    });
  });
});
