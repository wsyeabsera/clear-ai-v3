import { MCPTool } from '../../../types/mcp';

const inspectionTools: MCPTool[] = [
  {
    name: 'inspections_create',
    description: 'Create a new inspection record',
    inputSchema: {
      type: 'object',
      properties: {
        uid: { type: 'string', description: 'Unique identifier for the inspection' },
        client_uid: { type: 'string', description: 'Client unique identifier' },
        facility_uid: { type: 'string', description: 'Facility unique identifier' },
        shipment_uid: { type: 'string', description: 'Shipment unique identifier' },
        delivery_accepted: { type: 'boolean', description: 'Delivery accepted status' },
        delivery_rejected: { type: 'boolean', description: 'Delivery rejected status' },
        comments: { type: 'string', description: 'Inspection comments' },
      },
      required: ['uid', 'client_uid', 'facility_uid', 'shipment_uid'],
    },
  },
  {
    name: 'inspections_get',
    description: 'Get an inspection by UID',
    inputSchema: {
      type: 'object',
      properties: {
        uid: { type: 'string', description: 'Unique identifier for the inspection' },
      },
      required: ['uid'],
    },
  },
  {
    name: 'inspections_update',
    description: 'Update an inspection record',
    inputSchema: {
      type: 'object',
      properties: {
        uid: { type: 'string', description: 'Unique identifier for the inspection' },
        delivery_accepted: { type: 'boolean', description: 'Delivery accepted status' },
        delivery_rejected: { type: 'boolean', description: 'Delivery rejected status' },
        comments: { type: 'string', description: 'Inspection comments' },
      },
      required: ['uid'],
    },
  },
  {
    name: 'inspections_delete',
    description: 'Delete an inspection record',
    inputSchema: {
      type: 'object',
      properties: {
        uid: { type: 'string', description: 'Unique identifier for the inspection' },
      },
      required: ['uid'],
    },
  },
  {
    name: 'inspections_list',
    description: 'List inspections with optional filters',
    inputSchema: {
      type: 'object',
      properties: {
        client_uid: { type: 'string', description: 'Filter by client UID' },
        facility_uid: { type: 'string', description: 'Filter by facility UID' },
        shipment_uid: { type: 'string', description: 'Filter by shipment UID' },
        delivery_accepted: { type: 'boolean', description: 'Filter by accepted status' },
        delivery_rejected: { type: 'boolean', description: 'Filter by rejected status' },
        date_from: { type: 'string', format: 'date-time', description: 'Filter from date' },
        date_to: { type: 'string', format: 'date-time', description: 'Filter to date' },
        page: { type: 'number', description: 'Page number' },
        limit: { type: 'number', description: 'Items per page' },
      },
      required: ['page', 'limit'],
    },
  },
];

export default inspectionTools;