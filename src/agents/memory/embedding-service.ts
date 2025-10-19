// Embedding Service for generating vector embeddings

import OpenAI from 'openai';
import { EmbeddingProvider } from './types';

export class OpenAIEmbeddingProvider implements EmbeddingProvider {
  private client: OpenAI;
  private model: string;

  constructor(apiKey: string, model: string = 'text-embedding-3-small') {
    this.client = new OpenAI({ apiKey });
    this.model = model;
  }

  async generateEmbedding(text: string): Promise<number[]> {
    try {
      const response = await this.client.embeddings.create({
        model: this.model,
        input: text
      });

      return response.data[0].embedding;
    } catch (error) {
      if (error instanceof Error) {
        throw new Error(`Failed to generate embedding: ${error.message}`);
      }
      throw new Error('Failed to generate embedding: Unknown error');
    }
  }

  async generateEmbeddings(texts: string[]): Promise<number[][]> {
    if (texts.length === 0) {
      return [];
    }

    try {
      const response = await this.client.embeddings.create({
        model: this.model,
        input: texts
      });

      return response.data.map(item => item.embedding);
    } catch (error) {
      if (error instanceof Error) {
        throw new Error(`Failed to generate embeddings: ${error.message}`);
      }
      throw new Error('Failed to generate embeddings: Unknown error');
    }
  }
}

export class EmbeddingService {
  private provider: EmbeddingProvider;

  constructor(provider: EmbeddingProvider) {
    this.provider = provider;
  }

  async generateEmbedding(text: string): Promise<number[]> {
    return this.provider.generateEmbedding(text);
  }

  async generateEmbeddings(texts: string[]): Promise<number[][]> {
    return this.provider.generateEmbeddings(texts);
  }

  setProvider(provider: EmbeddingProvider): void {
    this.provider = provider;
  }
}

// Factory function for creating embedding providers
export function createEmbeddingProvider(
  provider: 'openai' | 'cohere' | 'huggingface',
  config: { apiKey: string; model?: string }
): EmbeddingProvider {
  switch (provider) {
    case 'openai':
      return new OpenAIEmbeddingProvider(config.apiKey, config.model);
    case 'cohere':
      // TODO: Implement Cohere provider
      throw new Error('Cohere provider not implemented yet');
    case 'huggingface':
      // TODO: Implement HuggingFace provider
      throw new Error('HuggingFace provider not implemented yet');
    default:
      throw new Error(`Unknown embedding provider: ${provider}`);
  }
}
