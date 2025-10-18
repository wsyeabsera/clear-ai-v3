#!/usr/bin/env ts-node

// Simple test for Planner Agent without MongoDB

import { SimplePlannerAgent } from '../src/agents/planner/simple-planner';

async function testPlannerAgent() {
  console.log('🧪 Testing Simple Planner Agent (No MongoDB)...\n');
  
  try {
    // Initialize the planner agent
    const planner = new SimplePlannerAgent();
    
    // Test queries
    const testQueries = [
      'List all shipments from last week',
      'Get contaminated shipments from Berlin facilities',
      'Create a new shipment record',
      'Find shipments with lead contamination',
      'Show me facilities with high rejection rates'
    ];
    
    for (const query of testQueries) {
      console.log(`\n📝 Testing query: "${query}"`);
      console.log('─'.repeat(50));
      
      try {
        const result = await planner.plan(query);
        
        console.log('✅ Plan created successfully!');
        console.log(`📊 Request ID: ${result.requestId}`);
        console.log(`📊 Status: ${result.status}`);
        console.log(`📊 Execution Time: ${result.executionTimeMs}ms`);
        console.log(`📊 Validation Errors: ${result.validationErrors.length}`);
        
        if (result.validationErrors.length > 0) {
          console.log(`⚠️  Validation errors: ${result.validationErrors.join(', ')}`);
        }
        
        console.log('\n📋 Generated Plan:');
        console.log(`   Total Steps: ${result.plan.metadata.totalSteps}`);
        console.log(`   Parallel Steps: ${result.plan.metadata.parallelSteps}`);
        
        result.plan.steps.forEach((step: any, index: number) => {
          console.log(`   ${index + 1}. ${step.tool}`);
          console.log(`      Description: ${step.description}`);
          console.log(`      Parameters: ${JSON.stringify(step.params, null, 6)}`);
          if (step.dependsOn.length > 0) {
            console.log(`      Depends on: ${step.dependsOn.join(', ')}`);
          }
          console.log(`      Parallel: ${step.parallel}`);
          console.log('');
        });
        
      } catch (error) {
        console.log(`❌ Error: ${error}`);
      }
    }
    
    console.log('\n🎉 All tests completed!');
    
  } catch (error) {
    console.error('❌ Test failed:', error);
  }
}

// Run the test
if (require.main === module) {
  testPlannerAgent().catch(console.error);
}
