#!/usr/bin/env ts-node

// Test script for the intelligent planner agent

import { PlannerAgent } from '../src/agents/planner/PlannerAgent';

async function testIntelligentPlanner() {
  console.log('🧪 Testing Intelligent Planner Agent...\n');
  
  try {
    // Initialize the planner agent
    const planner = new PlannerAgent();
    
    // Test queries of increasing complexity
    const testQueries = [
      // Simple queries
      'List all shipments',
      'Get all facilities',
      'Show me waste codes',
      
      // Complex queries with filters
      'Get contaminated shipments from last week',
      'Find facilities in Berlin with high rejection rates',
      'Show me shipments delivered yesterday that were rejected',
      
      // Multi-step queries
      'Create a new client and then create a shipment for them',
      'Get all facilities in Berlin and then show me their bunkers',
      'Find contaminated shipments and then get their inspection details',
      
      // Advanced queries
      'Show me contaminated shipments from Berlin facilities delivered last week with lead contamination',
      'Get all waste codes for hazardous materials and their properties',
      'Find facilities with bunkers that have crane arms and show their current load'
    ];
    
    for (const query of testQueries) {
      console.log(`\n📝 Testing query: "${query}"`);
      console.log('─'.repeat(80));
      
      try {
        const startTime = Date.now();
        const result = await planner.plan(query, 'openai', true); // Skip database for testing
        const endTime = Date.now();
        
        console.log(`✅ Plan created successfully!`);
        console.log(`📊 Request ID: ${result.requestId}`);
        console.log(`📊 Status: ${result.status}`);
        console.log(`📊 Execution Time: ${result.executionTimeMs}ms`);
        console.log(`📊 Validation Errors: ${result.validationErrors.length}`);
        
        if (result.validationErrors.length > 0) {
          console.log(`⚠️  Validation errors:`);
          result.validationErrors.forEach(error => console.log(`   - ${error}`));
        }
        
        console.log(`\n📋 Generated Plan:`);
        console.log(`   Total Steps: ${result.plan.metadata.totalSteps}`);
        console.log(`   Parallel Steps: ${result.plan.metadata.parallelSteps}`);
        
        result.plan.steps.forEach((step: any, index: number) => {
          console.log(`\n   ${index + 1}. ${step.tool}`);
          console.log(`      Description: ${step.description}`);
          console.log(`      Parameters: ${JSON.stringify(step.params, null, 6)}`);
          if (step.dependsOn.length > 0) {
            console.log(`      Depends on: ${step.dependsOn.join(', ')}`);
          }
          console.log(`      Parallel: ${step.parallel}`);
          
          // Check for placeholder values
          const hasPlaceholders = Object.values(step.params).some(value => 
            typeof value === 'string' && value.includes('placeholder')
          );
          if (hasPlaceholders) {
            console.log(`      ⚠️  WARNING: Contains placeholder values!`);
          }
        });
        
        // Validate no placeholder values
        const allStepsValid = result.plan.steps.every((step: any) => 
          !Object.values(step.params).some(value => 
            typeof value === 'string' && value.includes('placeholder')
          )
        );
        
        if (allStepsValid) {
          console.log(`\n✅ All parameters are properly resolved (no placeholders)`);
        } else {
          console.log(`\n❌ Some parameters still contain placeholders`);
        }
        
        // Check for proper dependencies
        const hasDependencies = result.plan.steps.some((step: any) => 
          step.dependsOn.length > 0
        );
        
        if (hasDependencies) {
          console.log(`✅ Plan includes proper step dependencies`);
        }
        
        // Check for parallel execution
        const hasParallel = result.plan.steps.some((step: any) => step.parallel);
        if (hasParallel) {
          console.log(`✅ Plan includes parallel execution opportunities`);
        }
        
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
  testIntelligentPlanner().catch(console.error);
}
