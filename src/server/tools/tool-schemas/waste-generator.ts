import { MCPTool } from '../../../types/mcp';

const wasteGeneratorTools: MCPTool[] = [

    // Waste Generator tools
    {
      name: 'waste_generators_create',
      description: 'Create a new waste generator record',
      inputSchema: {
        type: 'object',
        properties: {
          uid: { type: 'string', description: 'Unique identifier for the waste generator' },
          client_uid: { type: 'string', description: 'Client unique identifier' },
          name: { type: 'string', description: 'Waste generator name' },
          external_reference_id: { type: 'string', description: 'External reference ID' },
          region: { type: 'string', description: 'Region' },
          // Contact information
          phone: { type: 'string', description: 'Phone number' },
          telephone: { type: 'string', description: 'Telephone number' },
          email: { type: 'string', description: 'Email address' },
          // Address information
          address: { type: 'string', description: 'Full address' },
          street_address: { type: 'string', description: 'Street address' },
          city: { type: 'string', description: 'City' },
          postal_code: { type: 'string', description: 'Postal code' },
          zip_code: { type: 'string', description: 'ZIP code' },
          country: { type: 'string', description: 'Country' },
          address_notes: { type: 'string', description: 'Address notes' },
          // Other fields
          source: { type: 'string', description: 'Source' },
          notes: { type: 'string', description: 'Additional notes' },
        },
        required: ['uid', 'name', 'client_uid'],
      },
    },
    {
      name: 'waste_generators_get',
      description: 'Get a waste generator by UID',
      inputSchema: {
        type: 'object',
        properties: {
          uid: { type: 'string', description: 'Unique identifier for the waste generator' },
        },
        required: ['uid'],
      },
    },
    {
      name: 'waste_generators_update',
      description: 'Update a waste generator record',
      inputSchema: {
        type: 'object',
        properties: {
          uid: { type: 'string', description: 'Unique identifier for the waste generator' },
          name: { type: 'string', description: 'Waste generator name' },
          external_reference_id: { type: 'string', description: 'External reference ID' },
          region: { type: 'string', description: 'Region' },
          // Contact information
          phone: { type: 'string', description: 'Phone number' },
          telephone: { type: 'string', description: 'Telephone number' },
          email: { type: 'string', description: 'Email address' },
          // Address information
          address: { type: 'string', description: 'Full address' },
          street_address: { type: 'string', description: 'Street address' },
          city: { type: 'string', description: 'City' },
          postal_code: { type: 'string', description: 'Postal code' },
          zip_code: { type: 'string', description: 'ZIP code' },
          country: { type: 'string', description: 'Country' },
          address_notes: { type: 'string', description: 'Address notes' },
          // Other fields
          source: { type: 'string', description: 'Source' },
          notes: { type: 'string', description: 'Additional notes' },
        },
        required: ['uid'],
      },
    },
    {
      name: 'waste_generators_delete',
      description: 'Delete a waste generator record',
      inputSchema: {
        type: 'object',
        properties: {
          uid: { type: 'string', description: 'Unique identifier for the waste generator' },
        },
        required: ['uid'],
      },
    },
    {
      name: 'waste_generators_list',
      description: 'List waste generators with optional filters',
      inputSchema: {
        type: 'object',
        properties: {
          client_uid: { type: 'string', description: 'Filter by client UID' },
          name: { type: 'string', description: 'Filter by name' },
          region: { type: 'string', description: 'Filter by region' },
          city: { type: 'string', description: 'Filter by city' },
          country: { type: 'string', description: 'Filter by country' },
          email: { type: 'string', description: 'Filter by email' },
          page: { type: 'number', description: 'Page number' },
          limit: { type: 'number', description: 'Items per page' },
        },
        required: ['page', 'limit'],
      },
    },

];

export default wasteGeneratorTools;