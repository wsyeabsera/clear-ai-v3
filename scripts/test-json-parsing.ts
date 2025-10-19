#!/usr/bin/env ts-node

/**
 * Test script to verify improved JSON parsing
 */

import { GroqService } from '../src/agents/planner/groq-service';

async function testJSONParsing() {
  console.log('🔍 Testing Improved JSON Parsing...\n');

  try {
    // Load environment variables
    require('dotenv').config();

    const groqService = new GroqService();

    // Test 1: Simple query
    console.log('📝 Test 1: Simple query - "get me all the facilities"');
    try {
      const result = await groqService.generatePlan({
        query: 'get me all the facilities',
        selectedTools: ['facilities_list'],
        toolSchemas: [
          {
            name: 'facilities_list',
            description: 'List facilities',
            inputSchema: {
              type: 'object',
              properties: {
                page: { type: 'number' },
                limit: { type: 'number' }
              },
              required: ['page', 'limit']
            }
          }
        ],
        requestId: 'test-1',
        historicalContext: '',
        analysisFeedback: ''
      });

      console.log('✅ Plan generated successfully');
      console.log(`   Steps: ${result.plan.steps.length}`);
      console.log(`   First step tool: ${result.plan.steps[0].tool}`);
      console.log(`   First step params: ${JSON.stringify(result.plan.steps[0].params)}`);
    } catch (error) {
      console.log(`❌ Simple query failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }

    // Test 2: Complex query
    console.log('\n📝 Test 2: Complex query - "get all clients and their facilities"');
    try {
      const result = await groqService.generatePlan({
        query: 'get all clients and their facilities',
        selectedTools: ['clients_list', 'facilities_list'],
        toolSchemas: [
          {
            name: 'clients_list',
            description: 'List clients',
            inputSchema: {
              type: 'object',
              properties: {
                page: { type: 'number' },
                limit: { type: 'number' }
              },
              required: ['page', 'limit']
            }
          },
          {
            name: 'facilities_list',
            description: 'List facilities',
            inputSchema: {
              type: 'object',
              properties: {
                client_id: { type: 'string' },
                page: { type: 'number' },
                limit: { type: 'number' }
              },
              required: ['page', 'limit']
            }
          }
        ],
        requestId: 'test-2',
        historicalContext: '',
        analysisFeedback: ''
      });

      console.log('✅ Complex plan generated successfully');
      console.log(`   Steps: ${result.plan.steps.length}`);
      console.log(`   Dependencies: ${result.plan.steps.map(s => s.dependsOn).join(', ')}`);
    } catch (error) {
      console.log(`❌ Complex query failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }

    console.log('\n🎉 JSON Parsing Test Completed!');

  } catch (error) {
    console.error('❌ Test Failed:', error);
  }
}

// Run the test
if (require.main === module) {
  testJSONParsing();
}
