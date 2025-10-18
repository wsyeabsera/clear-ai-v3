// Integration tests for Planner Agent

import { TestUtils } from './test-utils';
import { LangChainPlannerAgent } from '../../../src/agents/planner/langchain-planner';
import { PlanStatus } from '../../../src/agents/planner/types';

describe('Planner Agent Integration Tests', () => {
  let plannerAgent: LangChainPlannerAgent;
  let originalEnv: NodeJS.ProcessEnv;

  beforeAll(async () => {
    // Save original environment
    originalEnv = { ...process.env };
    
    // Set up test environment
    TestUtils.setTestEnvVars();
    await TestUtils.setupTestDatabase();
    
    // Create planner agent instance
    plannerAgent = new LangChainPlannerAgent();
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

  describe('Plan Creation', () => {
    test('should create a plan for simple query', async () => {
      const query = 'List all shipments';
      
      const result = await plannerAgent.plan(query);
      
      expect(result).toBeDefined();
      expect(result.requestId).toBeDefined();
      expect(result.query).toBe(query);
      expect(result.plan).toBeDefined();
      expect(result.plan.steps).toBeInstanceOf(Array);
      expect(result.plan.metadata.query).toBe(query);
      expect(result.plan.metadata.requestId).toBe(result.requestId);
      expect(result.status).toBe(PlanStatus.COMPLETED);
      expect(result.createdAt).toBeDefined();
      expect(result.executionTimeMs).toBeGreaterThan(0);
    });

    test('should create a plan for complex query', async () => {
      const query = 'Get contaminated shipments from Berlin facilities from last week';
      
      const result = await plannerAgent.plan(query);
      
      expect(result).toBeDefined();
      expect(result.requestId).toBeDefined();
      expect(result.query).toBe(query);
      expect(result.plan).toBeDefined();
      expect(result.plan.steps.length).toBeGreaterThan(0);
      expect(result.status).toBe(PlanStatus.COMPLETED);
    });

    test('should handle different query types', async () => {
      const queries = TestUtils.getSampleQueries();
      
      for (const query of queries) {
        const result = await plannerAgent.plan(query);
        
        expect(result).toBeDefined();
        expect(result.requestId).toBeDefined();
        expect(result.query).toBe(query);
        expect(result.plan).toBeDefined();
        expect(result.status).toBe(PlanStatus.COMPLETED);
      }
    });

    test('should generate unique request IDs for different plans', async () => {
      const query1 = 'List all shipments';
      const query2 = 'Get all facilities';
      
      const result1 = await plannerAgent.plan(query1);
      const result2 = await plannerAgent.plan(query2);
      
      expect(result1.requestId).not.toBe(result2.requestId);
    });
  });

  describe('Plan Retrieval', () => {
    test('should retrieve plan by request ID', async () => {
      const query = 'List all shipments from last week';
      const result = await plannerAgent.plan(query);
      
      const retrievedPlan = await plannerAgent.getPlan(result.requestId);
      
      expect(retrievedPlan).toBeDefined();
      expect(retrievedPlan?.requestId).toBe(result.requestId);
      expect(retrievedPlan?.query).toBe(query);
      expect(retrievedPlan?.plan).toEqual(result.plan);
      expect(retrievedPlan?.status).toBe(result.status);
    });

    test('should return null for non-existent request ID', async () => {
      const nonExistentId = 'non-existent-id';
      
      const result = await plannerAgent.getPlan(nonExistentId);
      
      expect(result).toBeNull();
    });

    test('should retrieve multiple plans correctly', async () => {
      const queries = ['List all shipments', 'Get all facilities', 'Show waste codes'];
      const results = [];
      
      // Create multiple plans
      for (const query of queries) {
        const result = await plannerAgent.plan(query);
        results.push(result);
      }
      
      // Retrieve each plan
      for (const result of results) {
        const retrievedPlan = await plannerAgent.getPlan(result.requestId);
        expect(retrievedPlan).toBeDefined();
        expect(retrievedPlan?.requestId).toBe(result.requestId);
        expect(retrievedPlan?.query).toBe(result.query);
      }
    });
  });

  describe('Plan Statistics', () => {
    test('should return plan statistics', async () => {
      // Create some test plans
      await plannerAgent.plan('List all shipments');
      await plannerAgent.plan('Get all facilities');
      await plannerAgent.plan('Show waste codes');
      
      const statistics = await plannerAgent.getStatistics();
      
      expect(statistics).toBeDefined();
      expect(statistics.total).toBeGreaterThanOrEqual(3);
      expect(statistics.byStatus[PlanStatus.COMPLETED]).toBeGreaterThanOrEqual(3);
      expect(statistics.byStatus).toBeDefined();
      expect(statistics.byStatus[PlanStatus.COMPLETED]).toBeGreaterThanOrEqual(3);
      expect(statistics.byProvider).toBeDefined();
    });

    test('should handle empty statistics', async () => {
      const statistics = await plannerAgent.getStatistics();
      
      expect(statistics).toBeDefined();
      expect(statistics.total).toBe(0);
      expect(statistics.byStatus[PlanStatus.COMPLETED]).toBe(0);
      expect(statistics.byStatus[PlanStatus.FAILED]).toBe(0);
    });
  });

  describe('Recent Plans', () => {
    test('should return recent plans', async () => {
      // Create multiple plans
      const queries = ['List all shipments', 'Get all facilities', 'Show waste codes'];
      for (const query of queries) {
        await plannerAgent.plan(query);
      }
      
      const recentPlans = await plannerAgent.getRecentPlans(10);
      
      expect(recentPlans).toBeDefined();
      expect(recentPlans.length).toBeGreaterThanOrEqual(3);
      expect(recentPlans[0]).toHaveProperty('requestId');
      expect(recentPlans[0]).toHaveProperty('query');
      expect(recentPlans[0]).toHaveProperty('status');
      expect(recentPlans[0]).toHaveProperty('createdAt');
    });

    test('should respect limit parameter', async () => {
      // Create 5 plans
      for (let i = 0; i < 5; i++) {
        await plannerAgent.plan(`Query ${i}`);
      }
      
      const recentPlans = await plannerAgent.getRecentPlans(3);
      
      expect(recentPlans.length).toBeLessThanOrEqual(3);
    });
  });

  describe('Plan Deletion', () => {
    test('should delete plan successfully', async () => {
      const query = 'List all shipments';
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
  });

  describe('Error Handling', () => {
    test('should handle invalid queries gracefully', async () => {
      const invalidQuery = '';
      
      const result = await plannerAgent.plan(invalidQuery);
      
      expect(result).toBeDefined();
      expect(result.requestId).toBeDefined();
      expect(result.query).toBe(invalidQuery);
      // Should either complete or fail gracefully
      expect([PlanStatus.COMPLETED, PlanStatus.FAILED]).toContain(result.status);
    });

    test('should handle network errors gracefully', async () => {
      // This test would require mocking network failures
      // For now, we'll test that the agent doesn't crash
      const query = 'List all shipments';
      
      const result = await plannerAgent.plan(query);
      
      expect(result).toBeDefined();
      expect(result.requestId).toBeDefined();
    });
  });

  describe('MongoDB Persistence', () => {
    test('should persist plan to MongoDB', async () => {
      const query = 'List all shipments from last week';
      const result = await plannerAgent.plan(query);
      
      // Check if plan is persisted in MongoDB
      const persistedPlan = await TestUtils.getTestPlanRequest(result.requestId);
      
      expect(persistedPlan).toBeDefined();
      expect(persistedPlan?.requestId).toBe(result.requestId);
      expect(persistedPlan?.query).toBe(query);
      expect(persistedPlan?.plan).toBeDefined();
      expect(persistedPlan?.status).toBe(PlanStatus.COMPLETED);
    });

    test('should update plan status correctly', async () => {
      const query = 'List all shipments';
      const result = await plannerAgent.plan(query);
      
      // Verify initial status
      expect(result.status).toBe(PlanStatus.COMPLETED);
      
      // Check persisted status
      const persistedPlan = await TestUtils.getTestPlanRequest(result.requestId);
      expect(persistedPlan?.status).toBe(PlanStatus.COMPLETED);
    });
  });

  describe('Plan Structure Validation', () => {
    test('should generate valid plan structure', async () => {
      const query = 'List all shipments from last week';
      const result = await plannerAgent.plan(query);
      
      expect(result.plan).toBeDefined();
      expect(result.plan.steps).toBeInstanceOf(Array);
      expect(result.plan.metadata).toBeDefined();
      expect(result.plan.metadata.query).toBe(query);
      expect(result.plan.metadata.requestId).toBe(result.requestId);
      expect(result.plan.metadata.totalSteps).toBeGreaterThanOrEqual(0);
      expect(result.plan.metadata.parallelSteps).toBeGreaterThanOrEqual(0);
    });

    test('should have valid step structure', async () => {
      const query = 'List all shipments';
      const result = await plannerAgent.plan(query);
      
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
  });

  describe('Performance', () => {
    test('should complete plan creation within reasonable time', async () => {
      const query = 'List all shipments from last week';
      const startTime = Date.now();
      
      const result = await plannerAgent.plan(query);
      
      const endTime = Date.now();
      const executionTime = endTime - startTime;
      
      expect(result.executionTimeMs).toBeGreaterThan(0);
      expect(executionTime).toBeLessThan(30000); // Should complete within 30 seconds
    });

    test('should handle concurrent plan creation', async () => {
      const queries = ['List all shipments', 'Get all facilities', 'Show waste codes'];
      
      const startTime = Date.now();
      const promises = queries.map(query => plannerAgent.plan(query));
      const results = await Promise.all(promises);
      const endTime = Date.now();
      
      expect(results).toHaveLength(3);
      results.forEach(result => {
        expect(result).toBeDefined();
        expect(result.requestId).toBeDefined();
        expect(result.status).toBe(PlanStatus.COMPLETED);
      });
      
      const totalTime = endTime - startTime;
      expect(totalTime).toBeLessThan(60000); // Should complete within 60 seconds
    });
  });
});
