import { MCPTool } from '../../../types/mcp';

const inspectionTools: MCPTool[] = [
  {
    name: 'inspections_create',
    description: 'Create a new inspection record',
    inputSchema: {
      type: 'object',
      properties: {
        id: { type: 'string', description: 'MongoDB ObjectId' },
        client_id: { type: 'string', description: 'Client MongoDB ObjectId' },
        facility_id: { type: 'string', description: 'Facility MongoDB ObjectId' },
        shipment_id: { type: 'string', description: 'Shipment MongoDB ObjectId' },
        delivery_accepted: { type: 'boolean', description: 'Delivery accepted status' },
        delivery_rejected: { type: 'boolean', description: 'Delivery rejected status' },
        comments: { type: 'string', description: 'Inspection comments' },
      },
      required: ['id', 'client_uid', 'facility_uid', 'shipment_uid'],
    },
  },
  {
    name: 'inspections_get',
    description: 'Get an inspection by UID',
    inputSchema: {
      type: 'object',
      properties: {
        id: { type: 'string', description: 'MongoDB ObjectId' },
      },
      required: ['id'],
    },
  },
  {
    name: 'inspections_update',
    description: 'Update an inspection record',
    inputSchema: {
      type: 'object',
      properties: {
        id: { type: 'string', description: 'MongoDB ObjectId' },
        delivery_accepted: { type: 'boolean', description: 'Delivery accepted status' },
        delivery_rejected: { type: 'boolean', description: 'Delivery rejected status' },
        comments: { type: 'string', description: 'Inspection comments' },
      },
      required: ['id'],
    },
  },
  {
    name: 'inspections_delete',
    description: 'Delete an inspection record',
    inputSchema: {
      type: 'object',
      properties: {
        id: { type: 'string', description: 'MongoDB ObjectId' },
      },
      required: ['id'],
    },
  },
  {
    name: 'inspections_list',
    description: 'List inspections with optional filters',
    inputSchema: {
      type: 'object',
      properties: {
        client_uid: { type: 'string', description: 'Filter by client ID' },
        facility_uid: { type: 'string', description: 'Filter by facility ID' },
        shipment_uid: { type: 'string', description: 'Filter by shipment ID' },
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