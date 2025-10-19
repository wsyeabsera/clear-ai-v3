// Storage functions for analysis results

import mongoose from 'mongoose';
import { AnalysisResult, AnalysisStorage } from './types';

const AnalysisSchema = new mongoose.Schema<AnalysisStorage>({
  analysis_id: {
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
  feedback: {
    type: String,
    required: true
  },
  evaluation_metrics: {
    success_rate: { type: Number, required: true },
    efficiency_score: { type: Number, required: true },
    step_success_rates: { type: Map, of: Number, required: true },
    error_patterns: [String],
    retry_frequency: { type: Number, required: true },
    average_step_time_ms: { type: Number, required: true }
  },
  improvement_notes: {
    type: String,
    required: true
  },
  success_indicators: [String],
  failure_patterns: [String],
  recommendations: [String],
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
  collection: 'analyses'
});

// Indexes for performance
AnalysisSchema.index({ execution_id: 1 });
AnalysisSchema.index({ plan_request_id: 1 });
AnalysisSchema.index({ created_at: -1 });
AnalysisSchema.index({ 'evaluation_metrics.success_rate': 1 });

const AnalysisModel = mongoose.model<AnalysisStorage>('Analysis', AnalysisSchema);

export class AnalyzerStorage {
  /**
   * Check if MongoDB is connected
   */
  private static isConnected(): boolean {
    return mongoose.connection.readyState === 1;
  }

  /**
   * Save analysis result to MongoDB
   */
  static async saveAnalysis(analysis: AnalysisResult): Promise<AnalysisStorage> {
    if (!this.isConnected()) {
      throw new Error('MongoDB not connected');
    }

    const analysisDoc = new AnalysisModel({
      analysis_id: analysis.analysis_id,
      execution_id: analysis.execution_id,
      plan_request_id: analysis.plan_request_id,
      user_query: '', // Will be filled from context
      feedback: analysis.feedback,
      evaluation_metrics: analysis.evaluation_metrics,
      improvement_notes: analysis.improvement_notes,
      success_indicators: analysis.success_indicators,
      failure_patterns: analysis.failure_patterns,
      recommendations: analysis.recommendations
    });

    return await analysisDoc.save();
  }

  /**
   * Get analysis by analysis ID
   */
  static async getAnalysisById(analysisId: string): Promise<AnalysisStorage | null> {
    if (!this.isConnected()) {
      return null;
    }
    return await AnalysisModel.findOne({ analysis_id: analysisId });
  }

  /**
   * Get analysis by execution ID
   */
  static async getAnalysisByExecutionId(executionId: string): Promise<AnalysisStorage | null> {
    if (!this.isConnected()) {
      return null;
    }
    return await AnalysisModel.findOne({ execution_id: executionId });
  }

  /**
   * Get analyses by plan request ID
   */
  static async getAnalysesByPlanId(planRequestId: string): Promise<AnalysisStorage[]> {
    if (!this.isConnected()) {
      return [];
    }
    return await AnalysisModel
      .find({ plan_request_id: planRequestId })
      .sort({ created_at: -1 });
  }

  /**
   * Get recent analyses
   */
  static async getRecentAnalyses(limit: number = 50): Promise<AnalysisStorage[]> {
    if (!this.isConnected()) {
      return [];
    }
    return await AnalysisModel
      .find()
      .sort({ created_at: -1 })
      .limit(limit);
  }

  /**
   * Get analyses by success rate range
   */
  static async getAnalysesBySuccessRate(
    minSuccessRate: number, 
    maxSuccessRate: number = 1.0
  ): Promise<AnalysisStorage[]> {
    if (!this.isConnected()) {
      return [];
    }
    return await AnalysisModel
      .find({
        'evaluation_metrics.success_rate': {
          $gte: minSuccessRate,
          $lte: maxSuccessRate
        }
      })
      .sort({ created_at: -1 });
  }

  /**
   * Delete analysis by analysis ID
   */
  static async deleteAnalysis(analysisId: string): Promise<boolean> {
    if (!this.isConnected()) {
      return false;
    }
    const result = await AnalysisModel.deleteOne({ analysis_id: analysisId });
    return result.deletedCount > 0;
  }

  /**
   * Get analysis statistics
   */
  static async getAnalysisStatistics(): Promise<{
    total: number;
    average_success_rate: number;
    average_efficiency_score: number;
    common_error_patterns: Array<{ pattern: string; count: number }>;
    average_execution_time: number;
  }> {
    if (!this.isConnected()) {
      return {
        total: 0,
        average_success_rate: 0,
        average_efficiency_score: 0,
        common_error_patterns: [],
        average_execution_time: 0
      };
    }

    const total = await AnalysisModel.countDocuments();

    if (total === 0) {
      return {
        total: 0,
        average_success_rate: 0,
        average_efficiency_score: 0,
        common_error_patterns: [],
        average_execution_time: 0
      };
    }

    const avgMetrics = await AnalysisModel.aggregate([
      {
        $group: {
          _id: null,
          avgSuccessRate: { $avg: '$evaluation_metrics.success_rate' },
          avgEfficiencyScore: { $avg: '$evaluation_metrics.efficiency_score' },
          avgExecutionTime: { $avg: '$evaluation_metrics.average_step_time_ms' }
        }
      }
    ]);

    const errorPatterns = await AnalysisModel.aggregate([
      { $unwind: '$evaluation_metrics.error_patterns' },
      {
        $group: {
          _id: '$evaluation_metrics.error_patterns',
          count: { $sum: 1 }
        }
      },
      { $sort: { count: -1 } },
      { $limit: 10 }
    ]);

    return {
      total,
      average_success_rate: avgMetrics[0]?.avgSuccessRate || 0,
      average_efficiency_score: avgMetrics[0]?.avgEfficiencyScore || 0,
      common_error_patterns: errorPatterns.map(ep => ({
        pattern: ep._id,
        count: ep.count
      })),
      average_execution_time: avgMetrics[0]?.avgExecutionTime || 0
    };
  }
}
