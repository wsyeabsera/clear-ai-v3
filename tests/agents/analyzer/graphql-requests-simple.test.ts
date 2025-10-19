// Simple tests for Analyzer Agent GraphQL requests

describe('Analyzer GraphQL Resolvers', () => {
  describe('analyzeExecution mutation', () => {
    it('should be defined', () => {
      // Test that the resolver function exists
      const { analyzerResolvers } = require('../../../src/agents/analyzer/graphql/resolvers');
      expect(analyzerResolvers.Mutation.analyzeExecution).toBeDefined();
      expect(typeof analyzerResolvers.Mutation.analyzeExecution).toBe('function');
    });
  });

  describe('getAnalysis query', () => {
    it('should be defined', () => {
      const { analyzerResolvers } = require('../../../src/agents/analyzer/graphql/resolvers');
      expect(analyzerResolvers.Query.getAnalysis).toBeDefined();
      expect(typeof analyzerResolvers.Query.getAnalysis).toBe('function');
    });
  });

  describe('getAnalysisByExecutionId query', () => {
    it('should be defined', () => {
      const { analyzerResolvers } = require('../../../src/agents/analyzer/graphql/resolvers');
      expect(analyzerResolvers.Query.getAnalysisByExecutionId).toBeDefined();
      expect(typeof analyzerResolvers.Query.getAnalysisByExecutionId).toBe('function');
    });
  });

  describe('getAnalysisStatistics query', () => {
    it('should be defined', () => {
      const { analyzerResolvers } = require('../../../src/agents/analyzer/graphql/resolvers');
      expect(analyzerResolvers.Query.getAnalysisStatistics).toBeDefined();
      expect(typeof analyzerResolvers.Query.getAnalysisStatistics).toBe('function');
    });
  });

  describe('getHistoricalContext query', () => {
    it('should be defined', () => {
      const { analyzerResolvers } = require('../../../src/agents/analyzer/graphql/resolvers');
      expect(analyzerResolvers.Query.getHistoricalContext).toBeDefined();
      expect(typeof analyzerResolvers.Query.getHistoricalContext).toBe('function');
    });
  });
});
