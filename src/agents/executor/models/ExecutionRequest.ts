// Mongoose schema for storing execution requests

import mongoose, { Schema, Document } from 'mongoose';
import { ExecutionStatus, StepStatus } from '../types';

export interface ExecutionRequestDocument extends Document {
  executionId: string;
  planRequestId: string;
  status: ExecutionStatus;
  startedAt?: Date;
  completedAt?: Date;
  totalSteps: number;
  completedSteps: number;
  failedSteps: number;
  results: ExecutionStepResultDocument[];
  error?: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface ExecutionStepResultDocument {
  stepIndex: number;
  tool: string;
  params: any;
  status: StepStatus;
  result?: any;
  error?: string;
  startedAt?: Date;
  completedAt?: Date;
  retryCount: number;
  dependencies: number[];
}

const ExecutionStepResultSchema = new Schema({
  stepIndex: { type: Number, required: true },
  tool: { type: String, required: true },
  params: { type: Schema.Types.Mixed, required: true },
  status: { 
    type: String, 
    enum: Object.values(StepStatus), 
    required: true,
    default: StepStatus.PENDING
  },
  result: { type: Schema.Types.Mixed },
  error: { type: String },
  startedAt: { type: Date },
  completedAt: { type: Date },
  retryCount: { type: Number, default: 0 },
  dependencies: { type: [Number], default: [] }
}, { _id: false });

const ExecutionRequestSchema = new Schema({
  executionId: { 
    type: String, 
    required: true, 
    unique: true,
    index: true
  },
  planRequestId: { 
    type: String, 
    required: true, 
    index: true
  },
  status: { 
    type: String, 
    enum: Object.values(ExecutionStatus), 
    required: true,
    default: ExecutionStatus.PENDING,
    index: true
  },
  startedAt: { type: Date },
  completedAt: { type: Date },
  totalSteps: { type: Number, required: true },
  completedSteps: { type: Number, default: 0 },
  failedSteps: { type: Number, default: 0 },
  results: { 
    type: [ExecutionStepResultSchema], 
    required: true,
    default: []
  },
  error: { type: String }
}, {
  timestamps: true,
  collection: 'execution_requests'
});

// Indexes for better query performance
ExecutionRequestSchema.index({ status: 1, createdAt: -1 });
ExecutionRequestSchema.index({ planRequestId: 1, createdAt: -1 });
ExecutionRequestSchema.index({ executionId: 1 });

export const ExecutionRequestModel = mongoose.model<ExecutionRequestDocument>('ExecutionRequest', ExecutionRequestSchema);
