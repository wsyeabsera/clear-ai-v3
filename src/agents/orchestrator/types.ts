// TypeScript interfaces for the Agent Orchestrator

import { PlanResponse } from '../planner/types';
import { ExecutionResponse } from '../executor/types';
import { AnalysisResult } from '../analyzer/types';
import { SummaryResult } from '../summarizer/types';

export interface FullCycleResult {
  request_id: string;
  execution_id: string;
  analysis_id: string;
  summary_id: string;
  query: string;
  plan: PlanResponse;
  execution: ExecutionResponse;
  analysis: AnalysisResult;
  summary: SummaryResult;
  success: boolean;
  total_time_ms: number;
  created_at: Date;
}

export interface FullCycleRequest {
  query: string;
  llm_provider?: string;
  execution_config?: {
    maxRetries?: number;
    retryDelayMs?: number;
    enableRollback?: boolean;
    continueOnError?: boolean;
    parallelExecutionLimit?: number;
  };
  summary_format?: 'JSON' | 'MARKDOWN' | 'PLAIN_TEXT' | 'STRUCTURED';
}

export interface FeedbackRequest {
  execution_id: string;
  user_feedback: string;
  rating?: number; // 1-5 scale
  categories?: string[]; // e.g., ['accuracy', 'speed', 'usefulness']
}

export interface FeedbackResult {
  feedback_id: string;
  execution_id: string;
  user_feedback: string;
  rating?: number;
  categories?: string[];
  processed: boolean;
  created_at: Date;
}

export interface OrchestratorStats {
  total_cycles: number;
  successful_cycles: number;
  failed_cycles: number;
  average_cycle_time_ms: number;
  success_rate: number;
  average_plan_steps: number;
  average_execution_time_ms: number;
  common_failure_patterns: Array<{ pattern: string; count: number }>;
  top_queries: Array<{ query: string; count: number }>;
}
