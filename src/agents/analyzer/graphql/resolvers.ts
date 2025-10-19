// GraphQL resolvers for the Analyzer Agent

import { AnalyzerAgent } from '../AnalyzerAgent';
import { AnalyzerStorage } from '../storage';

// Create a singleton instance of the AnalyzerAgent
const analyzerAgent = new AnalyzerAgent();

export const analyzerResolvers = {
  Mutation: {
    analyzeExecution: async (_: any, { executionId }: { executionId: string }) => {
      try {
        return await analyzerAgent.analyze(executionId);
      } catch (error) {
        console.error('Error analyzing execution:', error);
        throw new Error(`Failed to analyze execution: ${error instanceof Error ? error.message : 'Unknown error'}`);
      }
    }
  },
  
  Query: {
    getAnalysis: async (_: any, { analysisId }: { analysisId: string }) => {
      try {
        return await AnalyzerStorage.getAnalysisById(analysisId);
      } catch (error) {
        console.error('Error getting analysis:', error);
        throw new Error(`Failed to get analysis: ${error instanceof Error ? error.message : 'Unknown error'}`);
      }
    },
    
    getAnalysisByExecutionId: async (_: any, { executionId }: { executionId: string }) => {
      try {
        return await AnalyzerStorage.getAnalysisByExecutionId(executionId);
      } catch (error) {
        console.error('Error getting analysis by execution ID:', error);
        throw new Error(`Failed to get analysis by execution ID: ${error instanceof Error ? error.message : 'Unknown error'}`);
      }
    },
    
    getAnalysisStatistics: async () => {
      try {
        return await AnalyzerStorage.getAnalysisStatistics();
      } catch (error) {
        console.error('Error getting analysis statistics:', error);
        throw new Error(`Failed to get analysis statistics: ${error instanceof Error ? error.message : 'Unknown error'}`);
      }
    },
    
    getHistoricalContext: async (_: any, { query, limit = 5 }: { query: string; limit?: number }) => {
      try {
        return await analyzerAgent.getHistoricalContext(query);
      } catch (error) {
        console.error('Error getting historical context:', error);
        throw new Error(`Failed to get historical context: ${error instanceof Error ? error.message : 'Unknown error'}`);
      }
    }
  }
};
