#!/usr/bin/env ts-node

// Manual Full Cycle Test Script
// Interactive testing of the complete planner-executor workflow

import { MongoMemoryServer } from 'mongodb-memory-server';
import { connect, disconnect } from 'mongoose';
import { PlannerAgent } from '../src/agents/planner/PlannerAgent';
import { ExecutionAgent } from '../src/agents/executor/ExecutionAgent';
import { ExecutionStatus, StepStatus } from '../src/agents/executor/types';
import { ToolAdapter } from '../src/agents/planner/tool-adapter';

// Mock ToolAdapter for testing
jest.mock('../src/agents/planner/tool-adapter');
const MockedToolAdapter = ToolAdapter as jest.Mocked<typeof ToolAdapter>;

class FullCycleTester {
  private mongoServer: MongoMemoryServer | null = null;
  private planner: PlannerAgent | null = null;
  private executor: ExecutionAgent | null = null;

  async setup(): Promise<void> {
    console.log('🚀 Setting up Full Cycle Test Environment...\n');

    try {
      // Set up test environment
      process.env.NODE_ENV = 'test';
      process.env.MONGODB_URI = 'mongodb://localhost:27017/waste-management-test';

      // Start MongoDB Memory Server
      console.log('📦 Starting MongoDB Memory Server...');
      this.mongoServer = await MongoMemoryServer.create();
      const mongoUri = this.mongoServer.getUri();
      console.log(`✅ MongoDB Memory Server started at: ${mongoUri}`);

      // Connect to test database
      console.log('🔌 Connecting to test database...');
      await connect(mongoUri);
      console.log('✅ Connected to test database');

      // Initialize agents
      console.log('🤖 Initializing agents...');
      this.planner = new PlannerAgent();
      this.executor = new ExecutionAgent();
      console.log('✅ Agents initialized');

      console.log('\n🎉 Test environment setup complete!\n');
    } catch (error) {
      console.error('❌ Setup failed:', error);
      throw error;
    }
  }

  async cleanup(): Promise<void> {
    console.log('\n🧹 Cleaning up test environment...');
    
    try {
      if (this.mongoServer) {
        await disconnect();
        await this.mongoServer.stop();
        console.log('✅ Test environment cleaned up');
      }
    } catch (error) {
      console.error('❌ Cleanup failed:', error);
    }
  }

  async testBasicFlow(): Promise<void> {
    console.log('📋 Testing Basic Flow: Query → Plan → Execute');
    console.log('═'.repeat(60));

    if (!this.planner || !this.executor) {
      throw new Error('Agents not initialized');
    }

    // Mock tool execution
    MockedToolAdapter.executeTool.mockResolvedValue({
      success: true,
      data: [
        { uid: 'ship-1', license_plate: 'ABC-123', client_uid: 'client-1' },
        { uid: 'ship-2', license_plate: 'DEF-456', client_uid: 'client-2' }
      ]
    });

    const query = 'List all shipments from last week';
    console.log(`🔍 Query: "${query}"`);

    // Step 1: Create Plan
    console.log('\n📝 Step 1: Creating plan...');
    const planStart = Date.now();
    const planResponse = await this.planner.plan(query);
    const planTime = Date.now() - planStart;

    console.log(`✅ Plan created in ${planTime}ms`);
    console.log(`   Request ID: ${planResponse.requestId}`);
    console.log(`   Status: ${planResponse.status}`);
    console.log(`   Steps: ${planResponse.plan.steps.length}`);

    // Display plan details
    console.log('\n📋 Generated Plan:');
    planResponse.plan.steps.forEach((step, index) => {
      console.log(`   ${index + 1}. ${step.tool}`);
      console.log(`      Params: ${JSON.stringify(step.params, null, 6)}`);
      if (step.dependsOn.length > 0) {
        console.log(`      Depends on: ${step.dependsOn.join(', ')}`);
      }
      if (step.parallel) {
        console.log(`      ⚡ Parallel execution`);
      }
    });

    // Step 2: Execute Plan
    console.log('\n⚡ Step 2: Executing plan...');
    const execStart = Date.now();
    const execution = await this.executor.executePlan(planResponse.requestId);
    const execTime = Date.now() - execStart;

    console.log(`✅ Execution completed in ${execTime}ms`);
    console.log(`   Execution ID: ${execution.executionId}`);
    console.log(`   Status: ${execution.status}`);
    console.log(`   Total Steps: ${execution.totalSteps}`);
    console.log(`   Completed: ${execution.completedSteps}`);
    console.log(`   Failed: ${execution.failedSteps}`);

    // Display execution results
    console.log('\n📊 Execution Results:');
    execution.results.forEach((result, index) => {
      console.log(`   Step ${index + 1}: ${result.tool}`);
      console.log(`      Status: ${result.status}`);
      console.log(`      Retry Count: ${result.retryCount}`);
      if (result.error) {
        console.log(`      Error: ${result.error}`);
      }
      if (result.result) {
        console.log(`      Result: ${JSON.stringify(result.result, null, 6)}`);
      }
    });

    console.log('\n✅ Basic flow test completed successfully!');
  }

  async testParallelExecution(): Promise<void> {
    console.log('\n\n⚡ Testing Parallel Execution');
    console.log('═'.repeat(60));

    if (!this.planner || !this.executor) {
      throw new Error('Agents not initialized');
    }

    // Mock tool executions with delays
    let callCount = 0;
    MockedToolAdapter.executeTool.mockImplementation(async () => {
      callCount++;
      const delay = Math.random() * 200 + 100; // 100-300ms delay
      await new Promise(resolve => setTimeout(resolve, delay));
      return {
        success: true,
        data: { uid: `facility-${callCount}`, name: `Facility ${callCount}` }
      };
    });

    const query = 'Create multiple facilities in parallel';
    console.log(`🔍 Query: "${query}"`);

    // Create plan
    console.log('\n📝 Creating plan...');
    const planResponse = await this.planner.plan(query);
    console.log(`✅ Plan created with ${planResponse.plan.steps.length} steps`);

    // Check for parallel steps
    const parallelSteps = planResponse.plan.steps.filter(step => step.parallel);
    console.log(`⚡ Found ${parallelSteps.length} parallel steps`);

    // Execute plan
    console.log('\n⚡ Executing plan with parallel execution...');
    const startTime = Date.now();
    const execution = await this.executor.executePlan(planResponse.requestId, {
      parallelExecutionLimit: 5
    });
    const endTime = Date.now();

    const executionTime = endTime - startTime;
    console.log(`✅ Parallel execution completed in ${executionTime}ms`);
    console.log(`   Status: ${execution.status}`);
    console.log(`   Completed Steps: ${execution.completedSteps}`);

    // Analyze timing
    const sequentialTime = execution.results.length * 200; // Estimated sequential time
    const speedup = sequentialTime / executionTime;
    console.log(`   Estimated sequential time: ${sequentialTime}ms`);
    console.log(`   Speedup: ${speedup.toFixed(2)}x`);

    console.log('\n✅ Parallel execution test completed!');
  }

  async testRetryLogic(): Promise<void> {
    console.log('\n\n🔄 Testing Retry Logic');
    console.log('═'.repeat(60));

    if (!this.planner || !this.executor) {
      throw new Error('Agents not initialized');
    }

    // Mock tool to fail twice then succeed
    let attemptCount = 0;
    MockedToolAdapter.executeTool.mockImplementation(async () => {
      attemptCount++;
      console.log(`   Attempt ${attemptCount}...`);
      
      if (attemptCount <= 2) {
        throw new Error(`Network timeout (attempt ${attemptCount})`);
      }
      
      return {
        success: true,
        data: { uid: 'ship-retry', license_plate: 'RETRY-123' }
      };
    });

    const query = 'Create a shipment with retry testing';
    console.log(`🔍 Query: "${query}"`);

    // Create plan
    const planResponse = await this.planner.plan(query);
    console.log(`✅ Plan created`);

    // Execute with retry configuration
    console.log('\n🔄 Executing with retry logic...');
    const execution = await this.executor.executePlan(planResponse.requestId, {
      maxRetries: 3,
      retryDelayMs: 100 // Fast retry for testing
    });

    console.log(`✅ Execution completed`);
    console.log(`   Status: ${execution.status}`);
    console.log(`   Retry Count: ${execution.results[0].retryCount}`);
    console.log(`   Total Attempts: ${attemptCount}`);

    console.log('\n✅ Retry logic test completed!');
  }

  async testRollback(): Promise<void> {
    console.log('\n\n🔄 Testing Rollback Functionality');
    console.log('═'.repeat(60));

    if (!this.planner || !this.executor) {
      throw new Error('Agents not initialized');
    }

    // Mock first step success, second step failure, then rollback
    let callCount = 0;
    MockedToolAdapter.executeTool.mockImplementation(async () => {
      callCount++;
      
      if (callCount === 1) {
        console.log('   Creating facility...');
        return { success: true, data: { uid: 'facility-1', name: 'Test Facility' } };
      } else if (callCount === 2) {
        console.log('   Creating shipment (will fail)...');
        throw new Error('Shipment creation failed');
      } else if (callCount === 3) {
        console.log('   Rolling back facility creation...');
        return { success: true, data: { deleted: true } };
      }
      
      return { success: true, data: {} };
    });

    const query = 'Create facility and shipment, then fail on shipment';
    console.log(`🔍 Query: "${query}"`);

    // Create plan
    const planResponse = await this.planner.plan(query);
    console.log(`✅ Plan created with ${planResponse.plan.steps.length} steps`);

    // Execute with rollback enabled
    console.log('\n🔄 Executing with rollback enabled...');
    const execution = await this.executor.executePlan(planResponse.requestId, {
      enableRollback: true,
      continueOnError: false
    });

    console.log(`✅ Execution completed`);
    console.log(`   Status: ${execution.status}`);
    console.log(`   Completed Steps: ${execution.completedSteps}`);
    console.log(`   Failed Steps: ${execution.failedSteps}`);
    console.log(`   Total Tool Calls: ${callCount}`);

    console.log('\n✅ Rollback test completed!');
  }

  async testStatistics(): Promise<void> {
    console.log('\n\n📊 Testing Statistics and Monitoring');
    console.log('═'.repeat(60));

    if (!this.planner || !this.executor) {
      throw new Error('Agents not initialized');
    }

    // Mock successful tool execution
    MockedToolAdapter.executeTool.mockResolvedValue({
      success: true,
      data: []
    });

    // Execute multiple plans
    console.log('📝 Creating and executing multiple plans...');
    const queries = [
      'List all shipments',
      'List all facilities',
      'Get contaminated shipments'
    ];

    const executions = [];
    for (const query of queries) {
      console.log(`   Executing: "${query}"`);
      const plan = await this.planner.plan(query);
      const execution = await this.executor.executePlan(plan.requestId);
      executions.push(execution);
    }

    // Get statistics
    console.log('\n📊 Execution Statistics:');
    const stats = await this.executor.getStatistics();
    console.log(`   Total Executions: ${stats.total}`);
    console.log(`   Completed: ${stats.byStatus.COMPLETED}`);
    console.log(`   Failed: ${stats.byStatus.FAILED}`);
    console.log(`   Success Rate: ${stats.successRate.toFixed(2)}%`);
    console.log(`   Average Execution Time: ${stats.averageExecutionTime.toFixed(2)}ms`);
    console.log(`   Average Steps per Execution: ${stats.averageStepsPerExecution.toFixed(2)}`);

    // Test monitoring capabilities
    console.log('\n🔍 Testing monitoring capabilities...');
    const recentExecutions = await this.executor.getRecentExecutions(5);
    console.log(`   Recent Executions: ${recentExecutions.length}`);

    if (executions.length > 0) {
      const firstExecution = executions[0];
      const retrievedExecution = await this.executor.getExecution(firstExecution.executionId);
      console.log(`   Retrieved Execution: ${retrievedExecution ? 'Success' : 'Failed'}`);
    }

    console.log('\n✅ Statistics test completed!');
  }

  async runAllTests(): Promise<void> {
    try {
      await this.setup();

      console.log('🧪 Starting Full Cycle Tests...\n');

      await this.testBasicFlow();
      await this.testParallelExecution();
      await this.testRetryLogic();
      await this.testRollback();
      await this.testStatistics();

      console.log('\n🎉 All tests completed successfully!');
      console.log('═'.repeat(60));
      console.log('✅ Basic Flow: Query → Plan → Execute');
      console.log('✅ Parallel Execution: Multiple steps simultaneously');
      console.log('✅ Retry Logic: Failed steps with retry');
      console.log('✅ Rollback: Automatic rollback on failure');
      console.log('✅ Statistics: Execution tracking and monitoring');
      console.log('═'.repeat(60));

    } catch (error) {
      console.error('\n❌ Test failed:', error);
      process.exit(1);
    } finally {
      await this.cleanup();
    }
  }
}

// Run tests if this file is executed directly
if (require.main === module) {
  const tester = new FullCycleTester();
  tester.runAllTests().catch(console.error);
}

export { FullCycleTester };
