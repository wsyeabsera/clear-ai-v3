/**
 * Benchmark Test: Data Joining Intelligence
 * Tests the enhanced data joining capabilities implemented in Blueprint 1
 */

import { PlannerAgent } from '../../src/agents/planner/PlannerAgent';
import { ExecutionAgent } from '../../src/agents/executor/ExecutionAgent';
import { AnalyzerAgent } from '../../src/agents/analyzer/AnalyzerAgent';

describe('Data Joining Intelligence Benchmark', () => {
  let plannerAgent: PlannerAgent;
  let executionAgent: ExecutionAgent;
  let analyzerAgent: AnalyzerAgent;

  beforeAll(async () => {
    plannerAgent = new PlannerAgent();
    executionAgent = new ExecutionAgent();
    analyzerAgent = new AnalyzerAgent();
  });

  describe('Multi-Step Data Joining Tests', () => {
    const dataJoiningQueries = [
      {
        name: 'Facility to Shipments Join',
        query: 'Get facility ABC123 and all its shipments',
        expectedSteps: 2,
        expectedJoinType: 'facility_to_shipments'
      },
      {
        name: 'Shipment to Contract Join',
        query: 'Find shipment 12345 and its associated contract',
        expectedSteps: 2,
        expectedJoinType: 'shipment_to_contract'
      },
      {
        name: 'Complex Multi-Entity Join',
        query: 'Get facility ABC123, its shipments, and their waste compositions',
        expectedSteps: 3,
        expectedJoinType: 'facility_shipments_waste'
      },
      {
        name: 'Generator to Shipments Join',
        query: 'Find waste generator XYZ789 and all shipments from that generator',
        expectedSteps: 2,
        expectedJoinType: 'generator_to_shipments'
      },
      {
        name: 'Inspection to Facility Join',
        query: 'Get inspection 45678 and the facility it was performed on',
        expectedSteps: 2,
        expectedJoinType: 'inspection_to_facility'
      }
    ];

    dataJoiningQueries.forEach(({ name, query, expectedSteps, expectedJoinType }) => {
      test(`${name} - Plan Generation`, async () => {
        const startTime = Date.now();
        
        const planResponse = await plannerAgent.plan(query, 'groq');
        const planTime = Date.now() - startTime;

        expect(planResponse.plan).toBeDefined();
        expect(planResponse.plan.steps.length).toBeGreaterThanOrEqual(expectedSteps);
        expect(planResponse.status).toBe('COMPLETED');
        expect(planTime).toBeLessThan(10000); // Should complete within 10s

        // Check for proper dependency chain
        const steps = planResponse.plan.steps;
        for (let i = 1; i < steps.length; i++) {
          expect(steps[i].dependsOn.length).toBeGreaterThan(0);
          expect(steps[i].dependsOn[0]).toBeLessThan(i);
        }

        console.log(`✅ ${name}: ${steps.length} steps, ${planTime}ms`);
      }, 30000);

      test(`${name} - Parameter Resolution`, async () => {
        const planResponse = await plannerAgent.plan(query, 'groq');
        const steps = planResponse.plan.steps;

        // Check for proper variable references
        const hasVariableReferences = steps.some(step => 
          JSON.stringify(step.params).includes('${step_')
        );
        expect(hasVariableReferences).toBe(true);

        // Check for proper parameter types
        steps.forEach(step => {
          expect(step.params).toBeDefined();
          expect(typeof step.params).toBe('object');
        });

        console.log(`✅ ${name}: Parameter resolution working`);
      }, 30000);
    });
  });

  describe('Parameter Resolution Intelligence', () => {
    test('Array Indexing Validation', async () => {
      const query = 'Get first facility and its shipments';
      const planResponse = await plannerAgent.plan(query, 'groq');
      
      const steps = planResponse.plan.steps;
      const hasArrayIndexing = steps.some(step => 
        JSON.stringify(step.params).includes('[0]')
      );
      
      expect(hasArrayIndexing).toBe(true);
      console.log('✅ Array indexing validation working');
    }, 30000);

    test('Type Checking and Validation', async () => {
      const query = 'Get facility by ID and find shipments with specific status';
      const planResponse = await plannerAgent.plan(query, 'groq');
      
      expect(planResponse.validationErrors).toBeDefined();
      expect(Array.isArray(planResponse.validationErrors)).toBe(true);
      
      console.log(`✅ Type checking: ${planResponse.validationErrors.length} validation errors`);
    }, 30000);

    test('Fallback Strategy Handling', async () => {
      const query = 'Get non-existent facility and its shipments';
      const planResponse = await plannerAgent.plan(query, 'groq');
      
      // Should still create a valid plan structure
      expect(planResponse.plan).toBeDefined();
      expect(planResponse.plan.steps.length).toBeGreaterThan(0);
      
      console.log('✅ Fallback strategy handling working');
    }, 30000);
  });

  describe('Join Success Rate Measurement', () => {
    test('Overall Join Success Rate', async () => {
      const queries = [
        'Get facility ABC123 and its shipments',
        'Find shipment 12345 and its contract',
        'Get generator XYZ789 and its shipments',
        'Find inspection 45678 and its facility',
        'Get facility DEF456 and its contracts'
      ];

      let successCount = 0;
      let totalTime = 0;

      for (const query of queries) {
        try {
          const startTime = Date.now();
          const planResponse = await plannerAgent.plan(query, 'groq');
          const planTime = Date.now() - startTime;
          
          totalTime += planTime;
          
          if (planResponse.status === 'COMPLETED' && planResponse.plan.steps.length > 1) {
            successCount++;
          }
        } catch (error) {
          console.error(`Query failed: ${query}`, error);
        }
      }

      const successRate = (successCount / queries.length) * 100;
      const averageTime = totalTime / queries.length;

      expect(successRate).toBeGreaterThanOrEqual(80); // Target: 90%+
      expect(averageTime).toBeLessThan(10000); // Target: <10s

      console.log(`📊 Join Success Rate: ${successRate.toFixed(1)}% (${successCount}/${queries.length})`);
      console.log(`📊 Average Plan Time: ${averageTime.toFixed(0)}ms`);
    }, 120000);
  });

  describe('Error Handling and Recovery', () => {
    test('Invalid Parameter Handling', async () => {
      const query = 'Get facility with invalid parameters';
      const planResponse = await plannerAgent.plan(query, 'groq');
      
      // Should handle gracefully
      expect(planResponse.plan).toBeDefined();
      expect(planResponse.validationErrors).toBeDefined();
      
      console.log('✅ Invalid parameter handling working');
    }, 30000);

    test('Missing Data Handling', async () => {
      const query = 'Get non-existent entity and its related data';
      const planResponse = await plannerAgent.plan(query, 'groq');
      
      // Should create plan but handle missing data gracefully
      expect(planResponse.plan).toBeDefined();
      
      console.log('✅ Missing data handling working');
    }, 30000);
  });
});
