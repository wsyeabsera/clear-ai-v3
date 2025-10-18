import { MCPTool } from '../../../types/mcp';

const contaminantTools: MCPTool[] = [
  {
    name: 'contaminants_create',
    description: 'Create a new contaminant record',
    inputSchema: {
      type: 'object',
      properties: {
        id: { type: 'string', description: 'MongoDB ObjectId' },
        client_id: { type: 'string', description: 'Client MongoDB ObjectId' },
        facility_id: { type: 'string', description: 'Facility MongoDB ObjectId' },
        shipment_id: { type: 'string', description: 'Shipment MongoDB ObjectId' },
        material: { type: 'string', description: 'Contaminant material type' },
        estimated_size: { type: 'number', description: 'Estimated size' },
        notes: { type: 'string', description: 'Additional notes' },
      },
      required: ['id', 'client_uid', 'facility_uid', 'shipment_uid'],
    },
  },
  {
    name: 'contaminants_get',
    description: 'Get a contaminant by ID',
    inputSchema: {
      type: 'object',
      properties: {
        id: { type: 'string', description: 'MongoDB ObjectId' },
      },
      required: ['id'],
    },
  },
  {
    name: 'contaminants_update',
    description: 'Update a contaminant record',
    inputSchema: {
      type: 'object',
      properties: {
        id: { type: 'string', description: 'MongoDB ObjectId' },
        material: { type: 'string', description: 'Contaminant material type' },
        estimated_size: { type: 'number', description: 'Estimated size' },
        notes: { type: 'string', description: 'Additional notes' },
      },
      required: ['id'],
    },
  },
  {
    name: 'contaminants_delete',
    description: 'Delete a contaminant record',
    inputSchema: {
      type: 'object',
      properties: {
        id: { type: 'string', description: 'MongoDB ObjectId' },
      },
      required: ['id'],
    },
  },
  {
    name: 'contaminants_list',
    description: 'List contaminants with optional filters',
    inputSchema: {
      type: 'object',
      properties: {
        facility_uid: { type: 'string', description: 'Filter by facility ID' },
        shipment_uid: { type: 'string', description: 'Filter by shipment ID' },
        material: { type: 'string', description: 'Filter by material' },
        is_verified: { type: 'boolean', description: 'Filter by verification status' },
        date_from: { type: 'string', format: 'date-time', description: 'Filter from date' },
        date_to: { type: 'string', format: 'date-time', description: 'Filter to date' },
        page: { type: 'number', description: 'Page number' },
        limit: { type: 'number', description: 'Items per page' },
      },
      required: ['page', 'limit'],
    },
  },
];

export default contaminantTools;