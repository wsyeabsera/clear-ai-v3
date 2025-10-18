// Mongoose schema for storing plan requests

import mongoose, { Schema, Document } from 'mongoose';
import { Plan, PlanStatus } from '../types';

export interface PlanRequestDocument extends Document {
  requestId: string;
  query: string;
  plan: Plan;
  status: PlanStatus;
  llmProvider: string;
  createdAt: Date;
  updatedAt: Date;
  executionTimeMs?: number;
  validationErrors: string[];
}

const PlanStepSchema = new Schema({
  tool: { type: String, required: true },
  params: { type: Schema.Types.Mixed, required: true },
  dependsOn: { type: [Number], default: [] },
  parallel: { type: Boolean, default: false },
  description: { type: String }
}, { _id: false });

const PlanMetadataSchema = new Schema({
  query: { type: String, required: true },
  requestId: { type: String, required: true },
  estimatedDurationMs: { type: Number },
  totalSteps: { type: Number, required: true },
  parallelSteps: { type: Number, default: 0 }
}, { _id: false });

const PlanSchema = new Schema({
  steps: { type: [PlanStepSchema], required: true },
  metadata: { type: PlanMetadataSchema, required: true }
}, { _id: false });

const PlanRequestSchema = new Schema({
  requestId: { 
    type: String, 
    required: true, 
    unique: true
  },
  query: { 
    type: String, 
    required: true 
  },
  plan: { 
    type: PlanSchema, 
    required: true 
  },
  status: { 
    type: String, 
    enum: Object.values(PlanStatus), 
    default: PlanStatus.PENDING 
  },
  llmProvider: { 
    type: String, 
    required: true 
  },
  executionTimeMs: { 
    type: Number 
  },
  validationErrors: { 
    type: [String], 
    default: [] 
  }
}, {
  timestamps: true,
  collection: 'plan_requests'
});

// Indexes for better query performance
PlanRequestSchema.index({ status: 1 });
PlanRequestSchema.index({ createdAt: -1 });
PlanRequestSchema.index({ llmProvider: 1 });

export const PlanRequestModel = mongoose.model<PlanRequestDocument>('PlanRequest', PlanRequestSchema);
