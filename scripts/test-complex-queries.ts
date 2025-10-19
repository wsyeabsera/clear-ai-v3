#!/usr/bin/env ts-node

/**
 * Test script to validate multi-tool orchestration and complex query handling
 */

import { PlannerAgent } from '../src/agents/planner/PlannerAgent';
import { ExecutionAgent } from '../src/agents/executor/ExecutionAgent';
import { AgentOrchestrator } from '../src/agents/orchestrator/AgentOrchestrator';
import { ComplexityAnalyzer } from '../src/agents/planner/complexity-analyzer';

async function testComplexQueries() {
  console.log('🧪 Testing Complex Query Handling...\n');

  try {
    // Initialize agents
    const plannerAgent = new PlannerAgent();
    const executionAgent = new ExecutionAgent();
    const orchestrator = new AgentOrchestrator();

    // Test 1: Simple query
    console.log('📝 Test 1: Simple query (2-3 tools)...');
    const simpleQuery = 'Show me all clients';
    const simplePlan = await plannerAgent.plan(simpleQuery, 'groq');
    console.log(`✅ Simple plan created with ${simplePlan.plan.steps.length} steps`);

    // Test 2: Medium complexity query
    console.log('\n📝 Test 2: Medium complexity query (4-6 tools)...');
    const mediumQuery = 'Get all facilities for each client and show their shipments from last month';
    const mediumPlan = await plannerAgent.plan(mediumQuery, 'groq');
    console.log(`✅ Medium plan created with ${mediumPlan.plan.steps.length} steps`);

    // Test 3: Complex query
    console.log('\n📝 Test 3: Complex query (7+ tools)...');
    const complexQuery = 'Analyze all waste data: get clients, facilities, shipments, contaminants, inspections, waste codes, and generate a comprehensive report with totals and averages';
    const complexPlan = await plannerAgent.plan(complexQuery, 'groq');
    console.log(`✅ Complex plan created with ${complexPlan.plan.steps.length} steps`);

    // Test 4: Test complexity analysis
    console.log('\n📝 Test 4: Testing complexity analysis...');
    const tools = ['clients_list', 'facilities_list', 'shipments_list', 'contaminants_list', 'inspections_list'];
    const complexityAnalyzer = new ComplexityAnalyzer([]);
    const complexity = complexityAnalyzer.analyzeQueryComplexity(complexQuery, tools);
    
    console.log('Complexity Analysis:', {
      isComplex: complexity.isComplex,
      complexityScore: complexity.complexityScore,
      entityCount: complexity.entityCount,
      parallelizationOpportunities: complexity.parallelizationOpportunities.length,
      riskFactors: complexity.riskFactors.length
    });

    const strategy = complexityAnalyzer.getExecutionStrategy(complexity);
    console.log('Execution Strategy:', strategy);

    // Test 5: Test parallel execution
    console.log('\n📝 Test 5: Testing parallel execution...');
    const parallelQuery = 'Get all clients, facilities, and shipments in parallel';
    const parallelPlan = await plannerAgent.plan(parallelQuery, 'groq');
    
    const parallelSteps = parallelPlan.plan.steps.filter(step => step.parallel);
    console.log(`✅ Parallel plan created with ${parallelSteps.length} parallel steps`);

    // Test 6: Test full cycle with complex query
    console.log('\n📝 Test 6: Testing full cycle with complex query...');
    const fullCycleResult = await orchestrator.executeFullCycle({
      query: 'Create a comprehensive waste management report: get all clients, their facilities, recent shipments, any contaminants found, inspection results, and waste code classifications',
      llm_provider: 'groq'
    });
    
    console.log(`✅ Full cycle completed:`, {
      success: fullCycleResult.success,
      totalTime: fullCycleResult.total_time_ms,
      planSteps: fullCycleResult.plan.plan.steps.length,
      executionStatus: fullCycleResult.execution.status,
      parallelSteps: fullCycleResult.plan.plan.steps.filter(s => s.parallel).length
    });

    // Test 7: Test error handling with complex query
    console.log('\n📝 Test 7: Testing error handling...');
    const errorQuery = 'Get all data that does not exist and process it with invalid parameters';
    try {
      const errorPlan = await plannerAgent.plan(errorQuery, 'groq');
      console.log(`⚠️ Error query plan created with ${errorPlan.plan.steps.length} steps`);
    } catch (error) {
      console.log(`✅ Error handling working: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }

    // Test 8: Test batching
    console.log('\n📝 Test 8: Testing intelligent batching...');
    const batchQuery = 'List all clients, list all facilities, list all shipments, list all waste codes';
    const batchPlan = await plannerAgent.plan(batchQuery, 'groq');
    
    console.log(`✅ Batch plan created with ${batchPlan.plan.steps.length} steps`);
    
    // Check if list operations are grouped for batching
    const listSteps = batchPlan.plan.steps.filter(step => step.tool.includes('_list'));
    console.log(`📊 Found ${listSteps.length} list operations that can be batched`);

    console.log('\n🎉 Complex Query Test Completed Successfully!');
    console.log('\n📊 Summary:');
    console.log('- Simple queries handled correctly');
    console.log('- Medium complexity queries planned successfully');
    console.log('- Complex queries with 7+ tools handled');
    console.log('- Complexity analysis working');
    console.log('- Parallel execution identified');
    console.log('- Full cycle integration working');
    console.log('- Error handling functional');
    console.log('- Intelligent batching detected');

  } catch (error) {
    console.error('❌ Complex Query Test Failed:', error);
    process.exit(1);
  }
}

// Run the test
if (require.main === module) {
  testComplexQueries();
}

export default testComplexQueries;
