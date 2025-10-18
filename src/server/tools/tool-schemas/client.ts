import { MCPTool } from '../../../types/mcp';

const clientTools: MCPTool[] = [
  {
    name: 'clients_create',
    description: 'Create a new client record',
    inputSchema: {
      type: 'object',
      properties: {
        name: { type: 'string', description: 'Client name' }
      },
      required: ['name']
    }
  },
  {
    name: 'clients_get',
    description: 'Get a client by ID',
    inputSchema: {
      type: 'object',
      properties: {
        id: { type: 'string', description: 'MongoDB ObjectId for the client' }
      },
      required: ['id']
    }
  },
  {
    name: 'clients_update',
    description: 'Update a client record',
    inputSchema: {
      type: 'object',
      properties: {
        id: { type: 'string', description: 'MongoDB ObjectId for the client' },
        name: { type: 'string', description: 'Client name' }
      },
      required: ['id']
    }
  },
  {
    name: 'clients_delete',
    description: 'Delete a client record',
    inputSchema: {
      type: 'object',
      properties: {
        id: { type: 'string', description: 'MongoDB ObjectId for the client' }
      },
      required: ['id']
    }
  },
  {
    name: 'clients_list',
    description: 'List clients with optional filters',
    inputSchema: {
      type: 'object',
      properties: {
        name: { type: 'string', description: 'Filter by client name' },
        page: { type: 'number', description: 'Page number' },
        limit: { type: 'number', description: 'Items per page' }
      },
      required: ['page', 'limit']
    }
  }
];

export default clientTools;