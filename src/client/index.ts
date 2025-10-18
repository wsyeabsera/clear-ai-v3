import { ApolloServer } from '@apollo/server';
import { startStandaloneServer } from '@apollo/server/standalone';
import { ApolloServerPluginLandingPageLocalDefault } from '@apollo/server/plugin/landingPage/default';
import { readFileSync } from 'fs';
import { join } from 'path';
import { MCPClient } from './MCPClient';
import { DynamicToolExecutor } from './DynamicToolExecutor';
import { plannerResolvers } from '../agents/planner/graphql/resolvers';
import { connectToDatabase } from '../server/database/connection';
import GraphQLJSON from 'graphql-type-json';

// Read GraphQL schema
const schemaPath = process.env.NODE_ENV === 'production' 
  ? join(__dirname, 'schema.graphql')
  : join(__dirname, '../client/schema.graphql');
const typeDefs = readFileSync(schemaPath, 'utf-8');

// Initialize MCP client and executor
const mcpClient = new MCPClient();
const executor = new DynamicToolExecutor(mcpClient);

// Define resolvers
const resolvers = {
  JSON: GraphQLJSON,
  
  Query: {
    listTools: async () => {
      return await executor.listAvailableTools();
    },
    ...plannerResolvers.Query,
  },
  
  Mutation: {
    executeTool: async (_: any, { name, params }: { name: string; params: any }) => {
      return await executor.executeTool(name, params);
    },
    ...plannerResolvers.Mutation,
  },
};

async function startServer() {
  try {
    // Connect to MongoDB first
    await connectToDatabase();
    console.log('[Apollo Server] Connected to MongoDB');
    
    // Connect to MCP server
    const serverPath = process.env.NODE_ENV === 'production' 
      ? join(__dirname, '../server/index.js')
      : join(__dirname, '../server/index.ts');
    console.log('[Apollo Server] Connecting to MCP server at:', serverPath);
    await mcpClient.connect(serverPath);
    console.log('[Apollo Server] Connected to MCP server');

    // Create Apollo Server
    const server = new ApolloServer({
      typeDefs,
      resolvers,
      csrfPrevention: false, // Disable CSRF for development
      plugins: [
        ApolloServerPluginLandingPageLocalDefault({ embed: true }),
      ],
    });

    // Start the server
    const { url } = await startStandaloneServer(server, {
      listen: { port: 4000 },
      context: async ({ req }) => ({ req }),
    });

    console.log(`🚀 Apollo Server ready at ${url}`);
    console.log(`📝 GraphQL Playground: ${url}`);
  } catch (error) {
    console.error('Failed to start Apollo server:', error);
    process.exit(1);
  }
}

// Handle graceful shutdown only when explicitly requested
process.on('SIGINT', async () => {
  console.log('\nReceived SIGINT, shutting down gracefully...');
  await mcpClient.disconnect();
  process.exit(0);
});

process.on('SIGTERM', async () => {
  console.log('\nReceived SIGTERM, shutting down gracefully...');
  await mcpClient.disconnect();
  process.exit(0);
});

// Keep the process alive
process.on('uncaughtException', (error) => {
  console.error('Uncaught Exception:', error);
  // Don't exit on uncaught exceptions in development
});

process.on('unhandledRejection', (reason, promise) => {
  console.error('Unhandled Rejection at:', promise, 'reason:', reason);
  // Don't exit on unhandled rejections in development
});

startServer();
