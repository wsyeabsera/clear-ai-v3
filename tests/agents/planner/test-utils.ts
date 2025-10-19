// Test utilities for Planner Agent testing

import { MongoMemoryServer } from 'mongodb-memory-server';
import { connect, disconnect, connection } from 'mongoose';
import { PlannerAgent } from '../../../src/agents/planner/PlannerAgent';
import { PlanRequestModel } from '../../../src/agents/planner/models/PlanRequest';
import { Plan, PlanStatus } from '../../../src/agents/planner/types';

export class TestUtils {
  private static mongoServer: MongoMemoryServer | null = null;
  private static testDbUri: string | null = null;

  /**
   * Set up in-memory MongoDB for testing
   */
  static async setupTestDatabase(): Promise<string> {
    if (!this.mongoServer) {
      this.mongoServer = await MongoMemoryServer.create();
      this.testDbUri = this.mongoServer.getUri();
    }
    
    // Close any existing connections first
    if (connection.readyState !== 0) {
      await connection.close();
    }
    
    // Connect to test database
    await connect(this.testDbUri!);
    return this.testDbUri!;
  }

  /**
   * Clean up test database
   */
  static async cleanupTestDatabase(): Promise<void> {
    if (this.testDbUri) {
      await disconnect();
    }
    
    if (this.mongoServer) {
      await this.mongoServer.stop();
      this.mongoServer = null;
      this.testDbUri = null;
    }
  }

  /**
   * Clear all plan requests from test database
   */
  static async clearPlanRequests(): Promise<void> {
    await PlanRequestModel.deleteMany({});
  }

  /**
   * Create a test plan request
   */
  static async createTestPlanRequest(
    requestId: string,
    query: string,
    plan: Plan,
    status: PlanStatus = PlanStatus.COMPLETED
  ): Promise<void> {
    const planRequest = new PlanRequestModel({
      requestId,
      query,
      plan,
      status,
      llmProvider: 'openai',
      validationErrors: [],
      createdAt: new Date(),
      executionTimeMs: 1000
    });
    
    await planRequest.save();
  }

  /**
   * Get a test plan request by ID
   */
  static async getTestPlanRequest(requestId: string) {
    return await PlanRequestModel.findOne({ requestId });
  }

  /**
   * Mock LLM responses for testing
   */
  static createMockLLMResponse(response: any): any {
    return {
      invoke: jest.fn().mockResolvedValue({
        content: JSON.stringify(response)
      })
    };
  }

  /**
   * Create sample test queries
   */
  static getSampleQueries(): string[] {
    return [
      'List all shipments from last week',
      'Get contaminated shipments from Berlin facilities',
      'Create a new shipment record',
      'Find shipments with lead contamination',
      'Show me facilities with high rejection rates',
      'Get all facilities in Germany',
      'List waste codes for hazardous materials',
      'Find contracts expiring this month'
    ];
  }

  /**
   * Create expected plan structure for testing
   */
  static createExpectedPlan(query: string, requestId: string): Plan {
    return {
      steps: [
        {
          tool: 'shipments_list',
          params: {
            page: 1,
            limit: 10,
            date_from: '2025-01-01T00:00:00.000Z'
          },
          dependsOn: [],
          parallel: false,
          description: `Execute shipments_list command for query: ${query}`
        }
      ],
      metadata: {
        query,
        requestId,
        totalSteps: 1,
        parallelSteps: 0
      }
    };
  }

  /**
   * Create a mock planner agent for testing
   */
  static createMockPlannerAgent(): Partial<PlannerAgent> {
    return {
      plan: jest.fn().mockImplementation(async (query: string) => {
        const requestId = `test-${Date.now()}`;
        const plan = this.createExpectedPlan(query, requestId);
        
        return {
          requestId,
          query,
          plan,
          status: PlanStatus.COMPLETED,
          createdAt: new Date().toISOString(),
          executionTimeMs: 1000,
          validationErrors: []
        };
      }),
      
      getPlan: jest.fn().mockImplementation(async (requestId: string) => {
        const planRequest = await this.getTestPlanRequest(requestId);
        if (!planRequest) return null;
        
        return {
          requestId: planRequest.requestId,
          query: planRequest.query,
          plan: planRequest.plan,
          status: planRequest.status,
          createdAt: planRequest.createdAt.toISOString(),
          executionTimeMs: planRequest.executionTimeMs,
          validationErrors: planRequest.validationErrors
        };
      }),
      
      getStatistics: jest.fn().mockResolvedValue({
        totalPlans: 10,
        completedPlans: 8,
        failedPlans: 2,
        averageExecutionTime: 1500,
        statusCounts: {
          completed: 8,
          failed: 2,
          pending: 0
        },
        providerCounts: [
          { provider: 'openai', count: 6 },
          { provider: 'groq', count: 4 }
        ]
      }),
      
      getRecentPlans: jest.fn().mockImplementation(async (limit: number = 50) => {
        const plans = await PlanRequestModel.find()
          .sort({ createdAt: -1 })
          .limit(limit);
        
        return plans.map((plan: any) => ({
          requestId: plan.requestId,
          query: plan.query,
          status: plan.status,
          createdAt: plan.createdAt.toISOString(),
          executionTimeMs: plan.executionTimeMs
        }));
      }),
      
      deletePlan: jest.fn().mockImplementation(async (requestId: string) => {
        const result = await PlanRequestModel.deleteOne({ requestId });
        return result.deletedCount > 0;
      })
    };
  }

  /**
   * Wait for a specified amount of time
   */
  static async wait(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  /**
   * Generate a random request ID for testing
   */
  static generateRequestId(): string {
    return `test-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
  }

  /**
   * Create test environment variables
   */
  static getTestEnvVars(): Record<string, string> {
    console.log('🔍 Debug: OPENAI_API_KEY from env:', process.env.OPENAI_API_KEY ? `${process.env.OPENAI_API_KEY.substring(0, 10)}...` : 'undefined');
    console.log('🔍 Debug: OPENAI_API_KEY starts with sk-:', process.env.OPENAI_API_KEY ? process.env.OPENAI_API_KEY.startsWith('sk-') : false);
    console.log('🔍 Debug: OPENAI_API_KEY length:', process.env.OPENAI_API_KEY ? process.env.OPENAI_API_KEY.length : 0);
    
    return {
      OPENAI_API_KEY: process.env.OPENAI_API_KEY || 'test-openai-key',
      GROQ_API_KEY: process.env.GROQ_API_KEY || 'test-groq-key',
      MONGODB_URI: this.testDbUri || 'mongodb://localhost:27017/waste-management-test',
      DEFAULT_LLM_PROVIDER: 'openai',
      ENABLE_LLM_FALLBACK: 'true',
      MAX_PLAN_REFINEMENTS: '3',
      PLANNER_TIMEOUT_MS: '30000'
    };
  }

  /**
   * Set test environment variables
   */
  static setTestEnvVars(): void {
    const envVars = this.getTestEnvVars();
    Object.entries(envVars).forEach(([key, value]) => {
      // Don't override API keys if they're already set in the environment
      if (key === 'OPENAI_API_KEY' && process.env.OPENAI_API_KEY && !process.env.OPENAI_API_KEY.startsWith('test-')) {
        console.log('🔒 Keeping existing OPENAI_API_KEY:', process.env.OPENAI_API_KEY.substring(0, 15) + '...');
        return; // Keep the existing API key
      }
      if (key === 'GROQ_API_KEY' && process.env.GROQ_API_KEY && !process.env.GROQ_API_KEY.startsWith('test-')) {
        console.log('🔒 Keeping existing GROQ_API_KEY:', process.env.GROQ_API_KEY.substring(0, 15) + '...');
        return; // Keep the existing API key
      }
      console.log(`🔧 Setting ${key} to:`, value);
      process.env[key] = value;
    });
  }

  /**
   * Restore original environment variables
   */
  static restoreEnvVars(originalEnv: NodeJS.ProcessEnv): void {
    Object.keys(process.env).forEach(key => {
      if (key.startsWith('OPENAI_') || key.startsWith('GROQ_') || key.startsWith('MONGODB_') || 
          key.startsWith('DEFAULT_') || key.startsWith('ENABLE_') || key.startsWith('MAX_') || 
          key.startsWith('PLANNER_')) {
        delete process.env[key];
      }
    });
    
    Object.assign(process.env, originalEnv);
  }
}
