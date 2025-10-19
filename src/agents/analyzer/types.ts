// TypeScript interfaces for the Analyzer Agent

import { ExecutionStatus, ExecutionStepResult } from '../executor/types';
import { Plan } from '../planner/types';

export interface AnalysisResult {
  analysis_id: string;
  execution_id: string;
  plan_request_id: string;
  feedback: string;
  evaluation_metrics: EvaluationMetrics;
  improvement_notes: string;
  success_indicators: string[];
  failure_patterns: string[];
  recommendations: string[];
}

export interface EvaluationMetrics {
  success_rate: number;
  efficiency_score: number;
  step_success_rates: Record<number, number>;
  error_patterns: string[];
  retry_frequency: number;
  average_step_time_ms: number;
}

export interface AnalysisContext {
  execution_id: string;
  plan_request_id: string;
  user_query: string;
  plan: Plan;
  execution_results: ExecutionStepResult[];
  execution_status: ExecutionStatus;
  execution_time_ms: number;
  started_at?: Date;
  completed_at?: Date;
}

export interface AnalysisRequest {
  execution_id: string;
}

export interface AnalysisStorage {
  analysis_id: string;
  execution_id: string;
  plan_request_id: string;
  user_query: string;
  feedback: string;
  evaluation_metrics: EvaluationMetrics;
  improvement_notes: string;
  success_indicators: string[];
  failure_patterns: string[];
  recommendations: string[];
  created_at: Date;
  updated_at: Date;
}
