#!/usr/bin/env ts-node

/**
 * Debug script to test Pinecone API directly
 */

import { Pinecone } from '@pinecone-database/pinecone';

async function debugPinecone() {
  console.log('🔍 Debugging Pinecone API...\n');

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

    // Test 2: Test query with minimal parameters
    console.log('\n📝 Test 2: Test query with minimal parameters...');
    try {
      const testVector = new Array(1536).fill(0.1); // 1536 dimensions for text-embedding-3-small
      
      const queryRequest = {
        vector: testVector,
        topK: 5,
        includeValues: true,
        includeMetadata: true
      };

      console.log('Query request structure:');
      console.log(JSON.stringify({
        ...queryRequest,
        vector: `[${testVector.length} numbers]`
      }, null, 2));

      const response = await index.query(queryRequest);
      console.log(`✅ Query successful:`, response);
    } catch (error) {
      console.log(`❌ Query failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
      
      // Try alternative format
      console.log('\n🔧 Trying alternative query format...');
      try {
        const testVector = new Array(1536).fill(0.1);
        const response = await index.query({
          vector: testVector,
          topK: 5
        });
        console.log(`✅ Alternative query successful:`, response);
      } catch (altError) {
        console.log(`❌ Alternative query also failed: ${altError instanceof Error ? altError.message : 'Unknown error'}`);
      }
    }

    // Test 3: Test upsert
    console.log('\n📝 Test 3: Test upsert...');
    try {
      const testVector = new Array(1536).fill(0.1);
      const testEntry = {
        id: 'test-entry-123',
        values: testVector,
        metadata: {
          test: true,
          timestamp: new Date().toISOString()
        }
      };

      await index.upsert([testEntry]);
      console.log('✅ Upsert successful');
    } catch (error) {
      console.log(`❌ Upsert failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }

  } catch (error) {
    console.error('❌ Debug Failed:', error);
  }
}

// Run the debug
if (require.main === module) {
  debugPinecone();
}
