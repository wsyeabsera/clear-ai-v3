// Simple tests for Analyzer Agent

import { AnalyzerAgent } from '../../../src/agents/analyzer/AnalyzerAgent';

// Mock all dependencies
jest.mock('../../../src/agents/executor/storage');
jest.mock('../../../src/agents/planner/storage');
jest.mock('../../../src/agents/analyzer/storage');
jest.mock('../../../src/agents/memory/analyzer-memory');
jest.mock('../../../src/agents/memory/embedding-service');
jest.mock('../../../src/agents/memory/vector-store');
jest.mock('openai');

describe('AnalyzerAgent', () => {
  let analyzer: AnalyzerAgent;

  beforeEach(() => {
    // Mock the environment variables
    process.env.OPENAI_API_KEY = 'test-key';
    process.env.OPENAI_EMBEDDING_MODEL = 'text-embedding-3-small';
    process.env.PINECONE_API_KEY = 'test-pinecone-key';
    process.env.PINECONE_ENVIRONMENT = 'test-env';
    process.env.PINECONE_INDEX_NAME = 'test-index';
    process.env.ANALYZER_LLM_MODEL = 'gpt-4o-mini';
    process.env.ANALYZER_TEMPERATURE = '0.3';

    analyzer = new AnalyzerAgent();
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('analyze', () => {
    it('should be defined', () => {
      expect(analyzer).toBeDefined();
    });

    it('should have analyze method', () => {
      expect(typeof analyzer.analyze).toBe('function');
    });

    it('should have getHistoricalContext method', () => {
      expect(typeof analyzer.getHistoricalContext).toBe('function');
    });
  });
});
