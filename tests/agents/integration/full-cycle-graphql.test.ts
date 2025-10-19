// Integration tests for full cycle GraphQL operations

import { ApolloServer } from '@apollo/server';
import { startStandaloneServer } from '@apollo/server/standalone';
import { readFileSync } from 'fs';
import { join } from 'path';
import { connectToDatabase } from '../../../src/server/database/connection';
import { MCPClient } from '../../../src/client/MCPClient';
import { DynamicToolExecutor } from '../../../src/client/DynamicToolExecutor';
import { plannerResolvers } from '../../../src/agents/planner/graphql/resolvers';
import { executorResolvers } from '../../../src/agents/executor/graphql/resolvers';
import { analyzerResolvers } from '../../../src/agents/analyzer/graphql/resolvers';
import { summarizerResolvers } from '../../../src/agents/summarizer/graphql/resolvers';
import { orchestratorResolvers } from '../../../src/agents/orchestrator/graphql/resolvers';
import GraphQLJSON from 'graphql-type-json';

// Mock external dependencies
jest.mock('../../../src/client/MCPClient');
jest.mock('../../../src/agents/planner/PlannerAgent');
jest.mock('../../../src/agents/executor/ExecutionAgent');
jest.mock('../../../src/agents/analyzer/AnalyzerAgent');
jest.mock('../../../src/agents/summarizer/SummarizerAgent');
jest.mock('../../../src/agents/orchestrator/AgentOrchestrator');
jest.mock('../../../src/agents/memory/planner-memory');
jest.mock('../../../src/agents/memory/analyzer-memory');
jest.mock('../../../src/agents/memory/embedding-service');
jest.mock('../../../src/agents/memory/vector-store');
jest.mock('openai');

describe('Full Cycle GraphQL Integration', () => {
  let server: ApolloServer;
  let url: string;

  beforeAll(async () => {
    // Connect to test database
    await connectToDatabase();

    // Read GraphQL schema
    const schemaPath = join(__dirname, '../../../src/client/schema.graphql');
    const typeDefs = readFileSync(schemaPath, 'utf-8');

    // Mock MCP client and executor
    const mockMCPClient = {
      connect: jest.fn().mockResolvedValue(undefined),
      listTools: jest.fn().mockResolvedValue([]),
      callTool: jest.fn().mockResolvedValue({ success: true, data: {} })
    };

    const mockExecutor = {
      listAvailableTools: jest.fn().mockResolvedValue([]),
      executeTool: jest.fn().mockResolvedValue({ success: true, data: {} })
    };

    // Define resolvers
    const resolvers = {
      JSON: GraphQLJSON,
      
      Query: {
        listTools: async () => {
          return await mockExecutor.listAvailableTools();
        },
        ...plannerResolvers.Query,
        ...executorResolvers.Query,
        ...analyzerResolvers.Query,
        ...summarizerResolvers.Query,
        ...orchestratorResolvers.Query,
      },
      
      Mutation: {
        executeTool: async (_: any, { name, params }: { name: string; params: any }) => {
          return await mockExecutor.executeTool(name, params);
        },
        ...plannerResolvers.Mutation,
        ...executorResolvers.Mutation,
        ...analyzerResolvers.Mutation,
        ...summarizerResolvers.Mutation,
        ...orchestratorResolvers.Mutation,
      },
    };

    // Create Apollo Server
    server = new ApolloServer({
      typeDefs,
      resolvers,
      plugins: [ApolloServerPluginLandingPageLocalDefault({ embed: true })],
    });

    const { url: serverUrl } = await startStandaloneServer(server, {
      listen: { port: 0 }, // Use random available port
    });

    url = serverUrl;
  });

  afterAll(async () => {
    await server.stop();
  });

  describe('Individual Agent Operations', () => {
    it('should create a plan via GraphQL', async () => {
      const query = `
        mutation CreatePlan($query: String!) {
          createPlan(query: $query) {
            requestId
            query
            status
            createdAt
          }
        }
      `;

      const variables = {
        query: 'Create a test shipment'
      };

      const response = await fetch(url, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          query,
          variables,
        }),
      });

      const result = await response.json();
      expect(result.data.createPlan).toBeDefined();
      expect(result.data.createPlan.query).toBe('Create a test shipment');
    });

    it('should execute a plan via GraphQL', async () => {
      const query = `
        mutation ExecutePlan($planRequestId: String!) {
          executePlan(planRequestId: $planRequestId) {
            executionId
            planRequestId
            status
            totalSteps
          }
        }
      `;

      const variables = {
        planRequestId: 'test-plan-123'
      };

      const response = await fetch(url, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          query,
          variables,
        }),
      });

      const result = await response.json();
      expect(result.data.executePlan).toBeDefined();
      expect(result.data.executePlan.planRequestId).toBe('test-plan-123');
    });

    it('should analyze an execution via GraphQL', async () => {
      const query = `
        mutation AnalyzeExecution($executionId: String!) {
          analyzeExecution(executionId: $executionId) {
            analysis_id
            execution_id
            feedback
            evaluation_metrics {
              success_rate
              efficiency_score
            }
          }
        }
      `;

      const variables = {
        executionId: 'test-exec-123'
      };

      const response = await fetch(url, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          query,
          variables,
        }),
      });

      const result = await response.json();
      expect(result.data.analyzeExecution).toBeDefined();
      expect(result.data.analyzeExecution.execution_id).toBe('test-exec-123');
    });

    it('should generate a summary via GraphQL', async () => {
      const query = `
        mutation GenerateSummary($executionId: String!, $format: SummaryFormat) {
          generateSummary(executionId: $executionId, format: $format) {
            summary_id
            execution_id
            format
            content
          }
        }
      `;

      const variables = {
        executionId: 'test-exec-123',
        format: 'STRUCTURED'
      };

      const response = await fetch(url, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          query,
          variables,
        }),
      });

      const result = await response.json();
      expect(result.data.generateSummary).toBeDefined();
      expect(result.data.generateSummary.execution_id).toBe('test-exec-123');
      expect(result.data.generateSummary.format).toBe('STRUCTURED');
    });
  });

  describe('Full Cycle Operations', () => {
    it('should execute full cycle via GraphQL', async () => {
      const query = `
        mutation ExecuteFullCycle($request: FullCycleRequestInput!) {
          executeFullCycle(request: $request) {
            request_id
            execution_id
            analysis_id
            summary_id
            query
            success
            total_time_ms
            plan {
              requestId
              query
            }
            execution {
              executionId
              status
            }
            analysis {
              analysis_id
              feedback
            }
            summary {
              summary_id
              format
            }
          }
        }
      `;

      const variables = {
        request: {
          query: 'Create a comprehensive shipment with tracking',
          llm_provider: 'openai',
          execution_config: {
            maxRetries: 3,
            enableRollback: true
          },
          summary_format: 'STRUCTURED'
        }
      };

      const response = await fetch(url, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          query,
          variables,
        }),
      });

      const result = await response.json();
      expect(result.data.executeFullCycle).toBeDefined();
      expect(result.data.executeFullCycle.query).toBe('Create a comprehensive shipment with tracking');
      expect(result.data.executeFullCycle.request_id).toBeDefined();
      expect(result.data.executeFullCycle.execution_id).toBeDefined();
      expect(result.data.executeFullCycle.analysis_id).toBeDefined();
      expect(result.data.executeFullCycle.summary_id).toBeDefined();
    });

    it('should provide feedback via GraphQL', async () => {
      const query = `
        mutation ProvideFeedback($feedback: FeedbackRequestInput!) {
          provideFeedback(feedback: $feedback) {
            feedback_id
            execution_id
            user_feedback
            rating
            categories
            processed
            created_at
          }
        }
      `;

      const variables = {
        feedback: {
          execution_id: 'test-exec-123',
          user_feedback: 'Great execution! Very fast and accurate.',
          rating: 5,
          categories: ['accuracy', 'speed', 'usefulness']
        }
      };

      const response = await fetch(url, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          query,
          variables,
        }),
      });

      const result = await response.json();
      expect(result.data.provideFeedback).toBeDefined();
      expect(result.data.provideFeedback.execution_id).toBe('test-exec-123');
      expect(result.data.provideFeedback.user_feedback).toBe('Great execution! Very fast and accurate.');
      expect(result.data.provideFeedback.rating).toBe(5);
      expect(result.data.provideFeedback.processed).toBe(true);
    });
  });

  describe('Query Operations', () => {
    it('should get orchestrator statistics', async () => {
      const query = `
        query GetOrchestratorStatistics {
          getOrchestratorStatistics {
            total_cycles
            successful_cycles
            failed_cycles
            success_rate
            average_cycle_time_ms
          }
        }
      `;

      const response = await fetch(url, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          query,
        }),
      });

      const result = await response.json();
      expect(result.data.getOrchestratorStatistics).toBeDefined();
      expect(typeof result.data.getOrchestratorStatistics.total_cycles).toBe('number');
    });

    it('should get analysis statistics', async () => {
      const query = `
        query GetAnalysisStatistics {
          getAnalysisStatistics {
            total
            average_success_rate
            average_efficiency_score
            common_error_patterns {
              pattern
              count
            }
          }
        }
      `;

      const response = await fetch(url, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          query,
        }),
      });

      const result = await response.json();
      expect(result.data.getAnalysisStatistics).toBeDefined();
      expect(typeof result.data.getAnalysisStatistics.total).toBe('number');
    });

    it('should get summary statistics', async () => {
      const query = `
        query GetSummaryStatistics {
          getSummaryStatistics {
            total
            by_format {
              JSON
              MARKDOWN
              PLAIN_TEXT
              STRUCTURED
            }
            average_content_length
            success_rate
          }
        }
      `;

      const response = await fetch(url, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          query,
        }),
      });

      const result = await response.json();
      expect(result.data.getSummaryStatistics).toBeDefined();
      expect(typeof result.data.getSummaryStatistics.total).toBe('number');
    });
  });

  describe('Memory Integration', () => {
    it('should get historical context for analysis', async () => {
      const query = `
        query GetHistoricalContext($query: String!, $limit: Int) {
          getHistoricalContext(query: $query, limit: $limit) {
            id
            execution_id
            feedback
            evaluation_metrics {
              success_rate
              efficiency_score
            }
            improvement_notes
          }
        }
      `;

      const variables = {
        query: 'Create shipment',
        limit: 5
      };

      const response = await fetch(url, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          query,
          variables,
        }),
      });

      const result = await response.json();
      expect(result.data.getHistoricalContext).toBeDefined();
      expect(Array.isArray(result.data.getHistoricalContext)).toBe(true);
    });
  });
});
