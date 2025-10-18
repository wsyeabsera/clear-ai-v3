// Storage functions for plan requests

import mongoose from 'mongoose';
import { PlanRequestModel, PlanRequestDocument } from './models/PlanRequest';
import { Plan, PlanStatus } from './types';

export class PlanStorage {
  /**
   * Check if MongoDB is connected
   */
  private static isConnected(): boolean {
    return mongoose.connection.readyState === 1;
  }

  /**
   * Save a plan to MongoDB
   */
  static async savePlan(
    requestId: string,
    query: string,
    plan: Plan,
    llmProvider: string,
    validationErrors: string[] = []
  ): Promise<PlanRequestDocument> {
    if (!this.isConnected()) {
      throw new Error('MongoDB not connected');
    }
    
    const planRequest = new PlanRequestModel({
      requestId,
      query,
      plan,
      llmProvider,
      validationErrors,
      status: PlanStatus.PENDING
    });
    
    return await planRequest.save();
  }
  
  /**
   * Get a plan by request ID
   */
  static async getPlanByRequestId(requestId: string): Promise<PlanRequestDocument | null> {
    if (!this.isConnected()) {
      return null;
    }
    return await PlanRequestModel.findOne({ requestId });
  }
  
  /**
   * Update plan status
   */
  static async updatePlanStatus(
    requestId: string, 
    status: PlanStatus,
    executionTimeMs?: number
  ): Promise<PlanRequestDocument | null> {
    if (!this.isConnected()) {
      return null;
    }
    
    const updateData: any = { status };
    if (executionTimeMs !== undefined) {
      updateData.executionTimeMs = executionTimeMs;
    }
    
    return await PlanRequestModel.findOneAndUpdate(
      { requestId },
      updateData,
      { new: true }
    );
  }
  
  /**
   * Update plan with validation errors
   */
  static async updatePlanValidationErrors(
    requestId: string,
    validationErrors: string[]
  ): Promise<PlanRequestDocument | null> {
    if (!this.isConnected()) {
      return null;
    }
    
    return await PlanRequestModel.findOneAndUpdate(
      { requestId },
      { validationErrors },
      { new: true }
    );
  }
  
  /**
   * Get plans by status
   */
  static async getPlansByStatus(status: PlanStatus, limit: number = 100): Promise<PlanRequestDocument[]> {
    if (!this.isConnected()) {
      return [];
    }
    
    return await PlanRequestModel
      .find({ status })
      .sort({ createdAt: -1 })
      .limit(limit);
  }
  
  /**
   * Get plans by LLM provider
   */
  static async getPlansByProvider(provider: string, limit: number = 100): Promise<PlanRequestDocument[]> {
    if (!this.isConnected()) {
      return [];
    }
    
    return await PlanRequestModel
      .find({ llmProvider: provider })
      .sort({ createdAt: -1 })
      .limit(limit);
  }
  
  /**
   * Get recent plans
   */
  static async getRecentPlans(limit: number = 50): Promise<PlanRequestDocument[]> {
    if (!this.isConnected()) {
      return [];
    }
    
    return await PlanRequestModel
      .find()
      .sort({ createdAt: -1 })
      .limit(limit);
  }
  
  /**
   * Delete a plan by request ID
   */
  static async deletePlan(requestId: string): Promise<boolean> {
    if (!this.isConnected()) {
      return false;
    }
    
    const result = await PlanRequestModel.deleteOne({ requestId });
    return result.deletedCount > 0;
  }
  
  /**
   * Get plan statistics
   */
  static async getPlanStatistics(): Promise<{
    total: number;
    byStatus: Record<PlanStatus, number>;
    byProvider: Record<string, number>;
    averageExecutionTime: number;
  }> {
    if (!this.isConnected()) {
      // Return default values when not connected
      const byStatus = Object.values(PlanStatus).reduce((acc, status) => {
        acc[status] = 0;
        return acc;
      }, {} as Record<PlanStatus, number>);
      
      return {
        total: 0,
        byStatus,
        byProvider: {},
        averageExecutionTime: 0
      };
    }
    
    const total = await PlanRequestModel.countDocuments();
    
    const statusCounts = await PlanRequestModel.aggregate([
      { $group: { _id: '$status', count: { $sum: 1 } } }
    ]);
    
    const providerCounts = await PlanRequestModel.aggregate([
      { $group: { _id: '$llmProvider', count: { $sum: 1 } } }
    ]);
    
    const avgExecutionTime = await PlanRequestModel.aggregate([
      { $match: { executionTimeMs: { $exists: true } } },
      { $group: { _id: null, avgTime: { $avg: '$executionTimeMs' } } }
    ]);
    
    const byStatus = Object.values(PlanStatus).reduce((acc, status) => {
      acc[status] = 0;
      return acc;
    }, {} as Record<PlanStatus, number>);
    
    statusCounts.forEach(({ _id, count }) => {
      byStatus[_id as PlanStatus] = count;
    });
    
    const byProvider = providerCounts.reduce((acc, { _id, count }) => {
      acc[_id] = count;
      return acc;
    }, {} as Record<string, number>);
    
    return {
      total,
      byStatus,
      byProvider,
      averageExecutionTime: avgExecutionTime[0]?.avgTime || 0
    };
  }
}
