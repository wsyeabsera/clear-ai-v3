import { MCPTool } from '../../../types/mcp';

const facilityTools: MCPTool[] = [
  // Facility tools
  {
    name: 'facilities_create',
    description: 'Create a new facility record',
    inputSchema: {
      type: 'object',
      properties: {
        uid: { type: 'string', description: 'Unique identifier for the facility' },
        name: { type: 'string', description: 'Facility name' },
        client_uid: { type: 'string', description: 'Client unique identifier' },
        address: { type: 'string', description: 'Street address' },
        city: { type: 'string', description: 'City' },
        country: { type: 'string', description: 'Country' },
        email: { type: 'string', description: 'Contact email' },
        phone: { type: 'string', description: 'Contact phone' },
      },
      required: ['uid', 'name', 'client_uid'],
    },
  },
  {
    name: 'facilities_get',
    description: 'Get a facility by UID',
    inputSchema: {
      type: 'object',
      properties: {
        uid: { type: 'string', description: 'Unique identifier for the facility' },
      },
      required: ['uid'],
    },
  },
  {
    name: 'facilities_update',
    description: 'Update a facility record',
    inputSchema: {
      type: 'object',
      properties: {
        uid: { type: 'string', description: 'Unique identifier for the facility' },
        name: { type: 'string', description: 'Facility name' },
        address: { type: 'string', description: 'Street address' },
        email: { type: 'string', description: 'Contact email' },
      },
      required: ['uid'],
    },
  },
  {
    name: 'facilities_delete',
    description: 'Delete a facility record',
    inputSchema: {
      type: 'object',
      properties: {
        uid: { type: 'string', description: 'Unique identifier for the facility' },
      },
      required: ['uid'],
    },
  },
  {
    name: 'facilities_list',
    description: 'List facilities with optional filters',
    inputSchema: {
      type: 'object',
      properties: {
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