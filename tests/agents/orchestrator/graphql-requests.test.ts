// Tests for Orchestrator Agent GraphQL requests

import { orchestratorResolvers } from '../../../src/agents/orchestrator/graphql/resolvers';
import { SummaryFormat } from '../../../src/agents/summarizer/types';

// Mock dependencies
jest.mock('../../../src/agents/orchestrator/AgentOrchestrator');

describe('Orchestrator GraphQL Resolvers', () => {
  let mockOrchestrator: any;

  beforeEach(() => {
    const { AgentOrchestrator } = require('../../../src/agents/orchestrator/AgentOrchestrator');
    
    mockOrchestrator = {
      executeFullCycle: jest.fn(),
      provideFeedback: jest.fn(),
      getStatistics: jest.fn()
    };

    // Mock the singleton instance
    AgentOrchestrator.mockImplementation(() => mockOrchestrator);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('Mutation: executeFullCycle', () => {
    it('should execute full cycle successfully', async () => {
      const mockRequest = {
        query: 'Create a shipment',
        llm_provider: 'openai',
        execution_config: {
          maxRetries: 3,
          enableRollback: true
        },
        summary_format: SummaryFormat.STRUCTURED
      };

      const mockResult = {
        request_id: 'req-123',
        execution_id: 'exec-123',
        analysis_id: 'analysis-123',
        summary_id: 'summary-123',
        query: 'Create a shipment',
        plan: { requestId: 'req-123', query: 'Create a shipment' },
        execution: { executionId: 'exec-123', status: 'COMPLETED' },
        analysis: { analysis_id: 'analysis-123', feedback: 'Success' },
        summary: { summary_id: 'summary-123', content: 'Summary' },
        success: true,
        total_time_ms: 5000,
        created_at: '2024-01-01T00:00:00Z'
      };

      mockOrchestrator.executeFullCycle.mockResolvedValue(mockResult);

      const result = await orchestratorResolvers.Mutation.executeFullCycle(null, { request: mockRequest });

      expect(result).toEqual(mockResult);
      expect(mockOrchestrator.executeFullCycle).toHaveBeenCalledWith(mockRequest);
    });

    it('should handle full cycle execution errors', async () => {
      const mockRequest = {
        query: 'Invalid query',
        llm_provider: 'openai'
      };

      mockOrchestrator.executeFullCycle.mockRejectedValue(new Error('Full cycle failed'));

      await expect(
        orchestratorResolvers.Mutation.executeFullCycle(null, { request: mockRequest })
      ).rejects.toThrow('Failed to execute full cycle: Full cycle failed');
    });

    it('should execute with minimal request parameters', async () => {
      const mockRequest = {
        query: 'Simple query'
      };

      const mockResult = {
        request_id: 'req-456',
        execution_id: 'exec-456',
        success: true,
        total_time_ms: 3000
      };

      mockOrchestrator.executeFullCycle.mockResolvedValue(mockResult);

      const result = await orchestratorResolvers.Mutation.executeFullCycle(null, { request: mockRequest });

      expect(result).toEqual(mockResult);
      expect(mockOrchestrator.executeFullCycle).toHaveBeenCalledWith(mockRequest);
    });
  });

  describe('Mutation: provideFeedback', () => {
    it('should provide feedback successfully', async () => {
      const mockFeedback = {
        execution_id: 'exec-123',
        user_feedback: 'Great execution!',
        rating: 5,
        categories: ['accuracy', 'speed']
      };

      const mockResult = {
        feedback_id: 'feedback-123',
        execution_id: 'exec-123',
        user_feedback: 'Great execution!',
        rating: 5,
        categories: ['accuracy', 'speed'],
        processed: true,
        created_at: '2024-01-01T00:00:00Z'
      };

      mockOrchestrator.provideFeedback.mockResolvedValue(mockResult);

      const result = await orchestratorResolvers.Mutation.provideFeedback(null, { feedback: mockFeedback });

      expect(result).toEqual(mockResult);
      expect(mockOrchestrator.provideFeedback).toHaveBeenCalledWith(mockFeedback);
    });

    it('should handle feedback errors', async () => {
      const mockFeedback = {
        execution_id: 'exec-123',
        user_feedback: 'Test feedback'
      };

      mockOrchestrator.provideFeedback.mockRejectedValue(new Error('Feedback processing failed'));

      await expect(
        orchestratorResolvers.Mutation.provideFeedback(null, { feedback: mockFeedback })
      ).rejects.toThrow('Failed to provide feedback: Feedback processing failed');
    });

    it('should handle feedback with minimal parameters', async () => {
      const mockFeedback = {
        execution_id: 'exec-456',
        user_feedback: 'Simple feedback'
      };

      const mockResult = {
        feedback_id: 'feedback-456',
        execution_id: 'exec-456',
        user_feedback: 'Simple feedback',
        processed: true,
        created_at: '2024-01-01T00:00:00Z'
      };

      mockOrchestrator.provideFeedback.mockResolvedValue(mockResult);

      const result = await orchestratorResolvers.Mutation.provideFeedback(null, { feedback: mockFeedback });

      expect(result).toEqual(mockResult);
      expect(mockOrchestrator.provideFeedback).toHaveBeenCalledWith(mockFeedback);
    });
  });

  describe('Query: getOrchestratorStatistics', () => {
    it('should get orchestrator statistics', async () => {
      const mockStats = {
        total_cycles: 100,
        successful_cycles: 85,
        failed_cycles: 15,
        average_cycle_time_ms: 4500.5,
        success_rate: 0.85,
        average_plan_steps: 3.2,
        average_execution_time_ms: 2000.0,
        common_failure_patterns: [
          { pattern: 'timeout', count: 8 },
          { pattern: 'validation', count: 4 }
        ],
        top_queries: [
          { query: 'Create shipment', count: 25 },
          { query: 'Update facility', count: 20 }
        ]
      };

      mockOrchestrator.getStatistics.mockResolvedValue(mockStats);

      const result = await orchestratorResolvers.Query.getOrchestratorStatistics();

      expect(result).toEqual(mockStats);
      expect(mockOrchestrator.getStatistics).toHaveBeenCalled();
    });

    it('should handle statistics errors', async () => {
      mockOrchestrator.getStatistics.mockRejectedValue(new Error('Statistics retrieval failed'));

      await expect(
        orchestratorResolvers.Query.getOrchestratorStatistics()
      ).rejects.toThrow('Failed to get orchestrator statistics: Statistics retrieval failed');
    });
  });

  describe('Query: getFullCycleResult', () => {
    it('should return null (not implemented)', async () => {
      const result = await orchestratorResolvers.Query.getFullCycleResult(null, { requestId: 'req-123' });

      expect(result).toBeNull();
    });
  });
});
