import { MCPTool } from '../../../types/mcp';

const wastePropertyTools: MCPTool[] = [
  {
    name: 'waste_properties_create',
    description: 'Create a new waste property record',
    inputSchema: {
      type: 'object',
      properties: {
        id: { type: 'string', description: 'MongoDB ObjectId' },
        client_id: { type: 'string', description: 'Client MongoDB ObjectId' },
        contract_id: { type: 'string', description: 'Contract MongoDB ObjectId' },
        // Waste details
        waste_description: { type: 'string', description: 'Waste description' },
        waste_amount: { type: 'number', description: 'Waste amount in tons' },
        waste_designation: { type: 'string', description: 'Waste designation' },
        // Properties (arrays)
        consistency: { type: 'array', items: { type: 'string' }, description: 'Consistency types' },
        type_of_waste: { type: 'array', items: { type: 'string' }, description: 'Types of waste' },
        processing_steps: { type: 'array', items: { type: 'string' }, description: 'Processing steps' },
        // Calorific properties
        min_calorific_value: { type: 'number', description: 'Minimum calorific value (MJ/kg)' },
        calorific_value: { type: 'number', description: 'Calorific value (MJ/kg)' },
        biogenic_part: { type: 'number', description: 'Biogenic part percentage' },
        plastic_content: { type: 'number', description: 'Plastic content percentage' },
        edge_length: { type: 'number', description: 'Edge length in mm' },
        // Chemical composition
        water: { type: 'number', description: 'Water content percentage' },
        ash: { type: 'number', description: 'Ash content percentage' },
        fluorine: { type: 'number', description: 'Fluorine content (ppm)' },
        sulfur: { type: 'number', description: 'Sulfur content (ppm)' },
        chlorine: { type: 'number', description: 'Chlorine content (ppm)' },
        flue_gas: { type: 'number', description: 'Flue gas content' },
        // Heavy metals
        mercury: { type: 'number', description: 'Mercury content (ppm)' },
        cadmium: { type: 'number', description: 'Cadmium content (ppm)' },
        lead: { type: 'number', description: 'Lead content (ppm)' },
        copper: { type: 'number', description: 'Copper content (ppm)' },
        zinc: { type: 'number', description: 'Zinc content (ppm)' },
        phosphate: { type: 'number', description: 'Phosphate content (ppm)' },
        // Other
        comments: { type: 'string', description: 'Additional comments' },
      },
      required: ['id', 'client_uid', 'contract_uid'],
    },
  },
  {
    name: 'waste_properties_get',
    description: 'Get a waste property by ID',
    inputSchema: {
      type: 'object',
      properties: {
        id: { type: 'string', description: 'MongoDB ObjectId' },
      },
      required: ['id'],
    },
  },
  {
    name: 'waste_properties_update',
    description: 'Update a waste property record',
    inputSchema: {
      type: 'object',
      properties: {
        id: { type: 'string', description: 'MongoDB ObjectId' },
        // Waste details
        waste_description: { type: 'string', description: 'Waste description' },
        waste_amount: { type: 'number', description: 'Waste amount in tons' },
        waste_designation: { type: 'string', description: 'Waste designation' },
        // Properties (arrays)
        consistency: { type: 'array', items: { type: 'string' }, description: 'Consistency types' },
        type_of_waste: { type: 'array', items: { type: 'string' }, description: 'Types of waste' },
        processing_steps: { type: 'array', items: { type: 'string' }, description: 'Processing steps' },
        // Calorific properties
        min_calorific_value: { type: 'number', description: 'Minimum calorific value (MJ/kg)' },
        calorific_value: { type: 'number', description: 'Calorific value (MJ/kg)' },
        biogenic_part: { type: 'number', description: 'Biogenic part percentage' },
        plastic_content: { type: 'number', description: 'Plastic content percentage' },
        edge_length: { type: 'number', description: 'Edge length in mm' },
        // Chemical composition
        water: { type: 'number', description: 'Water content percentage' },
        ash: { type: 'number', description: 'Ash content percentage' },
        fluorine: { type: 'number', description: 'Fluorine content (ppm)' },
        sulfur: { type: 'number', description: 'Sulfur content (ppm)' },
        chlorine: { type: 'number', description: 'Chlorine content (ppm)' },
        flue_gas: { type: 'number', description: 'Flue gas content' },
        // Heavy metals
        mercury: { type: 'number', description: 'Mercury content (ppm)' },
        cadmium: { type: 'number', description: 'Cadmium content (ppm)' },
        lead: { type: 'number', description: 'Lead content (ppm)' },
        copper: { type: 'number', description: 'Copper content (ppm)' },
        zinc: { type: 'number', description: 'Zinc content (ppm)' },
        phosphate: { type: 'number', description: 'Phosphate content (ppm)' },
        // Other
        comments: { type: 'string', description: 'Additional comments' },
      },
      required: ['id'],
    },
  },
  {
    name: 'waste_properties_delete',
    description: 'Delete a waste property record (soft delete)',
    inputSchema: {
      type: 'object',
      properties: {
        id: { type: 'string', description: 'MongoDB ObjectId' },
      },
      required: ['id'],
    },
  },
  {
    name: 'waste_properties_list',
    description: 'List waste properties with optional filters',
    inputSchema: {
      type: 'object',
      properties: {
        client_uid: { type: 'string', description: 'Filter by client ID' },
        contract_uid: { type: 'string', description: 'Filter by contract ID' },
        min_calorific_value: { type: 'number', description: 'Filter by minimum calorific value' },
        max_calorific_value: { type: 'number', description: 'Filter by maximum calorific value' },
        page: { type: 'number', description: 'Page number' },
        limit: { type: 'number', description: 'Items per page' },
      },
      required: ['page', 'limit'],
    },
  },
];

export default wastePropertyTools;

