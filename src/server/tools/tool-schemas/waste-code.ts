import { MCPTool } from '../../../types/mcp';

const wasteCodeTools: MCPTool[] = [

  // Waste Code tools
  {
    name: 'waste_codes_create',
    description: 'Create a new waste code record',
    inputSchema: {
      type: 'object',
      properties: {
        id: { type: 'string', description: 'MongoDB ObjectId' },
        code: { type: 'string', description: 'Waste code' },
        name: { type: 'string', description: 'Waste code name' },
        description: { type: 'string', description: 'Waste code description' },
        color_code: { type: 'string', description: 'Color code for display' },
        code_with_spaces: { type: 'string', description: 'Code with spaces' },
        calorific_value_min: { type: 'number', description: 'Minimum calorific value' },
        calorific_value_max: { type: 'number', description: 'Maximum calorific value' },
        calorific_value_comment: { type: 'string', description: 'Calorific value comment' },
        source: { type: 'string', description: 'Data source' },
      },
      required: ['code', 'name'],
    },
  },
  {
    name: 'waste_codes_get',
    description: 'Get a waste code by ID',
    inputSchema: {
      type: 'object',
      properties: {
        id: { type: 'string', description: 'MongoDB ObjectId' },
      },
      required: ['id'],
    },
  },
  {
    name: 'waste_codes_update',
    description: 'Update a waste code record',
    inputSchema: {
      type: 'object',
      properties: {
        id: { type: 'string', description: 'MongoDB ObjectId' },
        name: { type: 'string', description: 'Waste code name' },
        description: { type: 'string', description: 'Waste code description' },
        calorific_value_min: { type: 'number', description: 'Minimum calorific value' },
        calorific_value_max: { type: 'number', description: 'Maximum calorific value' },
      },
      required: ['id'],
    },
  },
  {
    name: 'waste_codes_delete',
    description: 'Delete a waste code record',
    inputSchema: {
      type: 'object',
      properties: {
        id: { type: 'string', description: 'MongoDB ObjectId' },
      },
      required: ['id'],
    },
  },
  {
    name: 'waste_codes_list',
    description: 'List waste codes with optional filters',
    inputSchema: {
      type: 'object',
      properties: {
        code: { type: 'string', description: 'Filter by waste code' },
        name: { type: 'string', description: 'Filter by name' },
        page: { type: 'number', description: 'Page number' },
        limit: { type: 'number', description: 'Items per page' },
      },
      required: ['page', 'limit'],
    },
  },
];

export default wasteCodeTools;