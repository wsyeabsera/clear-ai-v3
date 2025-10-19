#!/usr/bin/env ts-node

/**
 * Test script to debug Pinecone API issues
 */

import { PineconeVectorStore } from '../src/agents/memory/vector-store';
import { EmbeddingService, OpenAIEmbeddingProvider } from '../src/agents/memory/embedding-service';

async function testPinecone() {
  console.log('🔍 Testing Pinecone API...\n');

  try {
    // Initialize Pinecone
    const apiKey = process.env.PINECONE_API_KEY;
    const environment = process.env.PINECONE_ENVIRONMENT || 'us-east-1';
    const indexName = process.env.PINECONE_INDEX_NAME || 'waste-management';

    if (!apiKey) {
      console.log('❌ PINECONE_API_KEY not found in environment');
      return;
    }

    console.log(`🔑 Using Pinecone API key: ${apiKey.substring(0, 8)}...`);
    console.log(`🌍 Environment: ${environment}`);
    console.log(`📊 Index: ${indexName}`);

    const vectorStore = new PineconeVectorStore(apiKey, environment, indexName);
    const embeddingProvider = new OpenAIEmbeddingProvider(process.env.OPENAI_API_KEY!);
    const embeddingService = new EmbeddingService(embeddingProvider);

    // Test embedding generation
    console.log('\n📝 Testing embedding generation...');
    const testQuery = 'Show me all clients';
    const embedding = await embeddingService.generateEmbedding(testQuery);
    console.log(`✅ Generated embedding with ${embedding.length} dimensions`);

    // Test vector query
    console.log('\n🔍 Testing vector query...');
    try {
      const results = await vectorStore.query(embedding, 5, 'analyzer_memory');
      console.log(`✅ Query successful, found ${results.length} results`);
      
      if (results.length > 0) {
        console.log('📋 Sample result:');
        console.log(`  ID: ${results[0].id}`);
        console.log(`  Score: ${results[0].score}`);
        console.log(`  Metadata keys: ${Object.keys(results[0].metadata).join(', ')}`);
      }
    } catch (error) {
      console.log(`❌ Query failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
      
      // Try to debug the issue
      console.log('\n🔧 Debugging query format...');
      const queryRequest = {
        vector: embedding,
        topK: 5,
        includeValues: true,
        includeMetadata: true,
        namespace: 'analyzer_memory'
      };
      
      console.log('Query request structure:');
      console.log(JSON.stringify({
        ...queryRequest,
        vector: `[${embedding.length} numbers]`
      }, null, 2));
    }

    // Test vector upsert
    console.log('\n📤 Testing vector upsert...');
    try {
      const testEntry = {
        id: 'test-entry-123',
        vector: embedding,
        metadata: {
          test: true,
          timestamp: new Date().toISOString(),
          query: testQuery
        },
        namespace: 'analyzer_memory'
      };

      await vectorStore.upsert([testEntry]);
      console.log('✅ Upsert successful');
    } catch (error) {
      console.log(`❌ Upsert failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }

  } catch (error) {
    console.error('❌ Test Failed:', error);
  }
}

// Run the test
if (require.main === module) {
  testPinecone();
}
