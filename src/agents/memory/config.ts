// Configuration module for memory components

import { MemoryConfig } from './types';

export function loadMemoryConfig(): MemoryConfig {
  const config: MemoryConfig = {
    pinecone: {
      apiKey: process.env.PINECONE_API_KEY || '',
      environment: process.env.PINECONE_ENVIRONMENT || '',
      indexName: process.env.PINECONE_INDEX_NAME || 'clear-ai-memory'
    },
    embedding: {
      provider: (process.env.EMBEDDING_PROVIDER as 'openai' | 'cohere' | 'huggingface') || 'openai',
      model: process.env.OPENAI_EMBEDDING_MODEL || 'text-embedding-3-small',
      dimension: parseInt(process.env.EMBEDDING_DIMENSION || '1536')
    },
    analyzer: {
      llmModel: process.env.ANALYZER_LLM_MODEL || 'gpt-4o-mini',
      temperature: parseFloat(process.env.ANALYZER_TEMPERATURE || '0.3')
    },
    summarizer: {
      llmModel: process.env.SUMMARIZER_LLM_MODEL || 'gpt-4o-mini',
      temperature: parseFloat(process.env.SUMMARIZER_TEMPERATURE || '0.7')
    }
  };

  // Validate required configuration
  if (!config.pinecone.apiKey) {
    throw new Error('PINECONE_API_KEY environment variable is required');
  }
  if (!config.pinecone.environment) {
    throw new Error('PINECONE_ENVIRONMENT environment variable is required');
  }

  return config;
}

export const memoryConfig = loadMemoryConfig();
