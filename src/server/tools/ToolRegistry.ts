import { MCPTool } from '../../types/mcp';

export class ToolRegistry {
  private static tools: MCPTool[] = [
    // Shipment tools
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

    // Contaminant tools
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

    // Inspection tools
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

  static getAllTools(): MCPTool[] {
    return this.tools;
  }

  static getTool(name: string): MCPTool | undefined {
    return this.tools.find(tool => tool.name === name);
  }
}
