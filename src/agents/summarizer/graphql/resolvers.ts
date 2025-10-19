// GraphQL resolvers for the Summarizer Agent

import { SummarizerAgent } from '../SummarizerAgent';
import { SummarizerStorage } from '../storage';
import { SummaryFormat } from '../types';

// Create a singleton instance of the SummarizerAgent
const summarizerAgent = new SummarizerAgent();

export const summarizerResolvers = {
  Mutation: {
    generateSummary: async (_: any, { executionId, format = SummaryFormat.STRUCTURED }: { executionId: string; format?: SummaryFormat }) => {
      try {
        return await summarizerAgent.summarize(executionId, format);
      } catch (error) {
        console.error('Error generating summary:', error);
        throw new Error(`Failed to generate summary: ${error instanceof Error ? error.message : 'Unknown error'}`);
      }
    }
  },
  
  Query: {
    getSummary: async (_: any, { summaryId }: { summaryId: string }) => {
      try {
        return await SummarizerStorage.getSummaryById(summaryId);
      } catch (error) {
        console.error('Error getting summary:', error);
        throw new Error(`Failed to get summary: ${error instanceof Error ? error.message : 'Unknown error'}`);
      }
    },
    
    getSummaryByExecutionId: async (_: any, { executionId }: { executionId: string }) => {
      try {
        return await SummarizerStorage.getSummaryByExecutionId(executionId);
      } catch (error) {
        console.error('Error getting summary by execution ID:', error);
        throw new Error(`Failed to get summary by execution ID: ${error instanceof Error ? error.message : 'Unknown error'}`);
      }
    },
    
    getSummaryStatistics: async () => {
      try {
        return await SummarizerStorage.getSummaryStatistics();
      } catch (error) {
        console.error('Error getting summary statistics:', error);
        throw new Error(`Failed to get summary statistics: ${error instanceof Error ? error.message : 'Unknown error'}`);
      }
    }
  }
};
