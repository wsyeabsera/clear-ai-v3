/**
 * Benchmark Test: Performance Optimization
 * Tests the performance improvements implemented across all blueprints
 */

import { PlannerAgent } from '../../src/agents/planner/PlannerAgent';
import { ExecutionAgent } from '../../src/agents/executor/ExecutionAgent';
import { AnalyzerAgent } from '../../src/agents/analyzer/AnalyzerAgent';

describe('Performance Optimization Benchmark', () => {
  let plannerAgent: PlannerAgent;
  let executionAgent: ExecutionAgent;
  let analyzerAgent: AnalyzerAgent;

  beforeAll(async () => {
    plannerAgent = new PlannerAgent();
    executionAgent = new ExecutionAgent();
    analyzerAgent = new AnalyzerAgent();
  });

  describe('Plan Generation Performance', () => {
    test('Simple Query Performance', async () => {
      const query = 'List all shipments';
      const iterations = 5;
      const times: number[] = [];

      for (let i = 0; i < iterations; i++) {
        const startTime = Date.now();
        const planResponse = await plannerAgent.plan(query, 'groq');
        const endTime = Date.now();
        
        expect(planResponse.status).toBe('COMPLETED');
        times.push(endTime - startTime);
      }

      const averageTime = times.reduce((sum, time) => sum + time, 0) / times.length;
      const minTime = Math.min(...times);
      const maxTime = Math.max(...times);

      expect(averageTime).toBeLessThan(5000); // Target: <5s for simple queries
      expect(maxTime).toBeLessThan(10000); // No single query should take >10s

      console.log(`📊 Simple Query Performance:`);
      console.log(`  - Average: ${averageTime.toFixed(0)}ms`);
      console.log(`  - Min: ${minTime}ms`);
      console.log(`  - Max: ${maxTime}ms`);
    }, 60000);

    test('Complex Query Performance', async () => {
      const query = 'Get facility ABC123 and all its shipments with status active';
      const iterations = 3;
      const times: number[] = [];

      for (let i = 0; i < iterations; i++) {
        const startTime = Date.now();
        const planResponse = await plannerAgent.plan(query, 'groq');
        const endTime = Date.now();
        
        expect(planResponse.status).toBe('COMPLETED');
        times.push(endTime - startTime);
      }

      const averageTime = times.reduce((sum, time) => sum + time, 0) / times.length;
      const minTime = Math.min(...times);
      const maxTime = Math.max(...times);

      expect(averageTime).toBeLessThan(10000); // Target: <10s for complex queries
      expect(maxTime).toBeLessThan(15000); // No single query should take >15s

      console.log(`📊 Complex Query Performance:`);
      console.log(`  - Average: ${averageTime.toFixed(0)}ms`);
      console.log(`  - Min: ${minTime}ms`);
      console.log(`  - Max: ${maxTime}ms`);
    }, 90000);

    test('Concurrent Query Performance', async () => {
      const queries = [
        'List all shipments',
        'Get all facilities',
        'Show waste codes',
        'List inspections',
        'Get contracts'
      ];

      const startTime = Date.now();
      const promises = queries.map(query => plannerAgent.plan(query, 'groq'));
      const results = await Promise.all(promises);
      const endTime = Date.now();

      const totalTime = endTime - startTime;
      const averageTime = totalTime / queries.length;

      // All queries should complete successfully
      results.forEach(result => {
        expect(result.status).toBe('COMPLETED');
      });

      expect(averageTime).toBeLessThan(8000); // Target: <8s average for concurrent queries

      console.log(`📊 Concurrent Query Performance:`);
      console.log(`  - Total Time: ${totalTime}ms`);
      console.log(`  - Average per Query: ${averageTime.toFixed(0)}ms`);
      console.log(`  - Queries: ${queries.length}`);
    }, 120000);
  });

  describe('Data-Aware Planning Performance', () => {
    test('Data Assessment Performance', async () => {
      const queries = [
        'List shipments from last month',
        'Get facilities with specific type',
        'Find contracts expiring soon',
        'Show waste codes by category'
      ];

      const times: number[] = [];

      for (const query of queries) {
        const startTime = Date.now();
        const planResponse = await plannerAgent.plan(query, 'groq');
        const endTime = Date.now();
        
        expect(planResponse.status).toBe('COMPLETED');
        times.push(endTime - startTime);
      }

      const averageTime = times.reduce((sum, time) => sum + time, 0) / times.length;
      const maxTime = Math.max(...times);

      expect(averageTime).toBeLessThan(8000); // Target: <8s with data assessment
      expect(maxTime).toBeLessThan(12000); // No single query should take >12s

      console.log(`📊 Data-Aware Planning Performance:`);
      console.log(`  - Average: ${averageTime.toFixed(0)}ms`);
      console.log(`  - Max: ${maxTime}ms`);
    }, 120000);

    test('Smart Filter Generation Performance', async () => {
      const query = 'Find shipments with complex filters and date ranges';
      const iterations = 3;
      const times: number[] = [];

      for (let i = 0; i < iterations; i++) {
        const startTime = Date.now();
        const planResponse = await plannerAgent.plan(query, 'groq');
        const endTime = Date.now();
        
        expect(planResponse.status).toBe('COMPLETED');
        times.push(endTime - startTime);
      }

      const averageTime = times.reduce((sum, time) => sum + time, 0) / times.length;

      expect(averageTime).toBeLessThan(10000); // Target: <10s with smart filters

      console.log(`📊 Smart Filter Generation Performance:`);
      console.log(`  - Average: ${averageTime.toFixed(0)}ms`);
    }, 90000);
  });

  describe('Memory and Resource Usage', () => {
    test('Memory Usage During Planning', async () => {
      const initialMemory = process.memoryUsage();
      
      const queries = [
        'List all shipments',
        'Get all facilities',
        'Show waste codes',
        'List inspections',
        'Get contracts',
        'Find shipments from last week',
        'Get facilities by type',
        'Show waste codes by category',
        'List inspections by status',
        'Get contracts by client'
      ];

      for (const query of queries) {
        await plannerAgent.plan(query, 'groq');
      }

      const finalMemory = process.memoryUsage();
      const memoryIncrease = finalMemory.heapUsed - initialMemory.heapUsed;
      const memoryIncreaseMB = memoryIncrease / 1024 / 1024;

      // Memory increase should be reasonable (<100MB for 10 queries)
      expect(memoryIncreaseMB).toBeLessThan(100);

      console.log(`📊 Memory Usage:`);
      console.log(`  - Initial: ${(initialMemory.heapUsed / 1024 / 1024).toFixed(2)}MB`);
      console.log(`  - Final: ${(finalMemory.heapUsed / 1024 / 1024).toFixed(2)}MB`);
      console.log(`  - Increase: ${memoryIncreaseMB.toFixed(2)}MB`);
    }, 180000);

    test('Cache Performance', async () => {
      const query = 'List all shipments';
      
      // First call (cold cache)
      const startTime1 = Date.now();
      const planResponse1 = await plannerAgent.plan(query, 'groq');
      const endTime1 = Date.now();
      const coldTime = endTime1 - startTime1;

      // Second call (warm cache)
      const startTime2 = Date.now();
      const planResponse2 = await plannerAgent.plan(query, 'groq');
      const endTime2 = Date.now();
      const warmTime = endTime2 - startTime2;

      expect(planResponse1.status).toBe('COMPLETED');
      expect(planResponse2.status).toBe('COMPLETED');
      
      // Warm cache should be faster (though not always guaranteed with LLM calls)
      console.log(`📊 Cache Performance:`);
      console.log(`  - Cold Cache: ${coldTime}ms`);
      console.log(`  - Warm Cache: ${warmTime}ms`);
      console.log(`  - Improvement: ${((coldTime - warmTime) / coldTime * 100).toFixed(1)}%`);
    }, 60000);
  });

  describe('Error Recovery Performance', () => {
    test('Error Handling Performance', async () => {
      const problematicQueries = [
        'Get non-existent facility and its shipments',
        'Find shipments with invalid date range',
        'List entities with impossible filters'
      ];

      const times: number[] = [];

      for (const query of problematicQueries) {
        const startTime = Date.now();
        try {
          const planResponse = await plannerAgent.plan(query, 'groq');
          const endTime = Date.now();
          times.push(endTime - startTime);
          
          // Should handle gracefully, not crash
          expect(planResponse.plan).toBeDefined();
        } catch (error) {
          // If it throws, it should be handled gracefully
          const endTime = Date.now();
          times.push(endTime - startTime);
        }
      }

      const averageTime = times.reduce((sum, time) => sum + time, 0) / times.length;

      expect(averageTime).toBeLessThan(8000); // Target: <8s even for problematic queries

      console.log(`📊 Error Handling Performance:`);
      console.log(`  - Average: ${averageTime.toFixed(0)}ms`);
    }, 90000);
  });

  describe('Overall Performance Metrics', () => {
    test('Comprehensive Performance Test', async () => {
      const testSuite = [
        { name: 'Simple Query', query: 'List all shipments', targetTime: 5000 },
        { name: 'Complex Query', query: 'Get facility ABC123 and all its shipments', targetTime: 10000 },
        { name: 'Date Query', query: 'Find shipments from last month', targetTime: 8000 },
        { name: 'Filter Query', query: 'Get facilities with specific type', targetTime: 8000 },
        { name: 'Multi-Step Query', query: 'Get facility and its contracts and shipments', targetTime: 12000 }
      ];

      const results: Array<{ name: string; time: number; target: number; passed: boolean }> = [];

      for (const test of testSuite) {
        const startTime = Date.now();
        const planResponse = await plannerAgent.plan(test.query, 'groq');
        const endTime = Date.now();
        
        const executionTime = endTime - startTime;
        const passed = executionTime <= test.targetTime && planResponse.status === 'COMPLETED';
        
        results.push({
          name: test.name,
          time: executionTime,
          target: test.targetTime,
          passed
        });
      }

      const passedTests = results.filter(r => r.passed).length;
      const passRate = (passedTests / results.length) * 100;
      const averageTime = results.reduce((sum, r) => sum + r.time, 0) / results.length;

      expect(passRate).toBeGreaterThanOrEqual(80); // Target: 80%+ tests should pass
      expect(averageTime).toBeLessThan(10000); // Target: <10s average

      console.log(`📊 Comprehensive Performance Results:`);
      console.log(`  - Pass Rate: ${passRate.toFixed(1)}% (${passedTests}/${results.length})`);
      console.log(`  - Average Time: ${averageTime.toFixed(0)}ms`);
      console.log(`  - Individual Results:`);
      results.forEach(result => {
        const status = result.passed ? '✅' : '❌';
        console.log(`    ${status} ${result.name}: ${result.time}ms (target: ${result.target}ms)`);
      });
    }, 180000);
  });
});
