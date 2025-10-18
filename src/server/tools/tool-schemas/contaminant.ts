import { MCPTool } from '../../../types/mcp';

const contaminantTools: MCPTool[] = [
  {
    name: 'contaminants_create',
    description: 'Create a new contaminant record',
    inputSchema: {
      type: 'object',
      properties: {
        uid: { type: 'string', description: 'Unique identifier for the contaminant' },
        client_uid: { type: 'string', description: 'Client unique identifier' },
        facility_uid: { type: 'string', description: 'Facility unique identifier' },
        shipment_uid: { type: 'string', description: 'Shipment unique identifier' },
        material: { type: 'string', description: 'Contaminant material type' },
        estimated_size: { type: 'number', description: 'Estimated size' },
        notes: { type: 'string', description: 'Additional notes' },
      },
      required: ['uid', 'client_uid', 'facility_uid', 'shipment_uid'],
    },
  },
  {
    name: 'contaminants_get',
    description: 'Get a contaminant by UID',
    inputSchema: {
      type: 'object',
      properties: {
        uid: { type: 'string', description: 'Unique identifier for the contaminant' },
      },
      required: ['uid'],
    },
  },
  {
    name: 'contaminants_update',
    description: 'Update a contaminant record',
    inputSchema: {
      type: 'object',
      properties: {
        uid: { type: 'string', description: 'Unique identifier for the contaminant' },
        material: { type: 'string', description: 'Contaminant material type' },
        estimated_size: { type: 'number', description: 'Estimated size' },
        notes: { type: 'string', description: 'Additional notes' },
      },
      required: ['uid'],
    },
  },
  {
    name: 'contaminants_delete',
    description: 'Delete a contaminant record',
    inputSchema: {
      type: 'object',
      properties: {
        uid: { type: 'string', description: 'Unique identifier for the contaminant' },
      },
      required: ['uid'],
    },
  },
  {
    name: 'contaminants_list',
    description: 'List contaminants with optional filters',
    inputSchema: {
      type: 'object',
      properties: {
        facility_uid: { type: 'string', description: 'Filter by facility UID' },
        shipment_uid: { type: 'string', description: 'Filter by shipment UID' },
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