#!/usr/bin/env ts-node

/**
 * Simple test to verify Pinecone v2 API works
 */

import { Pinecone } from '@pinecone-database/pinecone';

async function testPineconeSimple() {
  console.log('🔍 Testing Pinecone v2 API (Simple)...\n');

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

    // Test 1: Simple upsert
    console.log('\n📝 Test 1: Simple upsert...');
    try {
      const testVector = new Array(1536).fill(0.1);
      
      // Use the exact format from Pinecone docs
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

    // Test 2: Simple query
    console.log('\n📝 Test 2: Simple query...');
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

    // Test 3: Upsert with namespace
    console.log('\n📝 Test 3: Upsert with namespace...');
    try {
      const testVector = new Array(1536).fill(0.1);
      
      await index.upsert({
        vectors: [
          {
            id: 'test-namespace-1',
            values: testVector,
            metadata: { test: true, namespace: 'analyzer_memory' }
          }
        ],
        namespace: 'analyzer_memory'
      });
      console.log('✅ Upsert with namespace successful');
    } catch (error) {
      console.log(`❌ Upsert with namespace failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }

    // Test 4: Query with namespace
    console.log('\n📝 Test 4: Query with namespace...');
    try {
      const testVector = new Array(1536).fill(0.1);
      
      const response = await index.query({
        vector: testVector,
        topK: 5,
        namespace: 'analyzer_memory'
      });
      console.log(`✅ Query with namespace successful:`, response);
    } catch (error) {
      console.log(`❌ Query with namespace failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }

  } catch (error) {
    console.error('❌ Test Failed:', error);
  }
}

// Run the test
if (require.main === module) {
  testPineconeSimple();
}
