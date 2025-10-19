// Tests for Agent Orchestrator

import { AgentOrchestrator } from '../../../src/agents/orchestrator/AgentOrchestrator';
import { FullCycleRequest, FeedbackRequest } from '../../../src/agents/orchestrator/types';

// Mock all dependencies
jest.mock('../../../src/agents/planner/PlannerAgent');
jest.mock('../../../src/agents/executor/ExecutionAgent');
jest.mock('../../../src/agents/analyzer/AnalyzerAgent');
jest.mock('../../../src/agents/summarizer/SummarizerAgent');
jest.mock('../../../src/agents/memory/planner-memory');
jest.mock('../../../src/agents/memory/analyzer-memory');

describe('AgentOrchestrator', () => {
  let orchestrator: AgentOrchestrator;

  beforeEach(() => {
    orchestrator = new AgentOrchestrator();
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('executeFullCycle', () => {
    it('should be defined', () => {
      expect(orchestrator).toBeDefined();
    });

    it('should have executeFullCycle method', () => {
      expect(typeof orchestrator.executeFullCycle).toBe('function');
    });

    it('should have provideFeedback method', () => {
      expect(typeof orchestrator.provideFeedback).toBe('function');
    });

    it('should have getStatistics method', () => {
      expect(typeof orchestrator.getStatistics).toBe('function');
    });
  });

  describe('FullCycleRequest interface', () => {
    it('should accept valid request', () => {
      const request: FullCycleRequest = {
        query: 'Test query',
        llm_provider: 'openai',
        execution_config: {
          maxRetries: 3,
          enableRollback: true
        },
        summary_format: 'STRUCTURED'
      };

      expect(request.query).toBe('Test query');
      expect(request.llm_provider).toBe('openai');
      expect(request.execution_config?.maxRetries).toBe(3);
      expect(request.summary_format).toBe('STRUCTURED');
    });
  });

  describe('FeedbackRequest interface', () => {
    it('should accept valid feedback', () => {
      const feedback: FeedbackRequest = {
        execution_id: 'exec-123',
        user_feedback: 'Great execution!',
        rating: 5,
        categories: ['accuracy', 'speed']
      };

      expect(feedback.execution_id).toBe('exec-123');
      expect(feedback.user_feedback).toBe('Great execution!');
      expect(feedback.rating).toBe(5);
      expect(feedback.categories).toEqual(['accuracy', 'speed']);
    });
  });
});
