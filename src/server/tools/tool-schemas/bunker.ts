import { MCPTool } from '../../../types/mcp';

const bunkerTools: MCPTool[] = [
  {
    name: 'bunkers_create',
    description: 'Create a new bunker record',
    inputSchema: {
      type: 'object',
      properties: {
        name: { type: 'string', description: 'Bunker name' },
        facility_id: { type: 'string', description: 'Facility MongoDB ObjectId' },
        capacity: { type: 'number', description: 'Bunker capacity' },
        current_load: { type: 'number', description: 'Current load in bunker' },
        waste_type: { type: 'string', description: 'Type of waste stored' },
        status: { type: 'string', enum: ['active', 'inactive', 'maintenance'], description: 'Bunker status' },
        has_crane_arm: { type: 'boolean', description: 'Whether bunker has crane arm' },
        crane_arm_model_version: { type: 'string', description: 'Crane arm model version' },
        gate_number: { type: 'number', description: 'Gate number' },
        image_type: { type: 'string', description: 'Image type' },
        gcp_image_path: { type: 'string', description: 'Google Cloud Platform image path' }
      },
      required: ['name', 'facility_id']
    }
  },
  {
    name: 'bunkers_get',
    description: 'Get a bunker by ID',
    inputSchema: {
      type: 'object',
      properties: {
        id: { type: 'string', description: 'MongoDB ObjectId for the bunker' }
      },
      required: ['id']
    }
  },
  {
    name: 'bunkers_update',
    description: 'Update a bunker record',
    inputSchema: {
      type: 'object',
      properties: {
        id: { type: 'string', description: 'MongoDB ObjectId for the bunker' },
        name: { type: 'string', description: 'Bunker name' },
        capacity: { type: 'number', description: 'Bunker capacity' },
        current_load: { type: 'number', description: 'Current load in bunker' },
        waste_type: { type: 'string', description: 'Type of waste stored' },
        status: { type: 'string', enum: ['active', 'inactive', 'maintenance'], description: 'Bunker status' },
        has_crane_arm: { type: 'boolean', description: 'Whether bunker has crane arm' },
        crane_arm_model_version: { type: 'string', description: 'Crane arm model version' },
        gate_number: { type: 'number', description: 'Gate number' },
        image_type: { type: 'string', description: 'Image type' },
        gcp_image_path: { type: 'string', description: 'Google Cloud Platform image path' }
      },
      required: ['id']
    }
  },
  {
    name: 'bunkers_delete',
    description: 'Delete a bunker record',
    inputSchema: {
      type: 'object',
      properties: {
        id: { type: 'string', description: 'MongoDB ObjectId for the bunker' }
      },
      required: ['id']
    }
  },
  {
    name: 'bunkers_list',
    description: 'List bunkers with optional filters',
    inputSchema: {
      type: 'object',
      properties: {
        facility_id: { type: 'string', description: 'Filter by facility MongoDB ObjectId' },
        name: { type: 'string', description: 'Filter by bunker name' },
        status: { type: 'string', enum: ['active', 'inactive', 'maintenance'], description: 'Filter by status' },
        waste_type: { type: 'string', description: 'Filter by waste type' },
        client_id: { type: 'string', description: 'Filter by client MongoDB ObjectId' },
        page: { type: 'number', description: 'Page number' },
        limit: { type: 'number', description: 'Items per page' }
      },
      required: ['page', 'limit']
    }
  }
];

export default bunkerTools;