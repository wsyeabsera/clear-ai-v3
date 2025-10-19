// Simple tests for Embedding Service

import { EmbeddingService } from '../../../src/agents/memory/embedding-service';

// Mock the OpenAI module
jest.mock('openai', () => {
  return {
    default: jest.fn().mockImplementation(() => ({
      embeddings: {
        create: jest.fn().mockResolvedValue({
          data: [{ embedding: [0.1, 0.2, 0.3] }]
        })
      }
    }))
  };
});

describe('EmbeddingService', () => {
  let service: EmbeddingService;

  beforeEach(() => {
    // Create a mock provider
    const mockProvider = {
      generateEmbedding: jest.fn().mockResolvedValue([0.1, 0.2, 0.3]),
      generateEmbeddings: jest.fn().mockImplementation((texts) => {
        if (texts.length === 0) return Promise.resolve([]);
        return Promise.resolve([[0.1, 0.2, 0.3], [0.4, 0.5, 0.6]]);
      })
    };
    
    service = new EmbeddingService(mockProvider);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('generateEmbedding', () => {
    it('should generate embedding for single text', async () => {
      const result = await service.generateEmbedding('test text');
      expect(result).toEqual([0.1, 0.2, 0.3]);
    });
  });

  describe('generateEmbeddings', () => {
    it('should generate embeddings for multiple texts', async () => {
      const result = await service.generateEmbeddings(['text1', 'text2']);
      expect(result).toEqual([[0.1, 0.2, 0.3], [0.4, 0.5, 0.6]]);
    });

    it('should handle empty input array', async () => {
      const result = await service.generateEmbeddings([]);
      expect(result).toEqual([]);
    });
  });

  describe('setProvider', () => {
    it('should allow switching providers', () => {
      const newProvider = {
        generateEmbedding: jest.fn(),
        generateEmbeddings: jest.fn()
      };
      
      service.setProvider(newProvider);
      // No assertion needed, just checking it doesn't throw
    });
  });
});
