import { MCPTool } from '../../../types/mcp';

const facilityTools: MCPTool[] = [
  // Facility tools
  {
    name: 'facilities_create',
    description: 'Create a new facility record',
    inputSchema: {
      type: 'object',
      properties: {
        id: { type: 'string', description: 'MongoDB ObjectId for the facility' },
        name: { type: 'string', description: 'Facility name' },
        client_id: { type: 'string', description: 'Client MongoDB ObjectId' },
        address: { type: 'string', description: 'Street address' },
        city: { type: 'string', description: 'City' },
        country: { type: 'string', description: 'Country' },
        email: { type: 'string', description: 'Contact email' },
        phone: { type: 'string', description: 'Contact phone' },
      },
      required: ['name', 'client_id'],
    },
  },
  {
    name: 'facilities_get',
    description: 'Get a facility by ID',
    inputSchema: {
      type: 'object',
      properties: {
        id: { type: 'string', description: 'MongoDB ObjectId for the facility' },
      },
      required: ['id'],
    },
  },
  {
    name: 'facilities_update',
    description: 'Update a facility record',
    inputSchema: {
      type: 'object',
      properties: {
        id: { type: 'string', description: 'MongoDB ObjectId for the facility' },
        name: { type: 'string', description: 'Facility name' },
        address: { type: 'string', description: 'Street address' },
        email: { type: 'string', description: 'Contact email' },
      },
      required: ['id'],
    },
  },
  {
    name: 'facilities_delete',
    description: 'Delete a facility record',
    inputSchema: {
      type: 'object',
      properties: {
        id: { type: 'string', description: 'MongoDB ObjectId for the facility' },
      },
      required: ['id'],
    },
  },
  {
    name: 'facilities_list',
    description: 'List facilities with optional filters',
    inputSchema: {
      type: 'object',
      properties: {
        client_id: { type: 'string', description: 'Filter by client ID' },
        name: { type: 'string', description: 'Filter by name' },
        city: { type: 'string', description: 'Filter by city' },
        country: { type: 'string', description: 'Filter by country' },
        page: { type: 'number', description: 'Page number' },
        limit: { type: 'number', description: 'Items per page' },
      },
      required: ['page', 'limit'],
    },
  },
];

export default facilityTools;