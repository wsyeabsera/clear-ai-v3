import mongoose from 'mongoose';

export const connectToDatabase = async (uri?: string): Promise<void> => {
  const mongoUri = uri || process.env.MONGODB_URI || 'mongodb://localhost:27017/waste-management';
  
  try {
    await mongoose.connect(mongoUri);
    console.error('[MCP Server] Connected to MongoDB');
  } catch (error) {
    console.error('[MCP Server] MongoDB connection error:', error);
    throw error;
  }
};

export const disconnectFromDatabase = async (): Promise<void> => {
  try {
    await mongoose.connection.close();
    console.error('[MCP Server] Disconnected from MongoDB');
  } catch (error) {
    console.error('[MCP Server] MongoDB disconnection error:', error);
    throw error;
  }
};
