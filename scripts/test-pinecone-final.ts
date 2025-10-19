#!/usr/bin/env ts-node

/**
 * Final test to verify Pinecone v2 API works with correct format
 */

import { Pinecone } from '@pinecone-database/pinecone';

async function testPineconeFinal() {
  console.log('🔍 Testing Pinecone v2 API (Final)...\n');

  try {
    // Load environment variables
    require('dotenv').config();

    const apiKey = process.env.PINECONE_API_KEY;
    const environment = process.env.PINECONE_ENVIRONMENT || 'us-east-1';
    const indexName = process.env.PINECONE_INDEX_NAME || 'clear-ai-memory';

    if (!apiKey) {
      console.log('❌ PINECONE_API_KEY not found in environment');
      return;
    }

    console.log(`🔑 Using Pinecone API key: ${apiKey.substring(0, 8)}...`);
    console.log(`🌍 Environment: ${environment}`);
    console.log(`📊 Index: ${indexName}`);

    // Initialize Pinecone client
    const client = new Pinecone({
      apiKey
    });

    const index = client.index(indexName);

    // Test 1: Simple upsert (no namespace)
    console.log('\n📝 Test 1: Simple upsert (no namespace)...');
    try {
      const testVector = new Array(1536).fill(0.1);
      
      await index.upsert([
        {
          id: 'test-simple-1',
          values: testVector,
          metadata: { test: true }
        }
      ]);
      console.log('✅ Simple upsert successful');
    } catch (error) {
      console.log(`❌ Simple upsert failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }

    // Test 2: Simple query (no namespace)
    console.log('\n📝 Test 2: Simple query (no namespace)...');
    try {
      const testVector = new Array(1536).fill(0.1);
      
      const response = await index.query({
        vector: testVector,
        topK: 5
      });
      console.log(`✅ Simple query successful:`, response);
    } catch (error) {
      console.log(`❌ Simple query failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }

    // Test 3: Check if namespace is supported
    console.log('\n📝 Test 3: Check namespace support...');
    try {
      const stats = await index.describeIndexStats();
      console.log(`✅ Index stats:`, stats);
      console.log(`   Namespaces: ${Object.keys(stats.namespaces || {}).length}`);
    } catch (error) {
      console.log(`❌ Index stats failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }

  } catch (error) {
    console.error('❌ Test Failed:', error);
  }
}

// Run the test
if (require.main === module) {
  testPineconeFinal();
}
