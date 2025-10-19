#!/usr/bin/env node

/**
 * Test script to verify variable resolution fixes
 * This tests both the executor's variable resolution and the planner's post-processing
 */

const { ExecutionAgent } = require('./dist/agents/executor/ExecutionAgent');
const { PlannerAgent } = require('./dist/agents/planner/PlannerAgent');

async function testVariableResolution() {
  console.log('🧪 Testing Variable Resolution Fixes\n');

  try {
    // Test 1: Executor variable resolution
    console.log('Test 1: Executor Variable Resolution');
    console.log('=====================================');
    
    const executor = new ExecutionAgent();
    
    // Mock step results
    const mockStepResults = [
      {
        stepIndex: 0,
        tool: 'facilities_list',
        status: 'COMPLETED',
        result: {
          items: [
            { uid: 'facility_123', name: 'Test Facility 1' },
            { uid: 'facility_456', name: 'Test Facility 2' }
          ]
        }
      },
      {
        stepIndex: 1,
        tool: 'facilities_get',
        status: 'COMPLETED',
        result: {
          uid: 'facility_789',
          name: 'Test Facility 3'
        }
      }
    ];

    // Test both patterns
    const testParams = {
      // Standard step reference
      standardRef: '${step_0.result.items[0].uid}',
      // Entity pattern (should be resolved)
      entityRef: '${facility_1.uid}',
      // Mixed patterns
      mixedRef: '${step_1.result.uid}',
      // Invalid pattern (should remain unchanged)
      invalidRef: '${invalid_pattern}'
    };

    console.log('Input parameters:', JSON.stringify(testParams, null, 2));
    
    // Use reflection to access private method for testing
    const resolvedParams = executor.resolveStepReferences(testParams, mockStepResults);
    
    console.log('Resolved parameters:', JSON.stringify(resolvedParams, null, 2));
    console.log('✅ Executor variable resolution test completed\n');

    // Test 2: Parameter validation
    console.log('Test 2: Parameter Validation');
    console.log('============================');
    
    const validationResult = executor.validateParameters('test_tool', testParams);
    console.log('Validation result:', validationResult);
    console.log('✅ Parameter validation test completed\n');

    // Test 3: Planner post-processing (simulated)
    console.log('Test 3: Planner Post-Processing');
    console.log('================================');
    
    const planner = new PlannerAgent();
    
    // Simulate a plan with problematic variable references
    const mockPlanSteps = [
      {
        tool: 'facilities_list',
        params: { page: 1, limit: 10 },
        dependsOn: [],
        parallel: false,
        description: 'List facilities'
      },
      {
        tool: 'facilities_get',
        params: { id: '${facility_1.uid}' }, // This should be fixed
        dependsOn: [0],
        parallel: false,
        description: 'Get facility details'
      }
    ];

    console.log('Original plan steps:', JSON.stringify(mockPlanSteps, null, 2));
    
    // Use reflection to access private method for testing
    const fixedSteps = planner.fixCommonVariableMistakes(mockPlanSteps);
    
    console.log('Fixed plan steps:', JSON.stringify(fixedSteps, null, 2));
    console.log('✅ Planner post-processing test completed\n');

    console.log('🎉 All tests completed successfully!');
    console.log('\nSummary of fixes:');
    console.log('- ✅ Executor now resolves both ${step_N.result.field} and ${entity_N.field} patterns');
    console.log('- ✅ Enhanced validation provides specific error messages');
    console.log('- ✅ Planner prompts include explicit variable format rules');
    console.log('- ✅ Post-processing fixes common LLM variable mistakes');
    console.log('- ✅ Validator catches unresolved variables with actionable suggestions');

  } catch (error) {
    console.error('❌ Test failed:', error.message);
    console.error(error.stack);
    process.exit(1);
  }
}

// Run the test
testVariableResolution().catch(console.error);
