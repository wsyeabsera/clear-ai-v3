// Simple test file for the Planner Agent

import { SimplePlannerAgent } from './simple-planner';

async function testPlannerAgent() {
  console.log('🧪 Testing Planner Agent...\n');
  
  try {
    // Initialize the planner agent
    const planner = new SimplePlannerAgent();
    
    // Test queries
    const testQueries = [
      'List all shipments from last week',
      'Get contaminated shipments from Berlin facilities',
      'Show me facilities with high rejection rates',
      'Create a new shipment record',
      'Find shipments with lead contamination'
    ];
    
    for (const query of testQueries) {
      console.log(`\n📝 Testing query: "${query}"`);
      console.log('─'.repeat(50));
      
      const startTime = Date.now();
      const result = await planner.plan(query);
      const endTime = Date.now();
      
      console.log(`✅ Request ID: ${result.requestId}`);
      console.log(`📊 Status: ${result.status}`);
      console.log(`⏱️  Execution time: ${result.executionTimeMs}ms`);
      console.log(`🔧 Tools selected: ${result.plan.steps.length} steps`);
      
      if (result.validationErrors.length > 0) {
        console.log(`⚠️  Validation errors: ${result.validationErrors.join(', ')}`);
      }
      
      console.log('\n📋 Generated Plan:');
        result.plan.steps.forEach((step: any, index: number) => {
        console.log(`  ${index + 1}. ${step.tool}`);
        console.log(`     Params: ${JSON.stringify(step.params, null, 2)}`);
        if (step.dependsOn.length > 0) {
          console.log(`     Depends on: ${step.dependsOn.join(', ')}`);
        }
        if (step.parallel) {
          console.log(`     ⚡ Can run in parallel`);
        }
        console.log('');
      });
      
      console.log(`\n⏱️  Total test time: ${endTime - startTime}ms`);
      console.log('═'.repeat(50));
    }
    
    // Test plan retrieval
    console.log('\n🔍 Testing plan retrieval...');
    const firstResult = await planner.plan('List all shipments');
    const retrievedPlan = await planner.getPlan(firstResult.requestId);
    
    if (retrievedPlan) {
      console.log('✅ Plan retrieval successful');
      console.log(`   Query: ${retrievedPlan.query}`);
      console.log(`   Status: ${retrievedPlan.status}`);
    } else {
      console.log('❌ Plan retrieval failed');
    }
    
    // Test statistics
    console.log('\n📊 Testing statistics...');
    const stats = await planner.getStatistics();
    console.log(`   Total plans: ${stats.total}`);
    console.log(`   By status:`, stats.byStatus);
    console.log(`   Average execution time: ${stats.averageExecutionTime}ms`);
    
    console.log('\n🎉 All tests completed successfully!');
    
  } catch (error) {
    console.error('❌ Test failed:', error);
    process.exit(1);
  }
}

// Run tests if this file is executed directly
if (require.main === module) {
  testPlannerAgent().catch(console.error);
}

export { testPlannerAgent };
