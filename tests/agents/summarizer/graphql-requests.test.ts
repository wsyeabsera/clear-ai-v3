// Tests for Summarizer Agent GraphQL requests

import { summarizerResolvers } from '../../../src/agents/summarizer/graphql/resolvers';
import { SummaryFormat } from '../../../src/agents/summarizer/types';

// Mock dependencies
jest.mock('../../../src/agents/summarizer/SummarizerAgent');
jest.mock('../../../src/agents/summarizer/storage');

describe('Summarizer GraphQL Resolvers', () => {
  let mockSummarizerAgent: any;
  let mockSummarizerStorage: any;

  beforeEach(() => {
    const { SummarizerAgent } = require('../../../src/agents/summarizer/SummarizerAgent');
    const { SummarizerStorage } = require('../../../src/agents/summarizer/storage');
    
    mockSummarizerAgent = {
      summarize: jest.fn()
    };
    
    mockSummarizerStorage = {
      getSummaryById: jest.fn(),
      getSummaryByExecutionId: jest.fn(),
      getSummaryStatistics: jest.fn()
    };

    // Mock the singleton instances
    SummarizerAgent.mockImplementation(() => mockSummarizerAgent);
    SummarizerStorage.getSummaryById = mockSummarizerStorage.getSummaryById;
    SummarizerStorage.getSummaryByExecutionId = mockSummarizerStorage.getSummaryByExecutionId;
    SummarizerStorage.getSummaryStatistics = mockSummarizerStorage.getSummaryStatistics;
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('Mutation: generateSummary', () => {
    it('should generate summary with default format', async () => {
      const mockSummary = {
        summary_id: 'summary-123',
        execution_id: 'exec-123',
        plan_request_id: 'req-123',
        format: SummaryFormat.STRUCTURED,
        content: '# Execution Summary\n\nTest summary content',
        structured_data: {
          user_query: 'Test query',
          answer: 'Successfully completed',
          steps_executed: 3,
          success: true,
          key_results: [],
          execution_time_ms: 1500
        }
      };

      mockSummarizerAgent.summarize.mockResolvedValue(mockSummary);

      const result = await summarizerResolvers.Mutation.generateSummary(null, { executionId: 'exec-123' });

      expect(result).toEqual(mockSummary);
      expect(mockSummarizerAgent.summarize).toHaveBeenCalledWith('exec-123', SummaryFormat.STRUCTURED);
    });

    it('should generate summary with specified format', async () => {
      const mockSummary = {
        summary_id: 'summary-123',
        execution_id: 'exec-123',
        format: SummaryFormat.MARKDOWN,
        content: '# Markdown Summary\n\nTest content'
      };

      mockSummarizerAgent.summarize.mockResolvedValue(mockSummary);

      const result = await summarizerResolvers.Mutation.generateSummary(null, { 
        executionId: 'exec-123', 
        format: SummaryFormat.MARKDOWN 
      });

      expect(result).toEqual(mockSummary);
      expect(mockSummarizerAgent.summarize).toHaveBeenCalledWith('exec-123', SummaryFormat.MARKDOWN);
    });

    it('should handle summary generation errors', async () => {
      mockSummarizerAgent.summarize.mockRejectedValue(new Error('Summary generation failed'));

      await expect(
        summarizerResolvers.Mutation.generateSummary(null, { executionId: 'exec-123' })
      ).rejects.toThrow('Failed to generate summary: Summary generation failed');
    });
  });

  describe('Query: getSummary', () => {
    it('should get summary by ID', async () => {
      const mockSummary = {
        summary_id: 'summary-123',
        execution_id: 'exec-123',
        format: SummaryFormat.STRUCTURED,
        content: 'Test summary content'
      };

      mockSummarizerStorage.getSummaryById.mockResolvedValue(mockSummary);

      const result = await summarizerResolvers.Query.getSummary(null, { summaryId: 'summary-123' });

      expect(result).toEqual(mockSummary);
      expect(mockSummarizerStorage.getSummaryById).toHaveBeenCalledWith('summary-123');
    });

    it('should handle get summary errors', async () => {
      mockSummarizerStorage.getSummaryById.mockRejectedValue(new Error('Storage error'));

      await expect(
        summarizerResolvers.Query.getSummary(null, { summaryId: 'summary-123' })
      ).rejects.toThrow('Failed to get summary: Storage error');
    });
  });

  describe('Query: getSummaryByExecutionId', () => {
    it('should get summary by execution ID', async () => {
      const mockSummary = {
        summary_id: 'summary-123',
        execution_id: 'exec-123',
        format: SummaryFormat.JSON,
        content: '{"result": "success"}'
      };

      mockSummarizerStorage.getSummaryByExecutionId.mockResolvedValue(mockSummary);

      const result = await summarizerResolvers.Query.getSummaryByExecutionId(null, { executionId: 'exec-123' });

      expect(result).toEqual(mockSummary);
      expect(mockSummarizerStorage.getSummaryByExecutionId).toHaveBeenCalledWith('exec-123');
    });
  });

  describe('Query: getSummaryStatistics', () => {
    it('should get summary statistics', async () => {
      const mockStats = {
        total: 25,
        by_format: {
          JSON: 5,
          MARKDOWN: 10,
          PLAIN_TEXT: 5,
          STRUCTURED: 5
        },
        average_content_length: 150.5,
        success_rate: 0.92
      };

      mockSummarizerStorage.getSummaryStatistics.mockResolvedValue(mockStats);

      const result = await summarizerResolvers.Query.getSummaryStatistics();

      expect(result).toEqual(mockStats);
      expect(mockSummarizerStorage.getSummaryStatistics).toHaveBeenCalled();
    });
  });

  describe('SummaryFormat enum', () => {
    it('should have all expected format values', () => {
      expect(SummaryFormat.JSON).toBe('JSON');
      expect(SummaryFormat.MARKDOWN).toBe('MARKDOWN');
      expect(SummaryFormat.PLAIN_TEXT).toBe('PLAIN_TEXT');
      expect(SummaryFormat.STRUCTURED).toBe('STRUCTURED');
    });
  });
});
