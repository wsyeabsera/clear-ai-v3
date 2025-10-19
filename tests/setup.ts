// Global test setup configuration

import { MongoMemoryServer } from 'mongodb-memory-server';
import { connect, disconnect } from 'mongoose';

let mongoServer: MongoMemoryServer;

// Set up test environment before all tests
beforeAll(async () => {
  // Set test environment variables
  process.env.NODE_ENV = 'test';
  process.env.MONGODB_URI = 'mongodb://localhost:27017/waste-management-test';
  // Don't override API keys if they're already set (from .env file)
  if (!process.env.OPENAI_API_KEY) {
    process.env.OPENAI_API_KEY = 'test-openai-key';
  }
  if (!process.env.GROQ_API_KEY) {
    process.env.GROQ_API_KEY = 'test-groq-key';
  }
  process.env.DEFAULT_LLM_PROVIDER = 'openai';
  process.env.ENABLE_LLM_FALLBACK = 'true';
  process.env.MAX_PLAN_REFINEMENTS = '3';
  process.env.PLANNER_TIMEOUT_MS = '30000';
  
  // Start MongoDB Memory Server
  mongoServer = await MongoMemoryServer.create();
  const mongoUri = mongoServer.getUri();
  
  // Connect to test database
  await connect(mongoUri);
  
  console.log('Test database setup complete');
}, 30000); // 30 second timeout for setup

// Clean up after all tests
afterAll(async () => {
  // Disconnect from database
  await disconnect();
  
  // Stop MongoDB Memory Server
  if (mongoServer) {
    await mongoServer.stop();
  }
  
  console.log('Test database cleanup complete');
}, 30000); // 30 second timeout for cleanup

// Increase test timeout for database operations
jest.setTimeout(30000);