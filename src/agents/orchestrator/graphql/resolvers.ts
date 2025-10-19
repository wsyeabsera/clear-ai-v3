// GraphQL resolvers for the Orchestrator Agent

import { AgentOrchestrator } from '../AgentOrchestrator';
import { FullCycleRequest, FeedbackRequest } from '../types';

// Create a singleton instance of the AgentOrchestrator
const orchestrator = new AgentOrchestrator();

export const orchestratorResolvers = {
  Mutation: {
    executeFullCycle: async (_: any, { request }: { request: FullCycleRequest }) => {
      try {
        return await orchestrator.executeFullCycle(request);
      } catch (error) {
        console.error('Error executing full cycle:', error);
        throw new Error(`Failed to execute full cycle: ${error instanceof Error ? error.message : 'Unknown error'}`);
      }
    },
    
    provideFeedback: async (_: any, { feedback }: { feedback: FeedbackRequest }) => {
      try {
        return await orchestrator.provideFeedback(feedback);
      } catch (error) {
        console.error('Error providing feedback:', error);
        throw new Error(`Failed to provide feedback: ${error instanceof Error ? error.message : 'Unknown error'}`);
      }
    }
  },
  
  Query: {
    getFullCycleResult: async (_: any, { requestId }: { requestId: string }) => {
      try {
        // This would typically query a storage layer for full cycle results
        // For now, return null as we don't have a storage layer for full cycle results
        console.warn('getFullCycleResult not implemented - would need storage layer');
        return null;
      } catch (error) {
        console.error('Error getting full cycle result:', error);
        throw new Error(`Failed to get full cycle result: ${error instanceof Error ? error.message : 'Unknown error'}`);
      }
    },
    
    getOrchestratorStatistics: async () => {
      try {
        return await orchestrator.getStatistics();
      } catch (error) {
        console.error('Error getting orchestrator statistics:', error);
        throw new Error(`Failed to get orchestrator statistics: ${error instanceof Error ? error.message : 'Unknown error'}`);
      }
    }
  }
};
