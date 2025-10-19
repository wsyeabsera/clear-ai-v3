// Tests for Analyzer Agent GraphQL requests

// Mock all dependencies
jest.mock('../../../src/agents/analyzer/AnalyzerAgent', () => ({
  AnalyzerAgent: jest.fn().mockImplementation(() => ({
    analyze: jest.fn(),
    getHistoricalContext: jest.fn()
  }))
}));

jest.mock('../../../src/agents/analyzer/storage', () => ({
  AnalyzerStorage: {
    getAnalysisById: jest.fn(),
    getAnalysisByExecutionId: jest.fn(),
    getAnalysisStatistics: jest.fn()
  }
}));

import { analyzerResolvers } from '../../../src/agents/analyzer/graphql/resolvers';

describe('Analyzer GraphQL Resolvers', () => {
  let mockAnalyzerAgent: any;
  let mockAnalyzerStorage: any;

  beforeEach(() => {
    const { AnalyzerAgent } = require('../../../src/agents/analyzer/AnalyzerAgent');
    const { AnalyzerStorage } = require('../../../src/agents/analyzer/storage');
    
    mockAnalyzerAgent = {
      analyze: jest.fn(),
      getHistoricalContext: jest.fn()
    };
    
    mockAnalyzerStorage = {
      getAnalysisById: jest.fn(),
      getAnalysisByExecutionId: jest.fn(),
      getAnalysisStatistics: jest.fn()
    };

    // Mock the singleton instances
    AnalyzerAgent.mockImplementation(() => mockAnalyzerAgent);
    AnalyzerStorage.getAnalysisById = mockAnalyzerStorage.getAnalysisById;
    AnalyzerStorage.getAnalysisByExecutionId = mockAnalyzerStorage.getAnalysisByExecutionId;
    AnalyzerStorage.getAnalysisStatistics = mockAnalyzerStorage.getAnalysisStatistics;
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('Mutation: analyzeExecution', () => {
    it('should analyze execution successfully', async () => {
      const mockAnalysis = {
        analysis_id: 'analysis-123',
        execution_id: 'exec-123',
        plan_request_id: 'req-123',
        feedback: 'Execution completed successfully',
        evaluation_metrics: {
          success_rate: 1.0,
          efficiency_score: 0.9,
          step_success_rates: { 0: 1, 1: 1 },
          error_patterns: [],
          retry_frequency: 0,
          average_step_time_ms: 1000
        },
        improvement_notes: 'Good performance',
        success_indicators: ['All steps completed'],
        failure_patterns: [],
        recommendations: ['Consider parallel execution']
      };

      mockAnalyzerAgent.analyze.mockResolvedValue(mockAnalysis);

      const result = await analyzerResolvers.Mutation.analyzeExecution(null, { executionId: 'exec-123' });

      expect(result).toEqual(mockAnalysis);
      expect(mockAnalyzerAgent.analyze).toHaveBeenCalledWith('exec-123');
    });

    it('should handle analysis errors', async () => {
      mockAnalyzerAgent.analyze.mockRejectedValue(new Error('Analysis failed'));

      await expect(
        analyzerResolvers.Mutation.analyzeExecution(null, { executionId: 'exec-123' })
      ).rejects.toThrow('Failed to analyze execution: Analysis failed');
    });
  });

  describe('Query: getAnalysis', () => {
    it('should get analysis by ID', async () => {
      const mockAnalysis = {
        analysis_id: 'analysis-123',
        execution_id: 'exec-123',
        feedback: 'Test analysis'
      };

      mockAnalyzerStorage.getAnalysisById.mockResolvedValue(mockAnalysis);

      const result = await analyzerResolvers.Query.getAnalysis(null, { analysisId: 'analysis-123' });

      expect(result).toEqual(mockAnalysis);
      expect(mockAnalyzerStorage.getAnalysisById).toHaveBeenCalledWith('analysis-123');
    });

    it('should handle get analysis errors', async () => {
      mockAnalyzerStorage.getAnalysisById.mockRejectedValue(new Error('Storage error'));

      await expect(
        analyzerResolvers.Query.getAnalysis(null, { analysisId: 'analysis-123' })
      ).rejects.toThrow('Failed to get analysis: Storage error');
    });
  });

  describe('Query: getAnalysisByExecutionId', () => {
    it('should get analysis by execution ID', async () => {
      const mockAnalysis = {
        analysis_id: 'analysis-123',
        execution_id: 'exec-123',
        feedback: 'Test analysis'
      };

      mockAnalyzerStorage.getAnalysisByExecutionId.mockResolvedValue(mockAnalysis);

      const result = await analyzerResolvers.Query.getAnalysisByExecutionId(null, { executionId: 'exec-123' });

      expect(result).toEqual(mockAnalysis);
      expect(mockAnalyzerStorage.getAnalysisByExecutionId).toHaveBeenCalledWith('exec-123');
    });
  });

  describe('Query: getAnalysisStatistics', () => {
    it('should get analysis statistics', async () => {
      const mockStats = {
        total: 10,
        average_success_rate: 0.85,
        average_efficiency_score: 0.78,
        common_error_patterns: [
          { pattern: 'timeout', count: 3 },
          { pattern: 'validation', count: 2 }
        ],
        average_execution_time: 2500
      };

      mockAnalyzerStorage.getAnalysisStatistics.mockResolvedValue(mockStats);

      const result = await analyzerResolvers.Query.getAnalysisStatistics();

      expect(result).toEqual(mockStats);
      expect(mockAnalyzerStorage.getAnalysisStatistics).toHaveBeenCalled();
    });
  });

  describe('Query: getHistoricalContext', () => {
    it('should get historical context', async () => {
      const mockContext = [
        {
          id: 'memory-1',
          execution_id: 'exec-1',
          feedback: 'Previous analysis',
          evaluation_metrics: { success_rate: 0.9 },
          improvement_notes: 'Good performance'
        }
      ];

      mockAnalyzerAgent.getHistoricalContext.mockResolvedValue(mockContext);

      const result = await analyzerResolvers.Query.getHistoricalContext(null, { query: 'test query', limit: 5 });

      expect(result).toEqual(mockContext);
      expect(mockAnalyzerAgent.getHistoricalContext).toHaveBeenCalledWith('test query');
    });

    it('should use default limit when not provided', async () => {
      const mockContext: any[] = [];
      mockAnalyzerAgent.getHistoricalContext.mockResolvedValue(mockContext);

      await analyzerResolvers.Query.getHistoricalContext(null, { query: 'test query' });

      expect(mockAnalyzerAgent.getHistoricalContext).toHaveBeenCalledWith('test query');
    });
  });
});
