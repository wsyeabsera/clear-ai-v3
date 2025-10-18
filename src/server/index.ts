import { StdioTransport } from './transport/StdioTransport';
import { connectToDatabase } from './database/connection';

async function main() {
  try {
    // Connect to MongoDB
    const mongoUri = process.env.MONGODB_URI || 'mongodb://localhost:27017/waste-management';
    await connectToDatabase(mongoUri);

    // Start MCP server with stdio transport
    const transport = new StdioTransport();
    transport.start();
  } catch (error) {
    console.error('Failed to start MCP server:', error);
    process.exit(1);
  }
}

// Handle graceful shutdown
process.on('SIGINT', async () => {
  console.error('\nShutting down MCP server...');
  process.exit(0);
});

process.on('SIGTERM', async () => {
  console.error('\nShutting down MCP server...');
  process.exit(0);
});

main();
