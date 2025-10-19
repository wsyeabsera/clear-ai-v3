#!/usr/bin/env ts-node

/**
 * Test script to test our vector store implementation
 */

import { PineconeVectorStore } from '../src/agents/memory/vector-store';
import { EmbeddingService, OpenAIEmbeddingProvider } from '../src/agents/memory/embedding-service';

async function testVectorStore() {
  console.log('🔍 Testing Vector Store Implementation...\n');

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

    // Initialize vector store
    const vectorStore = new PineconeVectorStore(apiKey, environment, indexName);
    const embeddingProvider = new OpenAIEmbeddingProvider(process.env.OPENAI_API_KEY!);
    const embeddingService = new EmbeddingService(embeddingProvider);

    // Test 1: Generate embedding
    console.log('\n📝 Test 1: Generate embedding...');
    const testQuery = 'Show me all clients';
    const embedding = await embeddingService.generateEmbedding(testQuery);
    console.log(`✅ Generated embedding with ${embedding.length} dimensions`);

    // Test 2: Test upsert
    console.log('\n📝 Test 2: Test upsert...');
    try {
      const testEntry = {
        id: 'test-entry-456',
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

    // Test 3: Test query
    console.log('\n📝 Test 3: Test query...');
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
    }

    // Test 4: Test query without namespace
    console.log('\n📝 Test 4: Test query without namespace...');
    try {
      const results = await vectorStore.query(embedding, 5);
      console.log(`✅ Query without namespace successful, found ${results.length} results`);
    } catch (error) {
      console.log(`❌ Query without namespace failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }

  } catch (error) {
    console.error('❌ Test Failed:', error);
  }
}

// Run the test
if (require.main === module) {
  testVectorStore();
}
