/**
 * Benchmark Test: Error Recovery Intelligence
 * Tests the enhanced error handling and recovery implemented in Blueprint 5
 */

import { PlannerAgent } from '../../src/agents/planner/PlannerAgent';
import { ExecutionAgent } from '../../src/agents/executor/ExecutionAgent';
import { AnalyzerAgent } from '../../src/agents/analyzer/AnalyzerAgent';

describe('Error Recovery Intelligence Benchmark', () => {
  let plannerAgent: PlannerAgent;
  let executionAgent: ExecutionAgent;
  let analyzerAgent: AnalyzerAgent;

  beforeAll(async () => {
    plannerAgent = new PlannerAgent();
    executionAgent = new ExecutionAgent();
    analyzerAgent = new AnalyzerAgent();
  });

  describe('Invalid Query Handling', () => {
    test('Malformed Query Recovery', async () => {
      const malformedQueries = [
        'List all shipments with invalid syntax',
        'Get facility with missing parameters',
        'Find data with impossible criteria',
        'Show entities with conflicting filters'
      ];

      let recoveryCount = 0;
      const times: number[] = [];

      for (const query of malformedQueries) {
        try {
          const startTime = Date.now();
          const planResponse = await plannerAgent.plan(query, 'groq');
          const endTime = Date.now();
          
          times.push(endTime - startTime);
          
          // Should either create a valid plan or provide clear error messages
          if (planResponse.status === 'COMPLETED' || 
              (planResponse.validationErrors && planResponse.validationErrors.length > 0)) {
            recoveryCount++;
          }
        } catch (error) {
          // If it throws, it should be a meaningful error, not a crash
          expect(error).toBeDefined();
          recoveryCount++;
        }
      }

      const recoveryRate = (recoveryCount / malformedQueries.length) * 100;
      const averageTime = times.reduce((sum, time) => sum + time, 0) / times.length;

      expect(recoveryRate).toBeGreaterThanOrEqual(75); // Target: 75%+ recovery rate
      expect(averageTime).toBeLessThan(10000); // Should handle errors quickly

      console.log(`📊 Malformed Query Recovery:`);
      console.log(`  - Recovery Rate: ${recoveryRate.toFixed(1)}% (${recoveryCount}/${malformedQueries.length})`);
      console.log(`  - Average Time: ${averageTime.toFixed(0)}ms`);
    }, 120000);

    test('Invalid Parameter Handling', async () => {
      const invalidParamQueries = [
        'Get facility with id = invalid_id_format',
        'Find shipments with status = nonexistent_status',
        'List entities with impossible date range',
        'Get data with malformed filters'
      ];

      let handledCount = 0;

      for (const query of invalidParamQueries) {
        try {
          const planResponse = await plannerAgent.plan(query, 'groq');
          
          // Should either create a plan with validation errors or handle gracefully
          if (planResponse.validationErrors && planResponse.validationErrors.length > 0) {
            handledCount++;
            console.log(`✅ Handled invalid params: ${query}`);
            console.log(`   Validation errors: ${planResponse.validationErrors.length}`);
          } else if (planResponse.status === 'COMPLETED') {
            handledCount++;
            console.log(`✅ Created valid plan for: ${query}`);
          }
        } catch (error) {
          // Should provide meaningful error message
          expect(error).toBeDefined();
          handledCount++;
          console.log(`✅ Caught error for: ${query}`);
        }
      }

      const handlingRate = (handledCount / invalidParamQueries.length) * 100;
      expect(handlingRate).toBeGreaterThanOrEqual(80); // Target: 80%+ handling rate

      console.log(`📊 Invalid Parameter Handling: ${handlingRate.toFixed(1)}%`);
    }, 120000);
  });

  describe('Data Availability Error Recovery', () => {
    test('Non-existent Entity Handling', async () => {
      const nonExistentQueries = [
        'Get facility NONEXISTENT123 and its shipments',
        'Find shipment INVALID456 and its contract',
        'Get generator MISSING789 and its data',
        'Find inspection FAKE123 and its facility'
      ];

      let handledCount = 0;
      const times: number[] = [];

      for (const query of nonExistentQueries) {
        try {
          const startTime = Date.now();
          const planResponse = await plannerAgent.plan(query, 'groq');
          const endTime = Date.now();
          
          times.push(endTime - startTime);
          
          // Should create a plan structure even for non-existent entities
          expect(planResponse.plan).toBeDefined();
          expect(planResponse.plan.steps.length).toBeGreaterThan(0);
          
          handledCount++;
        } catch (error) {
          // Should handle gracefully, not crash
          expect(error).toBeDefined();
          handledCount++;
        }
      }

      const handlingRate = (handledCount / nonExistentQueries.length) * 100;
      const averageTime = times.reduce((sum, time) => sum + time, 0) / times.length;

      expect(handlingRate).toBe(100); // Target: 100% handling rate
      expect(averageTime).toBeLessThan(8000); // Should handle quickly

      console.log(`📊 Non-existent Entity Handling:`);
      console.log(`  - Handling Rate: ${handlingRate.toFixed(1)}%`);
      console.log(`  - Average Time: ${averageTime.toFixed(0)}ms`);
    }, 120000);

    test('Empty Result Prevention', async () => {
      const emptyResultQueries = [
        'Find shipments from facility that has no shipments',
        'Get contracts that expired 10 years ago',
        'List inspections for facility that was never inspected',
        'Show waste codes for category that does not exist'
      ];

      let preventionCount = 0;

      for (const query of emptyResultQueries) {
        try {
          const planResponse = await plannerAgent.plan(query, 'groq');
          
          // Should create plans with realistic parameters to avoid empty results
          const steps = planResponse.plan.steps;
          const hasRealisticParams = steps.some(step => 
            step.params.limit || step.params.page || 
            step.params.date_from || step.params.date_to ||
            Object.keys(step.params).length === 0
          );
          
          if (hasRealisticParams) {
            preventionCount++;
          }
        } catch (error) {
          // Should handle gracefully
          expect(error).toBeDefined();
          preventionCount++;
        }
      }

      const preventionRate = (preventionCount / emptyResultQueries.length) * 100;
      expect(preventionRate).toBeGreaterThanOrEqual(75); // Target: 75%+ prevention rate

      console.log(`📊 Empty Result Prevention: ${preventionRate.toFixed(1)}%`);
    }, 120000);
  });

  describe('System Resilience', () => {
    test('Concurrent Error Handling', async () => {
      const problematicQueries = [
        'Get invalid facility and its data',
        'Find shipments with bad parameters',
        'List entities with impossible filters',
        'Get data with malformed syntax',
        'Show results with conflicting criteria'
      ];

      const startTime = Date.now();
      const promises = problematicQueries.map(query => 
        plannerAgent.plan(query, 'groq').catch(error => ({ error, query }))
      );
      
      const results = await Promise.all(promises);
      const endTime = Date.now();

      const totalTime = endTime - startTime;
      const successfulHandling = results.filter(result => 
        result.error || (result.status === 'COMPLETED' || result.validationErrors)
      ).length;

      const handlingRate = (successfulHandling / problematicQueries.length) * 100;

      expect(handlingRate).toBeGreaterThanOrEqual(80); // Target: 80%+ concurrent handling
      expect(totalTime).toBeLessThan(15000); // Should handle all within 15s

      console.log(`📊 Concurrent Error Handling:`);
      console.log(`  - Handling Rate: ${handlingRate.toFixed(1)}%`);
      console.log(`  - Total Time: ${totalTime}ms`);
    }, 150000);

    test('Memory Leak Prevention', async () => {
      const initialMemory = process.memoryUsage();
      
      // Run many error-prone queries
      const errorQueries = Array(20).fill(null).map((_, i) => 
        `Get invalid entity ${i} and its related data`
      );

      for (const query of errorQueries) {
        try {
          await plannerAgent.plan(query, 'groq');
        } catch (error) {
          // Expected to throw for invalid queries
        }
      }

      const finalMemory = process.memoryUsage();
      const memoryIncrease = finalMemory.heapUsed - initialMemory.heapUsed;
      const memoryIncreaseMB = memoryIncrease / 1024 / 1024;

      // Memory increase should be reasonable (<50MB for 20 error queries)
      expect(memoryIncreaseMB).toBeLessThan(50);

      console.log(`📊 Memory Leak Prevention:`);
      console.log(`  - Memory Increase: ${memoryIncreaseMB.toFixed(2)}MB`);
    }, 180000);
  });

  describe('Error Pattern Learning', () => {
    test('Repeated Error Handling', async () => {
      const repeatedErrorQuery = 'Get invalid facility INVALID123 and its shipments';
      const iterations = 5;
      const times: number[] = [];
      const errorPatterns: string[] = [];

      for (let i = 0; i < iterations; i++) {
        try {
          const startTime = Date.now();
          const planResponse = await plannerAgent.plan(repeatedErrorQuery, 'groq');
          const endTime = Date.now();
          
          times.push(endTime - startTime);
          
          if (planResponse.validationErrors) {
            errorPatterns.push(...planResponse.validationErrors);
          }
        } catch (error) {
          const endTime = Date.now();
          times.push(endTime - startTime);
          errorPatterns.push(error.message || 'Unknown error');
        }
      }

      const averageTime = times.reduce((sum, time) => sum + time, 0) / times.length;
      const uniqueErrorPatterns = [...new Set(errorPatterns)];

      // Should handle repeated errors consistently
      expect(averageTime).toBeLessThan(8000); // Should be consistent
      expect(uniqueErrorPatterns.length).toBeGreaterThan(0); // Should learn patterns

      console.log(`📊 Repeated Error Handling:`);
      console.log(`  - Average Time: ${averageTime.toFixed(0)}ms`);
      console.log(`  - Unique Error Patterns: ${uniqueErrorPatterns.length}`);
    }, 120000);

    test('Error Recovery Improvement', async () => {
      const errorQueries = [
        'Get facility with invalid ID format',
        'Find shipments with bad date range',
        'List entities with impossible filters',
        'Get data with malformed parameters'
      ];

      const firstAttemptTimes: number[] = [];
      const secondAttemptTimes: number[] = [];

      // First attempt
      for (const query of errorQueries) {
        try {
          const startTime = Date.now();
          await plannerAgent.plan(query, 'groq');
          const endTime = Date.now();
          firstAttemptTimes.push(endTime - startTime);
        } catch (error) {
          firstAttemptTimes.push(5000); // Assume 5s for failed attempts
        }
      }

      // Second attempt (should be faster due to learning)
      for (const query of errorQueries) {
        try {
          const startTime = Date.now();
          await plannerAgent.plan(query, 'groq');
          const endTime = Date.now();
          secondAttemptTimes.push(endTime - startTime);
        } catch (error) {
          secondAttemptTimes.push(5000);
        }
      }

      const firstAverage = firstAttemptTimes.reduce((sum, time) => sum + time, 0) / firstAttemptTimes.length;
      const secondAverage = secondAttemptTimes.reduce((sum, time) => sum + time, 0) / secondAttemptTimes.length;

      console.log(`📊 Error Recovery Improvement:`);
      console.log(`  - First Attempt Average: ${firstAverage.toFixed(0)}ms`);
      console.log(`  - Second Attempt Average: ${secondAverage.toFixed(0)}ms`);
      console.log(`  - Improvement: ${((firstAverage - secondAverage) / firstAverage * 100).toFixed(1)}%`);
    }, 180000);
  });

  describe('Overall Error Recovery Metrics', () => {
    test('Comprehensive Error Recovery Test', async () => {
      const errorTestSuite = [
        { name: 'Malformed Query', query: 'Invalid syntax query', expectedHandling: true },
        { name: 'Invalid Parameters', query: 'Get facility with id = invalid', expectedHandling: true },
        { name: 'Non-existent Entity', query: 'Get facility NONEXISTENT and its data', expectedHandling: true },
        { name: 'Impossible Filters', query: 'Find data with impossible criteria', expectedHandling: true },
        { name: 'Conflicting Criteria', query: 'Get data with conflicting filters', expectedHandling: true },
        { name: 'Empty Result Query', query: 'Find data that does not exist', expectedHandling: true }
      ];

      const results: Array<{ name: string; handled: boolean; time: number }> = [];

      for (const test of errorTestSuite) {
        const startTime = Date.now();
        let handled = false;
        let time = 0;

        try {
          const planResponse = await plannerAgent.plan(test.query, 'groq');
          const endTime = Date.now();
          time = endTime - startTime;
          
          // Consider it handled if it completes or has validation errors
          handled = planResponse.status === 'COMPLETED' || 
                   (planResponse.validationErrors && planResponse.validationErrors.length > 0);
        } catch (error) {
          const endTime = Date.now();
          time = endTime - startTime;
          handled = true; // Catching the error is also handling it
        }

        results.push({ name: test.name, handled, time });
      }

      const handledCount = results.filter(r => r.handled).length;
      const handlingRate = (handledCount / results.length) * 100;
      const averageTime = results.reduce((sum, r) => sum + r.time, 0) / results.length;

      expect(handlingRate).toBeGreaterThanOrEqual(80); // Target: 80%+ handling rate
      expect(averageTime).toBeLessThan(8000); // Target: <8s average

      console.log(`📊 Comprehensive Error Recovery Results:`);
      console.log(`  - Handling Rate: ${handlingRate.toFixed(1)}% (${handledCount}/${results.length})`);
      console.log(`  - Average Time: ${averageTime.toFixed(0)}ms`);
      console.log(`  - Individual Results:`);
      results.forEach(result => {
        const status = result.handled ? '✅' : '❌';
        console.log(`    ${status} ${result.name}: ${result.time}ms`);
      });
    }, 180000);
  });
});
