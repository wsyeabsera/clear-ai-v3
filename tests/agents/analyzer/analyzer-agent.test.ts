// Tests for Analyzer Agent

import { AnalyzerAgent } from '../../../src/agents/analyzer/AnalyzerAgent';
import { AnalysisResult, EvaluationMetrics } from '../../../src/agents/analyzer/types';

// Mock dependencies
jest.mock('../../../src/agents/executor/storage', () => ({
  ExecutionStorage: {
    getExecutionById: jest.fn()
  }
}));

jest.mock('../../../src/agents/planner/storage', () => ({
  PlanStorage: {
    getPlanByRequestId: jest.fn()
  }
}));

jest.mock('../../../src/agents/analyzer/storage', () => ({
  AnalyzerStorage: {
    saveAnalysis: jest.fn(),
    getAnalysisByExecutionId: jest.fn()
  }
}));

jest.mock('../../../src/agents/memory/analyzer-memory', () => ({
  AnalyzerMemoryRepository: jest.fn().mockImplementation(() => ({
    store: jest.fn(),
    search: jest.fn(),
    getByExecutionId: jest.fn()
  }))
}));

jest.mock('../../../src/agents/memory/embedding-service', () => ({
  EmbeddingService: jest.fn().mockImplementation(() => ({
    generateEmbedding: jest.fn()
  }))
}));

// Mock OpenAI
const mockCreate = jest.fn();
jest.mock('openai', () => ({
  default: jest.fn().mockImplementation(() => ({
    chat: {
      completions: {
        create: mockCreate
      }
    }
  }))
}));

describe('AnalyzerAgent', () => {
  let analyzer: AnalyzerAgent;
  let mockExecutionStorage: any;
  let mockPlanStorage: any;
  let mockAnalyzerStorage: any;
  let mockAnalyzerMemoryRepository: any;
  let mockEmbeddingService: any;

  beforeEach(() => {
    // Get mocked modules
    const { ExecutionStorage } = require('../../../src/agents/executor/storage');
    const { PlanStorage } = require('../../../src/agents/planner/storage');
    const { AnalyzerStorage } = require('../../../src/agents/analyzer/storage');
    const { AnalyzerMemoryRepository } = require('../../../src/agents/memory/analyzer-memory');
    const { EmbeddingService } = require('../../../src/agents/memory/embedding-service');

    mockExecutionStorage = ExecutionStorage;
    mockPlanStorage = PlanStorage;
    mockAnalyzerStorage = AnalyzerStorage;
    mockAnalyzerMemoryRepository = new AnalyzerMemoryRepository();
    mockEmbeddingService = new EmbeddingService();

    analyzer = new AnalyzerAgent();
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('analyze', () => {
    it('should analyze successful execution', async () => {
      const executionId = 'exec-123';
      const planRequestId = 'req-123';
      
      // Mock execution data
      mockExecutionStorage.getExecutionById.mockResolvedValue({
        executionId,
        planRequestId,
        status: 'COMPLETED',
        totalSteps: 3,
        completedSteps: 3,
        failedSteps: 0,
        results: [
          { stepIndex: 0, status: 'COMPLETED', retryCount: 0 },
          { stepIndex: 1, status: 'COMPLETED', retryCount: 0 },
          { stepIndex: 2, status: 'COMPLETED', retryCount: 0 }
        ],
        startedAt: new Date('2024-01-01T10:00:00Z'),
        completedAt: new Date('2024-01-01T10:05:00Z')
      });

      // Mock plan data
      mockPlanStorage.getPlanByRequestId.mockResolvedValue({
        requestId: planRequestId,
        query: 'Create a shipment',
        plan: {
          steps: [
            { tool: 'create_shipment', params: {}, description: 'Create shipment' },
            { tool: 'update_shipment', params: {}, description: 'Update shipment' },
            { tool: 'get_shipment', params: {}, description: 'Get shipment' }
          ]
        }
      });

      // Mock LLM response
      mockCreate.mockResolvedValue({
        choices: [{
          message: {
            content: JSON.stringify({
              feedback: 'Execution completed successfully with all steps completed',
              improvement_notes: 'Consider optimizing parallel execution',
              success_indicators: ['All steps completed', 'No retries needed'],
              failure_patterns: [],
              recommendations: ['Consider batching operations']
            })
          }
        }]
      });

      // Mock embedding generation
      mockEmbeddingService.generateEmbedding.mockResolvedValue([0.1, 0.2, 0.3]);

      const result = await analyzer.analyze(executionId);

      expect(result).toBeDefined();
      expect(result.execution_id).toBe(executionId);
      expect(result.plan_request_id).toBe(planRequestId);
      expect(result.evaluation_metrics.success_rate).toBe(1.0);
      expect(result.evaluation_metrics.efficiency_score).toBeGreaterThan(0);
      expect(result.success_indicators).toContain('All steps completed');
      expect(mockAnalyzerStorage.saveAnalysis).toHaveBeenCalled();
      expect(mockAnalyzerMemoryRepository.store).toHaveBeenCalled();
    });

    it('should analyze failed execution', async () => {
      const executionId = 'exec-456';
      const planRequestId = 'req-456';
      
      // Mock execution data with failures
      mockExecutionStorage.getExecutionById.mockResolvedValue({
        executionId,
        planRequestId,
        status: 'FAILED',
        totalSteps: 3,
        completedSteps: 1,
        failedSteps: 2,
        results: [
          { stepIndex: 0, status: 'COMPLETED', retryCount: 0 },
          { stepIndex: 1, status: 'FAILED', retryCount: 3, error: 'Validation error' },
          { stepIndex: 2, status: 'FAILED', retryCount: 2, error: 'Network timeout' }
        ],
        startedAt: new Date('2024-01-01T10:00:00Z'),
        completedAt: new Date('2024-01-01T10:10:00Z')
      });

      // Mock plan data
      mockPlanStorage.getPlanByRequestId.mockResolvedValue({
        requestId: planRequestId,
        query: 'Create a complex shipment',
        plan: {
          steps: [
            { tool: 'create_shipment', params: {}, description: 'Create shipment' },
            { tool: 'validate_shipment', params: {}, description: 'Validate shipment' },
            { tool: 'process_shipment', params: {}, description: 'Process shipment' }
          ]
        }
      });

      // Mock LLM response for failed execution
      mockCreate.mockResolvedValue({
        choices: [{
          message: {
            content: JSON.stringify({
              feedback: 'Execution failed due to validation and network issues',
              improvement_notes: 'Add better error handling and retry logic',
              success_indicators: ['First step completed successfully'],
              failure_patterns: ['Validation errors', 'Network timeouts'],
              recommendations: ['Improve input validation', 'Add exponential backoff']
            })
          }
        }]
      });

      mockEmbeddingService.generateEmbedding.mockResolvedValue([0.1, 0.2, 0.3]);

      const result = await analyzer.analyze(executionId);

      expect(result).toBeDefined();
      expect(result.execution_id).toBe(executionId);
      expect(result.evaluation_metrics.success_rate).toBeCloseTo(0.33, 2);
      expect(result.failure_patterns).toContain('Validation errors');
      expect(result.recommendations).toContain('Improve input validation');
    });

    it('should handle missing execution data', async () => {
      mockExecutionStorage.getExecutionById.mockResolvedValue(null);

      await expect(analyzer.analyze('nonexistent')).rejects.toThrow('Execution not found');
    });

    it('should handle missing plan data', async () => {
      mockExecutionStorage.getExecutionById.mockResolvedValue({
        executionId: 'exec-123',
        planRequestId: 'req-123',
        status: 'COMPLETED'
      });
      mockPlanStorage.getPlanByRequestId.mockResolvedValue(null);

      await expect(analyzer.analyze('exec-123')).rejects.toThrow('Plan not found');
    });

    it('should handle LLM errors', async () => {
      mockExecutionStorage.getExecutionById.mockResolvedValue({
        executionId: 'exec-123',
        planRequestId: 'req-123',
        status: 'COMPLETED',
        totalSteps: 1,
        completedSteps: 1,
        failedSteps: 0,
        results: [{ stepIndex: 0, status: 'COMPLETED', retryCount: 0 }]
      });
      mockPlanStorage.getPlanByRequestId.mockResolvedValue({
        requestId: 'req-123',
        query: 'Test query',
        plan: { steps: [] }
      });

      mockCreate.mockRejectedValue(new Error('LLM API Error'));

      await expect(analyzer.analyze('exec-123')).rejects.toThrow('LLM API Error');
    });
  });

  describe('getHistoricalContext', () => {
    it('should retrieve historical context', async () => {
      const mockContext = [
        {
          id: 'analysis-1',
          execution_id: 'exec-1',
          feedback: 'Previous successful analysis',
          evaluation_metrics: { success_rate: 0.9, efficiency_score: 0.8, error_patterns: [] },
          improvement_notes: 'Good performance'
        }
      ];

      mockAnalyzerMemoryRepository.search.mockResolvedValue(mockContext);

      const result = await analyzer.getHistoricalContext('test query');

      expect(result).toEqual(mockContext);
      expect(mockAnalyzerMemoryRepository.search).toHaveBeenCalledWith('test query', 5);
    });
  });
});
