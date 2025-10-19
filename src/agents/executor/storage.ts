// Storage functions for execution requests

import mongoose from 'mongoose';
import { ExecutionRequestModel, ExecutionRequestDocument } from './models/ExecutionRequest';
import { ExecutionStatus, StepStatus, ExecutionStatistics } from './types';

export class ExecutionStorage {
  /**
   * Check if MongoDB is connected
   */
  private static isConnected(): boolean {
    return mongoose.connection.readyState === 1;
  }

  /**
   * Save an execution request to MongoDB
   */
  static async saveExecution(
    executionId: string,
    planRequestId: string,
    totalSteps: number,
    results: any[] = []
  ): Promise<ExecutionRequestDocument> {
    if (!this.isConnected()) {
      throw new Error('MongoDB not connected');
    }
    
    const executionRequest = new ExecutionRequestModel({
      executionId,
      planRequestId,
      totalSteps,
      results,
      status: ExecutionStatus.PENDING
    });
    
    return await executionRequest.save();
  }
  
  /**
   * Get an execution by execution ID
   */
  static async getExecutionById(executionId: string): Promise<ExecutionRequestDocument | null> {
    if (!this.isConnected()) {
      return null;
    }
    return await ExecutionRequestModel.findOne({ executionId });
  }
  
  /**
   * Get executions by plan request ID
   */
  static async getExecutionsByPlanId(planRequestId: string): Promise<ExecutionRequestDocument[]> {
    if (!this.isConnected()) {
      return [];
    }
    return await ExecutionRequestModel
      .find({ planRequestId })
      .sort({ createdAt: -1 });
  }
  
  /**
   * Update execution status
   */
  static async updateExecutionStatus(
    executionId: string, 
    status: ExecutionStatus,
    error?: string
  ): Promise<ExecutionRequestDocument | null> {
    if (!this.isConnected()) {
      return null;
    }
    
    const updateData: any = { status };
    if (error) {
      updateData.error = error;
    }
    
    if (status === ExecutionStatus.RUNNING) {
      updateData.startedAt = new Date();
    } else if (status === ExecutionStatus.COMPLETED || status === ExecutionStatus.FAILED || status === ExecutionStatus.ROLLED_BACK) {
      updateData.completedAt = new Date();
    }
    
    return await ExecutionRequestModel.findOneAndUpdate(
      { executionId },
      updateData,
      { new: true }
    );
  }
  
  /**
   * Update execution progress
   */
  static async updateExecutionProgress(
    executionId: string,
    completedSteps: number,
    failedSteps: number
  ): Promise<ExecutionRequestDocument | null> {
    if (!this.isConnected()) {
      return null;
    }
    
    return await ExecutionRequestModel.findOneAndUpdate(
      { executionId },
      { 
        completedSteps,
        failedSteps
      },
      { new: true }
    );
  }
  
  /**
   * Update step result
   */
  static async updateStepResult(
    executionId: string,
    stepIndex: number,
    stepResult: any
  ): Promise<ExecutionRequestDocument | null> {
    if (!this.isConnected()) {
      return null;
    }
    
    return await ExecutionRequestModel.findOneAndUpdate(
      { executionId, 'results.stepIndex': stepIndex },
      { 
        $set: {
          'results.$.status': stepResult.status,
          'results.$.result': stepResult.result,
          'results.$.error': stepResult.error,
          'results.$.startedAt': stepResult.startedAt,
          'results.$.completedAt': stepResult.completedAt,
          'results.$.retryCount': stepResult.retryCount
        }
      },
      { new: true }
    );
  }
  
  /**
   * Get executions by status
   */
  static async getExecutionsByStatus(status: ExecutionStatus, limit: number = 100): Promise<ExecutionRequestDocument[]> {
    if (!this.isConnected()) {
      return [];
    }
    
    return await ExecutionRequestModel
      .find({ status })
      .sort({ createdAt: -1 })
      .limit(limit);
  }
  
  /**
   * Get recent executions
   */
  static async getRecentExecutions(limit: number = 50): Promise<ExecutionRequestDocument[]> {
    if (!this.isConnected()) {
      return [];
    }
    
    return await ExecutionRequestModel
      .find()
      .sort({ createdAt: -1 })
      .limit(limit);
  }
  
  /**
   * Delete an execution by execution ID
   */
  static async deleteExecution(executionId: string): Promise<boolean> {
    if (!this.isConnected()) {
      return false;
    }
    
    const result = await ExecutionRequestModel.deleteOne({ executionId });
    return result.deletedCount > 0;
  }
  
  /**
   * Get execution statistics
   */
  static async getExecutionStatistics(): Promise<ExecutionStatistics> {
    if (!this.isConnected()) {
      // Return default values when not connected
      const byStatus = Object.values(ExecutionStatus).reduce((acc, status) => {
        acc[status] = 0;
        return acc;
      }, {} as Record<ExecutionStatus, number>);
      
      return {
        total: 0,
        byStatus,
        averageExecutionTime: 0,
        successRate: 0,
        averageStepsPerExecution: 0
      };
    }
    
    const total = await ExecutionRequestModel.countDocuments();
    
    const statusCounts = await ExecutionRequestModel.aggregate([
      { $group: { _id: '$status', count: { $sum: 1 } } }
    ]);
    
    const avgExecutionTime = await ExecutionRequestModel.aggregate([
      { 
        $match: { 
          startedAt: { $exists: true },
          completedAt: { $exists: true }
        } 
      },
      { 
        $project: {
          executionTime: {
            $subtract: ['$completedAt', '$startedAt']
          }
        }
      },
      { $group: { _id: null, avgTime: { $avg: '$executionTime' } } }
    ]);
    
    const avgSteps = await ExecutionRequestModel.aggregate([
      { $group: { _id: null, avgSteps: { $avg: '$totalSteps' } } }
    ]);
    
    const successCount = await ExecutionRequestModel.countDocuments({ 
      status: ExecutionStatus.COMPLETED 
    });
    
    const byStatus = Object.values(ExecutionStatus).reduce((acc, status) => {
      acc[status] = 0;
      return acc;
    }, {} as Record<ExecutionStatus, number>);
    
    statusCounts.forEach(({ _id, count }) => {
      byStatus[_id as ExecutionStatus] = count;
    });
    
    return {
      total,
      byStatus,
      averageExecutionTime: avgExecutionTime[0]?.avgTime || 0,
      successRate: total > 0 ? (successCount / total) * 100 : 0,
      averageStepsPerExecution: avgSteps[0]?.avgSteps || 0
    };
  }
  
  /**
   * Get running executions (for monitoring)
   */
  static async getRunningExecutions(): Promise<ExecutionRequestDocument[]> {
    if (!this.isConnected()) {
      return [];
    }
    
    return await ExecutionRequestModel
      .find({ status: ExecutionStatus.RUNNING })
      .sort({ startedAt: 1 });
  }
  
  /**
   * Clean up old executions (for maintenance)
   */
  static async cleanupOldExecutions(olderThanDays: number = 30): Promise<number> {
    if (!this.isConnected()) {
      return 0;
    }
    
    const cutoffDate = new Date();
    cutoffDate.setDate(cutoffDate.getDate() - olderThanDays);
    
    const result = await ExecutionRequestModel.deleteMany({
      status: { $in: [ExecutionStatus.COMPLETED, ExecutionStatus.FAILED, ExecutionStatus.ROLLED_BACK] },
      completedAt: { $lt: cutoffDate }
    });
    
    return result.deletedCount;
  }
}
