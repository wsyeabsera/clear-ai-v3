// GraphQL resolvers for the Execution Agent

import { ExecutionAgent } from '../ExecutionAgent';

// Create a singleton instance of the ExecutionAgent
const executionAgent = new ExecutionAgent();

export const executorResolvers = {
  Mutation: {
    executePlan: async (_: any, { planRequestId, config }: { planRequestId: string; config?: any }) => {
      try {
        return await executionAgent.executePlan(planRequestId, config);
      } catch (error) {
        console.error('Error executing plan:', error);
        throw new Error(`Failed to execute plan: ${error instanceof Error ? error.message : 'Unknown error'}`);
      }
    },
    
    cancelExecution: async (_: any, { executionId }: { executionId: string }) => {
      try {
        return await executionAgent.cancelExecution(executionId);
      } catch (error) {
        console.error('Error cancelling execution:', error);
        throw new Error(`Failed to cancel execution: ${error instanceof Error ? error.message : 'Unknown error'}`);
      }
    },
    
    retryExecution: async (_: any, { executionId }: { executionId: string }) => {
      try {
        return await executionAgent.retryExecution(executionId);
      } catch (error) {
        console.error('Error retrying execution:', error);
        throw new Error(`Failed to retry execution: ${error instanceof Error ? error.message : 'Unknown error'}`);
      }
    }
  },
  
  Query: {
    getExecution: async (_: any, { executionId }: { executionId: string }) => {
      try {
        return await executionAgent.getExecution(executionId);
      } catch (error) {
        console.error('Error getting execution:', error);
        throw new Error(`Failed to get execution: ${error instanceof Error ? error.message : 'Unknown error'}`);
      }
    },
    
    getExecutionsByPlanId: async (_: any, { planRequestId }: { planRequestId: string }) => {
      try {
        return await executionAgent.getExecutionsByPlanId(planRequestId);
      } catch (error) {
        console.error('Error getting executions by plan ID:', error);
        throw new Error(`Failed to get executions: ${error instanceof Error ? error.message : 'Unknown error'}`);
      }
    },
    
    getRecentExecutions: async (_: any, { limit = 50 }: { limit?: number }) => {
      try {
        return await executionAgent.getRecentExecutions(limit);
      } catch (error) {
        console.error('Error getting recent executions:', error);
        throw new Error(`Failed to get recent executions: ${error instanceof Error ? error.message : 'Unknown error'}`);
      }
    },
    
    getExecutionStatistics: async () => {
      try {
        return await executionAgent.getStatistics();
      } catch (error) {
        console.error('Error getting execution statistics:', error);
        throw new Error(`Failed to get execution statistics: ${error instanceof Error ? error.message : 'Unknown error'}`);
      }
    }
  }
};
