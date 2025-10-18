import { MCPTool } from '../../../types/mcp';

const shipmentTools: MCPTool[] = [
  {
    name: 'shipments_create',
    description: 'Create a new shipment record',
    inputSchema: {
      type: 'object',
      properties: {
        uid: { type: 'string', description: 'Unique identifier for the shipment' },
        client_uid: { type: 'string', description: 'Client unique identifier' },
        license_plate: { type: 'string', description: 'Vehicle license plate' },
        entry_weight: { type: 'number', description: 'Entry weight in kg' },
        exit_weight: { type: 'number', description: 'Exit weight in kg' },
        entry_timestamp: { type: 'string', format: 'date-time', description: 'Entry timestamp' },
        exit_timestamp: { type: 'string', format: 'date-time', description: 'Exit timestamp' },
        facility_uid: { type: 'string', description: 'Facility unique identifier' },
        gate_number: { type: 'number', description: 'Gate number' },
        notes: { type: 'string', description: 'Additional notes' },
      },
      required: ['uid', 'client_uid', 'license_plate'],
    },
  },
  {
    name: 'shipments_get',
    description: 'Get a shipment by UID',
    inputSchema: {
      type: 'object',
      properties: {
        uid: { type: 'string', description: 'Unique identifier for the shipment' },
      },
      required: ['uid'],
    },
  },
  {
    name: 'shipments_update',
    description: 'Update a shipment record',
    inputSchema: {
      type: 'object',
      properties: {
        uid: { type: 'string', description: 'Unique identifier for the shipment' },
        entry_weight: { type: 'number', description: 'Entry weight in kg' },
        exit_weight: { type: 'number', description: 'Exit weight in kg' },
        notes: { type: 'string', description: 'Additional notes' },
      },
      required: ['uid'],
    },
  },
  {
    name: 'shipments_delete',
    description: 'Delete a shipment record',
    inputSchema: {
      type: 'object',
      properties: {
        uid: { type: 'string', description: 'Unique identifier for the shipment' },
      },
      required: ['uid'],
    },
  },
  {
    name: 'shipments_list',
    description: 'List shipments with optional filters',
    inputSchema: {
      type: 'object',
      properties: {
        client_uid: { type: 'string', description: 'Filter by client UID' },
        facility_uid: { type: 'string', description: 'Filter by facility UID' },
        license_plate: { type: 'string', description: 'Filter by license plate' },
        date_from: { type: 'string', format: 'date-time', description: 'Filter from date' },
        date_to: { type: 'string', format: 'date-time', description: 'Filter to date' },
        page: { type: 'number', description: 'Page number' },
        limit: { type: 'number', description: 'Items per page' },
      },
      required: ['page', 'limit'],
    },
  },
];

export default shipmentTools;