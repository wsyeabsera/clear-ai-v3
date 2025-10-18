#!/usr/bin/env ts-node

// Interactive manual testing script for Planner Agent

import { SimplePlannerAgent } from '../src/agents/planner/simple-planner';
import { TestUtils } from '../tests/agents/planner/test-utils';
import { PlanStatus } from '../src/agents/planner/types';
import * as readline from 'readline';

class PlannerManualTester {
  private plannerAgent: SimplePlannerAgent;
  private rl: readline.Interface;

  constructor() {
    this.plannerAgent = new SimplePlannerAgent();
    this.rl = readline.createInterface({
      input: process.stdin,
      output: process.stdout
    });
  }

  async start() {
    console.log('🧪 Planner Agent Manual Testing Tool');
    console.log('=====================================\n');

    // Set up test environment
    await this.setupEnvironment();

    // Show menu
    await this.showMenu();
  }

  private async setupEnvironment() {
    console.log('Setting up test environment...');
    
    try {
      // Set test environment variables
      TestUtils.setTestEnvVars();
      
      // Set up test database
      await TestUtils.setupTestDatabase();
      
      console.log('✅ Test environment ready!\n');
    } catch (error) {
      console.error('❌ Failed to set up test environment:', error);
      process.exit(1);
    }
  }

  private async showMenu() {
    console.log('Available Commands:');
    console.log('1. Test plan creation');
    console.log('2. Test plan retrieval');
    console.log('3. Test plan statistics');
    console.log('4. Test recent plans');
    console.log('5. Test plan deletion');
    console.log('6. Run sample queries');
    console.log('7. Test with real LLM');
    console.log('8. Show database status');
    console.log('9. Exit\n');

    const choice = await this.askQuestion('Enter your choice (1-9): ');

    switch (choice) {
      case '1':
        await this.testPlanCreation();
        break;
      case '2':
        await this.testPlanRetrieval();
        break;
      case '3':
        await this.testPlanStatistics();
        break;
      case '4':
        await this.testRecentPlans();
        break;
      case '5':
        await this.testPlanDeletion();
        break;
      case '6':
        await this.runSampleQueries();
        break;
      case '7':
        await this.testWithRealLLM();
        break;
      case '8':
        await this.showDatabaseStatus();
        break;
      case '9':
        await this.cleanup();
        process.exit(0);
      default:
        console.log('Invalid choice. Please try again.\n');
        await this.showMenu();
    }
  }

  private async testPlanCreation() {
    console.log('\n📝 Testing Plan Creation');
    console.log('========================\n');

    const query = await this.askQuestion('Enter your query: ');
    
    if (!query.trim()) {
      console.log('❌ Query cannot be empty.\n');
      await this.showMenu();
      return;
    }

    console.log(`\nCreating plan for: "${query}"`);
    console.log('⏳ Please wait...\n');

    try {
      const startTime = Date.now();
      const result = await this.plannerAgent.plan(query);
      const endTime = Date.now();

      console.log('✅ Plan created successfully!');
      console.log('📊 Results:');
      console.log(`   Request ID: ${result.requestId}`);
      console.log(`   Query: ${result.query}`);
      console.log(`   Status: ${result.status}`);
      console.log(`   Execution Time: ${result.executionTimeMs}ms`);
      console.log(`   Total Time: ${endTime - startTime}ms`);
      console.log(`   Validation Errors: ${result.validationErrors.length}`);

      if (result.validationErrors.length > 0) {
        console.log('   Validation Errors:');
        result.validationErrors.forEach(error => {
          console.log(`     - ${error}`);
        });
      }

      console.log('\n📋 Plan Structure:');
      console.log(`   Total Steps: ${result.plan.metadata.totalSteps}`);
      console.log(`   Parallel Steps: ${result.plan.metadata.parallelSteps}`);
      console.log(`   Steps:`);
      
      result.plan.steps.forEach((step, index) => {
        console.log(`     ${index + 1}. ${step.tool}`);
        console.log(`        Description: ${step.description}`);
        console.log(`        Parameters: ${JSON.stringify(step.params, null, 8)}`);
        console.log(`        Depends On: ${step.dependsOn.join(', ') || 'None'}`);
        console.log(`        Parallel: ${step.parallel}`);
        console.log('');
      });

    } catch (error) {
      console.error('❌ Error creating plan:', error);
    }

    await this.askQuestion('\nPress Enter to continue...');
    await this.showMenu();
  }

  private async testPlanRetrieval() {
    console.log('\n🔍 Testing Plan Retrieval');
    console.log('=========================\n');

    const requestId = await this.askQuestion('Enter request ID: ');
    
    if (!requestId.trim()) {
      console.log('❌ Request ID cannot be empty.\n');
      await this.showMenu();
      return;
    }

    console.log(`\nRetrieving plan: ${requestId}`);
    console.log('⏳ Please wait...\n');

    try {
      const result = await this.plannerAgent.getPlan(requestId);
      
      if (result) {
        console.log('✅ Plan retrieved successfully!');
        console.log('📊 Results:');
        console.log(`   Request ID: ${result.requestId}`);
        console.log(`   Query: ${result.query}`);
        console.log(`   Status: ${result.status}`);
        console.log(`   Created At: ${result.createdAt}`);
        console.log(`   Execution Time: ${result.executionTimeMs}ms`);
        console.log(`   Validation Errors: ${result.validationErrors.length}`);

        console.log('\n📋 Plan Structure:');
        console.log(`   Total Steps: ${result.plan.metadata.totalSteps}`);
        console.log(`   Parallel Steps: ${result.plan.metadata.parallelSteps}`);
      } else {
        console.log('❌ Plan not found.');
      }

    } catch (error) {
      console.error('❌ Error retrieving plan:', error);
    }

    await this.askQuestion('\nPress Enter to continue...');
    await this.showMenu();
  }

  private async testPlanStatistics() {
    console.log('\n📊 Testing Plan Statistics');
    console.log('==========================\n');

    console.log('⏳ Fetching statistics...\n');

    try {
      const stats = await this.plannerAgent.getStatistics();
      
      console.log('✅ Statistics retrieved successfully!');
      console.log('📊 Results:');
      console.log(`   Total Plans: ${stats.totalPlans}`);
      console.log(`   Completed Plans: ${stats.completedPlans}`);
      console.log(`   Failed Plans: ${stats.failedPlans}`);
      console.log(`   Average Execution Time: ${stats.averageExecutionTime}ms`);
      
      console.log('\n📈 Status Counts:');
      console.log(`   Completed: ${stats.statusCounts.completed}`);
      console.log(`   Failed: ${stats.statusCounts.failed}`);
      console.log(`   Pending: ${stats.statusCounts.pending}`);
      
      console.log('\n🔧 Provider Counts:');
      stats.providerCounts.forEach(provider => {
        console.log(`   ${provider.provider}: ${provider.count}`);
      });

    } catch (error) {
      console.error('❌ Error fetching statistics:', error);
    }

    await this.askQuestion('\nPress Enter to continue...');
    await this.showMenu();
  }

  private async testRecentPlans() {
    console.log('\n📜 Testing Recent Plans');
    console.log('======================\n');

    const limitStr = await this.askQuestion('Enter limit (default 10): ');
    const limit = limitStr.trim() ? parseInt(limitStr) : 10;

    console.log(`\nFetching ${limit} recent plans...`);
    console.log('⏳ Please wait...\n');

    try {
      const plans = await this.plannerAgent.getRecentPlans(limit);
      
      console.log(`✅ Retrieved ${plans.length} recent plans!`);
      console.log('📊 Results:\n');
      
      plans.forEach((plan, index) => {
        console.log(`${index + 1}. ${plan.query}`);
        console.log(`   Request ID: ${plan.requestId}`);
        console.log(`   Status: ${plan.status}`);
        console.log(`   Created: ${plan.createdAt}`);
        console.log(`   Execution Time: ${plan.executionTimeMs}ms`);
        console.log('');
      });

    } catch (error) {
      console.error('❌ Error fetching recent plans:', error);
    }

    await this.askQuestion('\nPress Enter to continue...');
    await this.showMenu();
  }

  private async testPlanDeletion() {
    console.log('\n🗑️  Testing Plan Deletion');
    console.log('=========================\n');

    const requestId = await this.askQuestion('Enter request ID to delete: ');
    
    if (!requestId.trim()) {
      console.log('❌ Request ID cannot be empty.\n');
      await this.showMenu();
      return;
    }

    console.log(`\nDeleting plan: ${requestId}`);
    console.log('⏳ Please wait...\n');

    try {
      const result = await this.plannerAgent.deletePlan(requestId);
      
      if (result) {
        console.log('✅ Plan deleted successfully!');
      } else {
        console.log('❌ Plan not found or could not be deleted.');
      }

    } catch (error) {
      console.error('❌ Error deleting plan:', error);
    }

    await this.askQuestion('\nPress Enter to continue...');
    await this.showMenu();
  }

  private async runSampleQueries() {
    console.log('\n🎯 Running Sample Queries');
    console.log('=========================\n');

    const sampleQueries = TestUtils.getSampleQueries();
    
    console.log('Running sample queries...\n');

    for (let i = 0; i < sampleQueries.length; i++) {
      const query = sampleQueries[i];
      console.log(`${i + 1}. Testing: "${query}"`);
      
      try {
        const startTime = Date.now();
        const result = await this.plannerAgent.plan(query);
        const endTime = Date.now();

        console.log(`   ✅ Success! (${endTime - startTime}ms)`);
        console.log(`   Request ID: ${result.requestId}`);
        console.log(`   Status: ${result.status}`);
        console.log(`   Steps: ${result.plan.steps.length}`);
        console.log('');

      } catch (error) {
        console.log(`   ❌ Error: ${error}`);
        console.log('');
      }
    }

    await this.askQuestion('\nPress Enter to continue...');
    await this.showMenu();
  }

  private async testWithRealLLM() {
    console.log('\n🤖 Testing with Real LLM');
    console.log('========================\n');

    console.log('This will test with real LLM calls using your API keys.');
    console.log('Make sure you have set OPENAI_API_KEY or GROQ_API_KEY in your environment.\n');

    const query = await this.askQuestion('Enter your query: ');
    
    if (!query.trim()) {
      console.log('❌ Query cannot be empty.\n');
      await this.showMenu();
      return;
    }

    console.log(`\nTesting with real LLM: "${query}"`);
    console.log('⏳ Please wait (this may take a moment)...\n');

    try {
      const startTime = Date.now();
      const result = await this.plannerAgent.plan(query);
      const endTime = Date.now();

      console.log('✅ Real LLM test completed!');
      console.log('📊 Results:');
      console.log(`   Request ID: ${result.requestId}`);
      console.log(`   Query: ${result.query}`);
      console.log(`   Status: ${result.status}`);
      console.log(`   Execution Time: ${result.executionTimeMs}ms`);
      console.log(`   Total Time: ${endTime - startTime}ms`);
      console.log(`   Validation Errors: ${result.validationErrors.length}`);

      if (result.validationErrors.length > 0) {
        console.log('   Validation Errors:');
        result.validationErrors.forEach(error => {
          console.log(`     - ${error}`);
        });
      }

      console.log('\n📋 Generated Plan:');
      console.log(JSON.stringify(result.plan, null, 2));

    } catch (error) {
      console.error('❌ Error with real LLM test:', error);
    }

    await this.askQuestion('\nPress Enter to continue...');
    await this.showMenu();
  }

  private async showDatabaseStatus() {
    console.log('\n🗄️  Database Status');
    console.log('==================\n');

    try {
      const stats = await this.plannerAgent.getStatistics();
      const recentPlans = await this.plannerAgent.getRecentPlans(5);
      
      console.log('📊 Database Statistics:');
      console.log(`   Total Plans: ${stats.totalPlans}`);
      console.log(`   Completed: ${stats.completedPlans}`);
      console.log(`   Failed: ${stats.failedPlans}`);
      console.log(`   Average Execution Time: ${stats.averageExecutionTime}ms`);
      
      console.log('\n📜 Recent Plans:');
      if (recentPlans.length > 0) {
        recentPlans.forEach((plan, index) => {
          console.log(`   ${index + 1}. ${plan.query} (${plan.status})`);
        });
      } else {
        console.log('   No plans found.');
      }

    } catch (error) {
      console.error('❌ Error fetching database status:', error);
    }

    await this.askQuestion('\nPress Enter to continue...');
    await this.showMenu();
  }

  private async cleanup() {
    console.log('\n🧹 Cleaning up...');
    await TestUtils.cleanupTestDatabase();
    console.log('✅ Cleanup complete!');
  }

  private askQuestion(question: string): Promise<string> {
    return new Promise((resolve) => {
      this.rl.question(question, (answer) => {
        resolve(answer);
      });
    });
  }
}

// Run the manual tester
async function main() {
  const tester = new PlannerManualTester();
  await tester.start();
}

// Handle process termination
process.on('SIGINT', async () => {
  console.log('\n\n👋 Goodbye!');
  await TestUtils.cleanupTestDatabase();
  process.exit(0);
});

if (require.main === module) {
  main().catch(console.error);
}
