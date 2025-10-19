// TypeScript interfaces for Vector Memory System

import { PlanStep } from '../planner/types';

export interface PlannerMemoryEntry {
  id: string;
  request_id: string;
  query: string;
  goal: string;
  plan_schema: { steps: PlanStep[] };
  execution_summary: string;
  embedding: number[];
  metadata: {
    success: boolean;
    execution_time_ms: number;
    total_steps: number;
    timestamp: Date;
  };
}

export interface AnalyzerMemoryEntry {
  id: string;
  execution_id: string;
  plan_request_id: string;
  feedback: string;
  evaluation_metrics: {
    success_rate: number;
    efficiency_score: number;
    error_patterns: string[];
  };
  improvement_notes: string;
  embedding: number[];
  metadata: {
    timestamp: Date;
    user_query: string;
  };
}

export interface EmbeddingProvider {
  generateEmbedding(text: string): Promise<number[]>;
  generateEmbeddings(texts: string[]): Promise<number[][]>;
}

export interface VectorStore {
  upsert(entries: VectorEntry[]): Promise<void>;
  query(vector: number[], topK: number, namespace?: string, filter?: Record<string, any>): Promise<VectorSearchResult[]>;
  delete(ids: string[], namespace?: string): Promise<void>;
  update(entries: VectorEntry[]): Promise<void>;
}

export interface VectorEntry {
  id: string;
  vector: number[];
  metadata: Record<string, any>;
  namespace?: string;
}

export interface VectorSearchResult {
  id: string;
  score: number;
  metadata: Record<string, any>;
}

export interface MemoryConfig {
  pinecone: {
    apiKey: string;
    environment: string;
    indexName: string;
  };
  embedding: {
    provider: 'openai' | 'cohere' | 'huggingface';
    model: string;
    dimension: number;
  };
  analyzer: {
    llmModel: string;
    temperature: number;
  };
  summarizer: {
    llmModel: string;
    temperature: number;
  };
}
