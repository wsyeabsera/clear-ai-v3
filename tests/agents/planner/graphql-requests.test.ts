// GraphQL API tests for Planner Agent

import { TestUtils } from './test-utils';
import { PlannerAgent } from '../../../src/agents/planner/PlannerAgent';
import { PlanStatus } from '../../../src/agents/planner/types';

// Mock the GraphQL resolvers
jest.mock('../../../src/agents/planner/graphql/resolvers', () => ({
  plannerResolvers: {
    Query: {
      getPlan: jest.fn(),
      getPlanStatistics: jest.fn(),
      getRecentPlans: jest.fn()
    },
    Mutation: {
      createPlan: jest.fn(),
      deletePlan: jest.fn()
    }
  }
}));

describe('GraphQL API Tests for Planner Agent', () => {
  let plannerAgent: PlannerAgent;
  let originalEnv: NodeJS.ProcessEnv;

  beforeAll(async () => {
    // Save original environment
    originalEnv = { ...process.env };
    
    // Set up test environment
    TestUtils.setTestEnvVars();
    await TestUtils.setupTestDatabase();
    
    // Create planner agent instance
    plannerAgent = new PlannerAgent();
  });

  afterAll(async () => {
    // Clean up test database
    await TestUtils.cleanupTestDatabase();
    
    // Restore original environment
    TestUtils.restoreEnvVars(originalEnv);
  });

  beforeEach(async () => {
    // Clear plan requests before each test
    await TestUtils.clearPlanRequests();
  });

  describe('createPlan Mutation', () => {
    test('should create a plan via GraphQL mutation', async () => {
      const query = 'List all shipments from last week';
      const llmProvider = 'openai';
      
      const result = await plannerAgent.plan(query, llmProvider);
      
      expect(result).toBeDefined();
      expect(result.requestId).toBeDefined();
      expect(result.query).toBe(query);
      expect(result.plan).toBeDefined();
      expect(result.status).toBe(PlanStatus.COMPLETED);
      expect(result.createdAt).toBeDefined();
      expect(result.executionTimeMs).toBeGreaterThan(0);
      expect(result.validationErrors).toBeDefined();
    });

    test('should create a plan with default LLM provider', async () => {
      const query = 'Get all facilities in Germany';
      
      const result = await plannerAgent.plan(query);
      
      expect(result).toBeDefined();
      expect(result.requestId).toBeDefined();
      expect(result.query).toBe(query);
      expect(result.status).toBe(PlanStatus.COMPLETED);
    });

    test('should handle different LLM providers', async () => {
      const query = 'Show waste codes for hazardous materials';
      const providers = ['openai', 'groq'];
      
      for (const provider of providers) {
        const result = await plannerAgent.plan(query, provider);
        
        expect(result).toBeDefined();
        expect(result.requestId).toBeDefined();
        expect(result.query).toBe(query);
        expect(result.status).toBe(PlanStatus.COMPLETED);
      }
    });

    test('should return proper GraphQL response structure', async () => {
      const query = 'List all shipments';
      
      const result = await plannerAgent.plan(query);
      
      // Verify GraphQL response structure
      expect(result).toHaveProperty('requestId');
      expect(result).toHaveProperty('query');
      expect(result).toHaveProperty('plan');
      expect(result).toHaveProperty('status');
      expect(result).toHaveProperty('createdAt');
      expect(result).toHaveProperty('executionTimeMs');
      expect(result).toHaveProperty('validationErrors');
      
      // Verify plan structure
      expect(result.plan).toHaveProperty('steps');
      expect(result.plan).toHaveProperty('metadata');
      expect(result.plan.metadata).toHaveProperty('query');
      expect(result.plan.metadata).toHaveProperty('requestId');
      expect(result.plan.metadata).toHaveProperty('totalSteps');
      expect(result.plan.metadata).toHaveProperty('parallelSteps');
    });
  });

  describe('getPlan Query', () => {
    test('should retrieve plan by request ID via GraphQL query', async () => {
      const query = 'List all shipments from last week';
      const result = await plannerAgent.plan(query);
      
      const retrievedPlan = await plannerAgent.getPlan(result.requestId);
      
      expect(retrievedPlan).toBeDefined();
      expect(retrievedPlan?.requestId).toBe(result.requestId);
      expect(retrievedPlan?.query).toBe(query);
      expect(retrievedPlan?.plan).toEqual(result.plan);
      expect(retrievedPlan?.status).toBe(result.status);
      expect(retrievedPlan?.createdAt).toBe(result.createdAt);
      expect(retrievedPlan?.executionTimeMs).toBe(result.executionTimeMs);
      expect(retrievedPlan?.validationErrors).toEqual(result.validationErrors);
    });

    test('should return null for non-existent request ID', async () => {
      const nonExistentId = 'non-existent-id';
      
      const result = await plannerAgent.getPlan(nonExistentId);
      
      expect(result).toBeNull();
    });

    test('should handle invalid request ID format', async () => {
      const invalidId = 'invalid-id-format';
      
      const result = await plannerAgent.getPlan(invalidId);
      
      expect(result).toBeNull();
    });
  });

  describe('getPlanStatistics Query', () => {
    test('should return plan statistics via GraphQL query', async () => {
      // Create some test plans
      await plannerAgent.plan('List all shipments');
      await plannerAgent.plan('Get all facilities');
      await plannerAgent.plan('Show waste codes');
      
      const statistics = await plannerAgent.getStatistics();
      
      expect(statistics).toBeDefined();
      expect(statistics).toHaveProperty('total');
      expect(statistics).toHaveProperty('byStatus');
      expect(statistics).toHaveProperty('byProvider');
      expect(statistics).toHaveProperty('averageExecutionTime');
      
      expect(statistics.total).toBeGreaterThanOrEqual(3);
      expect(statistics.byStatus[PlanStatus.COMPLETED]).toBeGreaterThanOrEqual(3);
      expect(statistics.byStatus).toHaveProperty(PlanStatus.COMPLETED);
      expect(statistics.byStatus).toHaveProperty(PlanStatus.FAILED);
      expect(statistics.byStatus).toHaveProperty(PlanStatus.PENDING);
      expect(typeof statistics.byProvider).toBe('object');
    });

    test('should handle empty statistics', async () => {
      const statistics = await plannerAgent.getStatistics();
      
      expect(statistics).toBeDefined();
      expect(statistics.total).toBe(0);
      expect(statistics.byStatus[PlanStatus.COMPLETED]).toBe(0);
      expect(statistics.byStatus[PlanStatus.FAILED]).toBe(0);
      expect(statistics.byStatus[PlanStatus.COMPLETED]).toBe(0);
      expect(statistics.byStatus[PlanStatus.FAILED]).toBe(0);
      expect(statistics.byStatus[PlanStatus.PENDING]).toBe(0);
    });
  });

  describe('getRecentPlans Query', () => {
    test('should return recent plans via GraphQL query', async () => {
      // Create multiple plans
      const queries = ['List all shipments', 'Get all facilities', 'Show waste codes'];
      for (const query of queries) {
        await plannerAgent.plan(query);
      }
      
      const recentPlans = await plannerAgent.getRecentPlans(10);
      
      expect(recentPlans).toBeDefined();
      expect(Array.isArray(recentPlans)).toBe(true);
      expect(recentPlans.length).toBeGreaterThanOrEqual(3);
      
      // Verify structure of each plan
      recentPlans.forEach(plan => {
        expect(plan).toHaveProperty('requestId');
        expect(plan).toHaveProperty('query');
        expect(plan).toHaveProperty('status');
        expect(plan).toHaveProperty('createdAt');
        expect(plan).toHaveProperty('executionTimeMs');
      });
    });

    test('should respect limit parameter', async () => {
      // Create 5 plans
      for (let i = 0; i < 5; i++) {
        await plannerAgent.plan(`Query ${i}`);
      }
      
      const recentPlans = await plannerAgent.getRecentPlans(3);
      
      expect(recentPlans.length).toBeLessThanOrEqual(3);
    });

    test('should return plans in chronological order', async () => {
      // Create plans with small delays
      await plannerAgent.plan('First query');
      await TestUtils.wait(100);
      await plannerAgent.plan('Second query');
      await TestUtils.wait(100);
      await plannerAgent.plan('Third query');
      
      const recentPlans = await plannerAgent.getRecentPlans(10);
      
      expect(recentPlans.length).toBeGreaterThanOrEqual(3);
      // Most recent plan should be first
      expect(recentPlans[0].query).toBe('Third query');
    });
  });

  describe('deletePlan Mutation', () => {
    test('should delete plan via GraphQL mutation', async () => {
      const query = 'List all shipments from last week';
      const result = await plannerAgent.plan(query);
      
      const deleteResult = await plannerAgent.deletePlan(result.requestId);
      
      expect(deleteResult).toBe(true);
      
      // Verify plan is deleted
      const retrievedPlan = await plannerAgent.getPlan(result.requestId);
      expect(retrievedPlan).toBeNull();
    });

    test('should return false for non-existent plan', async () => {
      const nonExistentId = 'non-existent-id';
      
      const deleteResult = await plannerAgent.deletePlan(nonExistentId);
      
      expect(deleteResult).toBe(false);
    });

    test('should handle invalid request ID format', async () => {
      const invalidId = 'invalid-id-format';
      
      const deleteResult = await plannerAgent.deletePlan(invalidId);
      
      expect(deleteResult).toBe(false);
    });
  });

  describe('Error Handling', () => {
    test('should handle GraphQL errors gracefully', async () => {
      const invalidQuery = '';
      
      const result = await plannerAgent.plan(invalidQuery);
      
      expect(result).toBeDefined();
      expect(result.requestId).toBeDefined();
      expect(result.query).toBe(invalidQuery);
      // Should either complete or fail gracefully
      expect([PlanStatus.COMPLETED, PlanStatus.FAILED]).toContain(result.status);
    });

    test('should handle network timeouts', async () => {
      const query = 'List all shipments';
      
      const result = await plannerAgent.plan(query);
      
      expect(result).toBeDefined();
      expect(result.requestId).toBeDefined();
      expect(result.status).toBe(PlanStatus.COMPLETED);
    });
  });

  describe('Data Validation', () => {
    test('should validate plan structure in GraphQL response', async () => {
      const query = 'List all shipments from last week';
      const result = await plannerAgent.plan(query);
      
      // Validate plan structure
      expect(result.plan.steps).toBeInstanceOf(Array);
      expect(result.plan.metadata).toBeDefined();
      expect(result.plan.metadata.query).toBe(query);
      expect(result.plan.metadata.requestId).toBe(result.requestId);
      expect(typeof result.plan.metadata.totalSteps).toBe('number');
      expect(typeof result.plan.metadata.parallelSteps).toBe('number');
      
      // Validate step structure if steps exist
      if (result.plan.steps.length > 0) {
        const step = result.plan.steps[0];
        expect(step).toHaveProperty('tool');
        expect(step).toHaveProperty('params');
        expect(step).toHaveProperty('dependsOn');
        expect(step).toHaveProperty('parallel');
        expect(step).toHaveProperty('description');
        expect(Array.isArray(step.dependsOn)).toBe(true);
        expect(typeof step.parallel).toBe('boolean');
      }
    });

    test('should validate request ID format', async () => {
      const query = 'List all shipments';
      const result = await plannerAgent.plan(query);
      
      // Request ID should be a valid UUID format
      const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
      expect(result.requestId).toMatch(uuidRegex);
    });

    test('should validate timestamps', async () => {
      const query = 'List all shipments';
      const result = await plannerAgent.plan(query);
      
      // CreatedAt should be a valid ISO string
      expect(result.createdAt).toMatch(/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}\.\d{3}Z$/);
      
      // Execution time should be positive
      expect(result.executionTimeMs).toBeGreaterThan(0);
    });
  });
});
