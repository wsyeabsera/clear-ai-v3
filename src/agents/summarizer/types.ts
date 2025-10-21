// TypeScript interfaces for the Summarizer Agent

import { ExecutionStatus, ExecutionStepResult } from '../executor/types';
import { Plan } from '../planner/types';
import { AnalysisResult } from '../analyzer/types';

export enum SummaryFormat {
  JSON = 'JSON',
  MARKDOWN = 'MARKDOWN',
  PLAIN_TEXT = 'PLAIN_TEXT',
  STRUCTURED = 'STRUCTURED',
  INTELLIGENT = 'INTELLIGENT'
}

export enum DetailLevel {
  CONCISE = 'CONCISE',
  MODERATE = 'MODERATE',
  DETAILED = 'DETAILED'
}

export interface SummaryResult {
  summary_id: string;
  execution_id: string;
  plan_request_id: string;
  format: SummaryFormat;
  content: string;
  structured_data?: StructuredSummary;
}

export interface StructuredSummary {
  user_query: string;
  answer: string;
  steps_executed: number;
  success: boolean;
  key_results: any[];
  errors?: string[];
  execution_time_ms: number;
  recommendations?: string[];
}

export interface SummaryContext {
  execution_id: string;
  plan_request_id: string;
  user_query: string;
  plan: Plan;
  execution_results: ExecutionStepResult[];
  execution_status: ExecutionStatus;
  execution_time_ms: number;
  analysis_result?: AnalysisResult;
  started_at?: Date;
  completed_at?: Date;
  detailLevel?: DetailLevel;
}

export interface SummaryRequest {
  execution_id: string;
  format?: SummaryFormat;
}

export interface SummaryStorage {
  summary_id: string;
  execution_id: string;
  plan_request_id: string;
  user_query: string;
  format: SummaryFormat;
  content: string;
  structured_data?: StructuredSummary;
  created_at: Date;
  updated_at: Date;
}
