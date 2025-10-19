// GraphQL resolvers for the Planner Agent

import { PlannerAgent } from '../PlannerAgent';

// Create a singleton instance of the PlannerAgent
const plannerAgent = new PlannerAgent();

export const plannerResolvers = {
  Mutation: {
    createPlan: async (_: any, { query, llmProvider }: { query: string; llmProvider?: string }) => {
      try {
        return await plannerAgent.plan(query, llmProvider);
      } catch (error) {
        console.error('Error creating plan:', error);
        throw new Error(`Failed to create plan: ${error instanceof Error ? error.message : 'Unknown error'}`);
      }
    },
    
    deletePlan: async (_: any, { requestId }: { requestId: string }) => {
      try {
        return await plannerAgent.deletePlan(requestId);
      } catch (error) {
        console.error('Error deleting plan:', error);
        throw new Error(`Failed to delete plan: ${error instanceof Error ? error.message : 'Unknown error'}`);
      }
    }
  },
  
  Query: {
    getPlan: async (_: any, { requestId }: { requestId: string }) => {
      try {
        return await plannerAgent.getPlan(requestId);
      } catch (error) {
        console.error('Error getting plan:', error);
        throw new Error(`Failed to get plan: ${error instanceof Error ? error.message : 'Unknown error'}`);
      }
    },
    
    getPlanStatistics: async () => {
      try {
        return await plannerAgent.getStatistics();
      } catch (error) {
        console.error('Error getting plan statistics:', error);
        throw new Error(`Failed to get plan statistics: ${error instanceof Error ? error.message : 'Unknown error'}`);
      }
    },
    
    getRecentPlans: async (_: any, { limit = 50 }: { limit?: number }) => {
      try {
        return await plannerAgent.getRecentPlans(limit);
      } catch (error) {
        console.error('Error getting recent plans:', error);
        throw new Error(`Failed to get recent plans: ${error instanceof Error ? error.message : 'Unknown error'}`);
      }
    }
  }
};
