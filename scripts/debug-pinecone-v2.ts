#!/usr/bin/env ts-node

/**
 * Debug script to test Pinecone v2 API with different formats
 */

import { Pinecone } from '@pinecone-database/pinecone';

async function debugPineconeV2() {
  console.log('🔍 Debugging Pinecone v2 API...\n');

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

    // Test 1: Check index stats
    console.log('\n📝 Test 1: Check index stats...');
    try {
      const stats = await index.describeIndexStats();
      console.log(`✅ Index stats retrieved:`, stats);
    } catch (error) {
      console.log(`❌ Index stats failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }

    // Test 2: Test upsert with namespace
    console.log('\n📝 Test 2: Test upsert with namespace...');
    try {
      const testVector = new Array(1536).fill(0.1);
      const testEntry = {
        id: 'test-entry-namespace',
        values: testVector,
        metadata: {
          test: true,
          timestamp: new Date().toISOString()
        }
      };

      // Try with namespace
      await index.upsert({
        vectors: [testEntry],
        namespace: 'analyzer_memory'
      });
      console.log('✅ Upsert with namespace successful');
    } catch (error) {
      console.log(`❌ Upsert with namespace failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }

    // Test 3: Test query with namespace
    console.log('\n📝 Test 3: Test query with namespace...');
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

    // Test 4: Test query without namespace
    console.log('\n📝 Test 4: Test query without namespace...');
    try {
      const testVector = new Array(1536).fill(0.1);
      
      const response = await index.query({
        vector: testVector,
        topK: 5
      });
      console.log(`✅ Query without namespace successful:`, response);
    } catch (error) {
      console.log(`❌ Query without namespace failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }

  } catch (error) {
    console.error('❌ Debug Failed:', error);
  }
}

// Run the debug
if (require.main === module) {
  debugPineconeV2();
}
