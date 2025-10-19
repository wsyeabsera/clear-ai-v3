// Storage functions for summary results

import mongoose from 'mongoose';
import { SummaryResult, SummaryStorage, SummaryFormat } from './types';
import { PlanStorage } from '../planner/storage';

const SummarySchema = new mongoose.Schema<SummaryStorage>({
  summary_id: {
    type: String,
    required: true,
    unique: true
  },
  execution_id: {
    type: String,
    required: true,
    index: true
  },
  plan_request_id: {
    type: String,
    required: true,
    index: true
  },
  user_query: {
    type: String,
    required: true
  },
  format: {
    type: String,
    enum: Object.values(SummaryFormat),
    required: true
  },
  content: {
    type: String,
    required: true
  },
  structured_data: {
    user_query: String,
    answer: String,
    steps_executed: Number,
    success: Boolean,
    key_results: [mongoose.Schema.Types.Mixed],
    errors: [String],
    execution_time_ms: Number,
    recommendations: [String]
  },
  created_at: {
    type: Date,
    default: Date.now,
    required: true
  },
  updated_at: {
    type: Date,
    default: Date.now,
    required: true
  }
}, {
  collection: 'summaries'
});

// Indexes for performance
SummarySchema.index({ execution_id: 1 });
SummarySchema.index({ plan_request_id: 1 });
SummarySchema.index({ created_at: -1 });
SummarySchema.index({ format: 1 });

const SummaryModel = mongoose.model<SummaryStorage>('Summary', SummarySchema);

export class SummarizerStorage {
  /**
   * Check if MongoDB is connected
   */
  private static isConnected(): boolean {
    return mongoose.connection.readyState === 1;
  }

  /**
   * Save summary result to MongoDB
   */
  static async saveSummary(summary: SummaryResult): Promise<SummaryStorage> {
    if (!this.isConnected()) {
      throw new Error('MongoDB not connected');
    }

    // Fetch the plan to get the user_query
    const plan = await PlanStorage.getPlanByRequestId(summary.plan_request_id);
    const user_query = plan?.query || 'Unknown query';

    const summaryDoc = new SummaryModel({
      summary_id: summary.summary_id,
      execution_id: summary.execution_id,
      plan_request_id: summary.plan_request_id,
      user_query: user_query,
      format: summary.format,
      content: summary.content,
      structured_data: summary.structured_data
    });

    return await summaryDoc.save();
  }

  /**
   * Get summary by summary ID
   */
  static async getSummaryById(summaryId: string): Promise<SummaryStorage | null> {
    if (!this.isConnected()) {
      return null;
    }
    return await SummaryModel.findOne({ summary_id: summaryId });
  }

  /**
   * Get summary by execution ID
   */
  static async getSummaryByExecutionId(executionId: string): Promise<SummaryStorage | null> {
    if (!this.isConnected()) {
      return null;
    }
    return await SummaryModel.findOne({ execution_id: executionId });
  }

  /**
   * Get summaries by plan request ID
   */
  static async getSummariesByPlanId(planRequestId: string): Promise<SummaryStorage[]> {
    if (!this.isConnected()) {
      return [];
    }
    return await SummaryModel
      .find({ plan_request_id: planRequestId })
      .sort({ created_at: -1 });
  }

  /**
   * Get recent summaries
   */
  static async getRecentSummaries(limit: number = 50): Promise<SummaryStorage[]> {
    if (!this.isConnected()) {
      return [];
    }
    return await SummaryModel
      .find()
      .sort({ created_at: -1 })
      .limit(limit);
  }

  /**
   * Get summaries by format
   */
  static async getSummariesByFormat(format: SummaryFormat): Promise<SummaryStorage[]> {
    if (!this.isConnected()) {
      return [];
    }
    return await SummaryModel
      .find({ format })
      .sort({ created_at: -1 });
  }

  /**
   * Delete summary by summary ID
   */
  static async deleteSummary(summaryId: string): Promise<boolean> {
    if (!this.isConnected()) {
      return false;
    }
    const result = await SummaryModel.deleteOne({ summary_id: summaryId });
    return result.deletedCount > 0;
  }

  /**
   * Get summary statistics
   */
  static async getSummaryStatistics(): Promise<{
    total: number;
    by_format: Record<SummaryFormat, number>;
    average_content_length: number;
    success_rate: number;
  }> {
    if (!this.isConnected()) {
      const byFormat = Object.values(SummaryFormat).reduce((acc, format) => {
        acc[format] = 0;
        return acc;
      }, {} as Record<SummaryFormat, number>);

      return {
        total: 0,
        by_format: byFormat,
        average_content_length: 0,
        success_rate: 0
      };
    }

    const total = await SummaryModel.countDocuments();

    if (total === 0) {
      const byFormat = Object.values(SummaryFormat).reduce((acc, format) => {
        acc[format] = 0;
        return acc;
      }, {} as Record<SummaryFormat, number>);

      return {
        total: 0,
        by_format: byFormat,
        average_content_length: 0,
        success_rate: 0
      };
    }

    const formatCounts = await SummaryModel.aggregate([
      { $group: { _id: '$format', count: { $sum: 1 } } }
    ]);

    const avgContentLength = await SummaryModel.aggregate([
      {
        $group: {
          _id: null,
          avgLength: { $avg: { $strLenCP: '$content' } }
        }
      }
    ]);

    const successCount = await SummaryModel.countDocuments({
      'structured_data.success': true
    });

    const byFormat = Object.values(SummaryFormat).reduce((acc, format) => {
      acc[format] = 0;
      return acc;
    }, {} as Record<SummaryFormat, number>);

    formatCounts.forEach(({ _id, count }) => {
      byFormat[_id as SummaryFormat] = count;
    });

    return {
      total,
      by_format: byFormat,
      average_content_length: avgContentLength[0]?.avgLength || 0,
      success_rate: total > 0 ? (successCount / total) : 0
    };
  }
}
