// Tests for Summarizer Agent

import { SummarizerAgent } from '../../../src/agents/summarizer/SummarizerAgent';
import { SummaryFormat } from '../../../src/agents/summarizer/types';

// Mock all dependencies
jest.mock('../../../src/agents/executor/storage');
jest.mock('../../../src/agents/planner/storage');
jest.mock('../../../src/agents/analyzer/storage');
jest.mock('../../../src/agents/summarizer/storage');
jest.mock('openai');

describe('SummarizerAgent', () => {
  let summarizer: SummarizerAgent;

  beforeEach(() => {
    // Mock the environment variables
    process.env.OPENAI_API_KEY = 'test-key';
    process.env.SUMMARIZER_LLM_MODEL = 'gpt-4o-mini';
    process.env.SUMMARIZER_TEMPERATURE = '0.7';

    summarizer = new SummarizerAgent();
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('summarize', () => {
    it('should be defined', () => {
      expect(summarizer).toBeDefined();
    });

    it('should have summarize method', () => {
      expect(typeof summarizer.summarize).toBe('function');
    });

    it('should have generateStructuredSummary method', () => {
      expect(typeof summarizer.generateStructuredSummary).toBe('function');
    });
  });

  describe('SummaryFormat enum', () => {
    it('should have all expected formats', () => {
      expect(SummaryFormat.JSON).toBe('JSON');
      expect(SummaryFormat.MARKDOWN).toBe('MARKDOWN');
      expect(SummaryFormat.PLAIN_TEXT).toBe('PLAIN_TEXT');
      expect(SummaryFormat.STRUCTURED).toBe('STRUCTURED');
    });
  });
});
