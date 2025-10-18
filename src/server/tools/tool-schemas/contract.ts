import { MCPTool } from '../../../types/mcp';

const contractTools: MCPTool[] = [
  {
    name: 'contracts_create',
    description: 'Create a new contract record',
    inputSchema: {
      type: 'object',
      properties: {
        uid: { type: 'string', description: 'Unique identifier for the contract' },
        facility_uid: { type: 'string', description: 'Facility unique identifier' },
        client_uid: { type: 'string', description: 'Client unique identifier' },
        title: { type: 'string', description: 'Contract title' },
        external_reference_id: { type: 'string', description: 'External reference ID' },
        external_waste_code_id: { type: 'string', description: 'External waste code ID' },
        start_date: { type: 'string', format: 'date-time', description: 'Contract start date' },
        end_date: { type: 'string', format: 'date-time', description: 'Contract end date' },
        tonnage_min: { type: 'number', description: 'Minimum tonnage' },
        tonnage_max: { type: 'number', description: 'Maximum tonnage' },
        tonnage_actual: { type: 'number', description: 'Actual tonnage' },
        source: { type: 'string', description: 'Data source' },
      },
      required: ['uid', 'facility_uid', 'client_uid'],
    },
  },
  {
    name: 'contracts_get',
    description: 'Get a contract by UID',
    inputSchema: {
      type: 'object',
      properties: {
        uid: { type: 'string', description: 'Unique identifier for the contract' },
      },
      required: ['uid'],
    },
  },
  {
    name: 'contracts_update',
    description: 'Update a contract record',
    inputSchema: {
      type: 'object',
      properties: {
        uid: { type: 'string', description: 'Unique identifier for the contract' },
        title: { type: 'string', description: 'Contract title' },
        tonnage_actual: { type: 'number', description: 'Actual tonnage' },
        end_date: { type: 'string', format: 'date-time', description: 'Contract end date' },
      },
      required: ['uid'],
    },
  },
  {
    name: 'contracts_delete',
    description: 'Delete a contract record',
    inputSchema: {
      type: 'object',
      properties: {
        uid: { type: 'string', description: 'Unique identifier for the contract' },
      },
      required: ['uid'],
    },
  },
  {
    name: 'contracts_list',
    description: 'List contracts with optional filters',
    inputSchema: {
      type: 'object',
      properties: {
        facility_uid: { type: 'string', description: 'Filter by facility UID' },
        client_uid: { type: 'string', description: 'Filter by client UID' },
        title: { type: 'string', description: 'Filter by contract title' },
        date_from: { type: 'string', format: 'date-time', description: 'Filter from date' },
        date_to: { type: 'string', format: 'date-time', description: 'Filter to date' },
        page: { type: 'number', description: 'Page number' },
        limit: { type: 'number', description: 'Items per page' },
      },
      required: ['page', 'limit'],
    },
  },
];

export default contractTools;