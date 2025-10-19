// Tests for Embedding Service

// Mock OpenAI before importing
const mockCreate = jest.fn();
const mockOpenAI = jest.fn().mockImplementation(() => ({
  embeddings: {
    create: mockCreate
  }
}));

jest.doMock('openai', () => ({
  default: mockOpenAI
}));

import { OpenAIEmbeddingProvider } from '../../../src/agents/memory/embedding-service';

describe('OpenAIEmbeddingProvider', () => {
  let provider: OpenAIEmbeddingProvider;

  beforeEach(() => {
    provider = new OpenAIEmbeddingProvider('test-api-key', 'text-embedding-3-small');
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('generateEmbedding', () => {
    it('should generate embedding for single text', async () => {
      const mockResponse = {
        data: [{ embedding: [0.1, 0.2, 0.3] }]
      };
      mockCreate.mockResolvedValue(mockResponse);

      const result = await provider.generateEmbedding('test text');

      expect(mockCreate).toHaveBeenCalledWith({
        model: 'text-embedding-3-small',
        input: 'test text'
      });
      expect(result).toEqual([0.1, 0.2, 0.3]);
    });

    it('should handle API errors', async () => {
      mockCreate.mockRejectedValue(new Error('API Error'));

      await expect(provider.generateEmbedding('test text')).rejects.toThrow('API Error');
    });

    it('should handle rate limit errors', async () => {
      const rateLimitError = new Error('Rate limit exceeded');
      (rateLimitError as any).status = 429;
      mockCreate.mockRejectedValue(rateLimitError);

      await expect(provider.generateEmbedding('test text')).rejects.toThrow('Rate limit exceeded');
    });
  });

  describe('generateEmbeddings', () => {
    it('should generate embeddings for multiple texts', async () => {
      const mockResponse = {
        data: [
          { embedding: [0.1, 0.2, 0.3] },
          { embedding: [0.4, 0.5, 0.6] }
        ]
      };
      mockCreate.mockResolvedValue(mockResponse);

      const result = await provider.generateEmbeddings(['text1', 'text2']);

      expect(mockCreate).toHaveBeenCalledWith({
        model: 'text-embedding-3-small',
        input: ['text1', 'text2']
      });
      expect(result).toEqual([
        [0.1, 0.2, 0.3],
        [0.4, 0.5, 0.6]
      ]);
    });

    it('should handle empty input array', async () => {
      const result = await provider.generateEmbeddings([]);
      expect(result).toEqual([]);
      expect(mockCreate).not.toHaveBeenCalled();
    });
  });

  describe('provider switching', () => {
    it('should use different models', async () => {
      const provider2 = new OpenAIEmbeddingProvider('test-api-key', 'text-embedding-3-large');
      const mockResponse = {
        data: [{ embedding: [0.1, 0.2, 0.3] }]
      };
      mockCreate.mockResolvedValue(mockResponse);

      await provider2.generateEmbedding('test text');

      expect(mockCreate).toHaveBeenCalledWith({
        model: 'text-embedding-3-large',
        input: 'test text'
      });
    });
  });
});
