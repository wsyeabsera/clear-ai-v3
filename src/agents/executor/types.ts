// TypeScript interfaces for the Execution Agent

import { PlanStep } from '../planner/types';

export interface ExecutionRequest {
  executionId: string;           // Unique execution ID
  planRequestId: string;         // Reference to plan
  status: ExecutionStatus;       // PENDING, RUNNING, COMPLETED, FAILED, ROLLED_BACK
  startedAt?: Date;
  completedAt?: Date;
  totalSteps: number;
  completedSteps: number;
  failedSteps: number;
  results: ExecutionStepResult[];
  error?: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface ExecutionStepResult {
  stepIndex: number;
  tool: string;
  params: any;
  status: StepStatus;            // PENDING, RUNNING, COMPLETED, FAILED, SKIPPED
  result?: any;
  error?: string;
  startedAt?: Date;
  completedAt?: Date;
  retryCount: number;
  dependencies: number[];
}

export enum ExecutionStatus {
  PENDING = 'PENDING',
  RUNNING = 'RUNNING',
  COMPLETED = 'COMPLETED',
  FAILED = 'FAILED',
  ROLLED_BACK = 'ROLLED_BACK'
}

export enum StepStatus {
  PENDING = 'PENDING',
  RUNNING = 'RUNNING',
  COMPLETED = 'COMPLETED',
  FAILED = 'FAILED',
  SKIPPED = 'SKIPPED'
}

export interface ExecutionConfig {
  maxRetries: number;            // Default: 3
  retryDelayMs: number;          // Default: 1000
  enableRollback: boolean;       // Default: true
  continueOnError: boolean;      // Default: false
  parallelExecutionLimit: number; // Default: 5
  executionTimeout?: number;     // Default: 5 minutes
}

export interface ExecutionResponse {
  executionId: string;
  planRequestId: string;
  status: ExecutionStatus;
  startedAt?: string;
  completedAt?: string;
  totalSteps: number;
  completedSteps: number;
  failedSteps: number;
  results: ExecutionStepResult[];
  error?: string;
}

export interface ExecutionSummary {
  executionId: string;
  planRequestId: string;
  status: ExecutionStatus;
  startedAt?: string;
  completedAt?: string;
  totalSteps: number;
  completedSteps: number;
  failedSteps: number;
  error?: string;
}

export interface ExecutionConfigInput {
  maxRetries?: number;
  retryDelayMs?: number;
  enableRollback?: boolean;
  continueOnError?: boolean;
  parallelExecutionLimit?: number;
  executionTimeout?: number;
}

export interface RetryableError extends Error {
  isRetryable: boolean;
  retryAfter?: number; // milliseconds
}

export interface RollbackPlan {
  steps: PlanStep[];
  reason: string;
  createdAt: Date;
}

export interface ExecutionStatistics {
  total: number;
  byStatus: Record<ExecutionStatus, number>;
  averageExecutionTime: number;
  successRate: number;
  averageStepsPerExecution: number;
}

export interface DependencyGraph {
  [stepIndex: number]: number[]; // step index -> array of dependency indices
}

export interface ExecutionContext {
  executionId: string;
  planRequestId: string;
  config: ExecutionConfig;
  dependencyGraph: DependencyGraph;
  completedSteps: Set<number>;
  failedSteps: Set<number>;
  runningSteps: Set<number>;
}
