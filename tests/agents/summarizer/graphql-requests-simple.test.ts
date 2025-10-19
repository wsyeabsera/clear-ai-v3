// Simple tests for Summarizer Agent GraphQL requests

describe('Summarizer GraphQL Resolvers', () => {
  describe('generateSummary mutation', () => {
    it('should be defined', () => {
      const { summarizerResolvers } = require('../../../src/agents/summarizer/graphql/resolvers');
      expect(summarizerResolvers.Mutation.generateSummary).toBeDefined();
      expect(typeof summarizerResolvers.Mutation.generateSummary).toBe('function');
    });
  });

  describe('getSummary query', () => {
    it('should be defined', () => {
      const { summarizerResolvers } = require('../../../src/agents/summarizer/graphql/resolvers');
      expect(summarizerResolvers.Query.getSummary).toBeDefined();
      expect(typeof summarizerResolvers.Query.getSummary).toBe('function');
    });
  });

  describe('getSummaryByExecutionId query', () => {
    it('should be defined', () => {
      const { summarizerResolvers } = require('../../../src/agents/summarizer/graphql/resolvers');
      expect(summarizerResolvers.Query.getSummaryByExecutionId).toBeDefined();
      expect(typeof summarizerResolvers.Query.getSummaryByExecutionId).toBe('function');
    });
  });

  describe('getSummaryStatistics query', () => {
    it('should be defined', () => {
      const { summarizerResolvers } = require('../../../src/agents/summarizer/graphql/resolvers');
      expect(summarizerResolvers.Query.getSummaryStatistics).toBeDefined();
      expect(typeof summarizerResolvers.Query.getSummaryStatistics).toBe('function');
    });
  });
});
