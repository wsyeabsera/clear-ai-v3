#!/usr/bin/env node

// Simple test to verify the intelligent planner is working
const { PlannerAgent } = require('./dist/agents/planner/PlannerAgent');

async function testPlanner() {
  console.log('🧪 Testing Intelligent Planner Agent...\n');
  
  try {
    // Set a test API key
    process.env.OPENAI_API_KEY = 'test-key';
    
    // Initialize the planner agent
    const planner = new PlannerAgent();
    
    // Test a simple query
    const query = 'List all shipments';
    console.log(`📝 Testing query: "${query}"`);
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
    result.plan.steps.forEach((step, index) => {
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
    
    console.log('\n🎉 Test completed!');
    
  } catch (error) {
    console.error('❌ Test failed:', error.message);
    process.exit(1);
  }
}

testPlanner().catch(console.error);
