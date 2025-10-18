import { MCPClient } from '../../../src/client/MCPClient';
import { DynamicToolExecutor } from '../../../src/client/DynamicToolExecutor';
import path from 'path';

// Skip integration tests by default (they require building the project first)
describe('MCP Protocol Validation Tests', () => {
  let mcpClient: MCPClient;
  let executor: DynamicToolExecutor;

  beforeAll(async () => {
    // Connect MCP client to server
    mcpClient = new MCPClient();
    const serverPath = path.join(__dirname, '../../../dist/server/index.js');
    await mcpClient.connect(serverPath);
    
    executor = new DynamicToolExecutor(mcpClient);
  });

  afterAll(async () => {
    if (mcpClient) {
      await mcpClient.disconnect();
    }
  });

  describe('Tool Discovery and Schema Validation', () => {
    it('should discover all expected tools', async () => {
      const tools = await executor.listAvailableTools();
      
      expect(Array.isArray(tools)).toBe(true);
      expect(tools.length).toBeGreaterThan(50); // Should have 55+ tools (11 entities × 5 operations)

      // Verify all expected tool categories exist
      const toolNames = tools.map((t: any) => t.name);
      
      // Client tools
      expect(toolNames).toContain('clients_create');
      expect(toolNames).toContain('clients_get');
      expect(toolNames).toContain('clients_update');
      expect(toolNames).toContain('clients_delete');
      expect(toolNames).toContain('clients_list');

      // Facility tools
      expect(toolNames).toContain('facilities_create');
      expect(toolNames).toContain('facilities_get');
      expect(toolNames).toContain('facilities_update');
      expect(toolNames).toContain('facilities_delete');
      expect(toolNames).toContain('facilities_list');

      // Shipment tools
      expect(toolNames).toContain('shipments_create');
      expect(toolNames).toContain('shipments_get');
      expect(toolNames).toContain('shipments_update');
      expect(toolNames).toContain('shipments_delete');
      expect(toolNames).toContain('shipments_list');

      // Contaminant tools
      expect(toolNames).toContain('contaminants_create');
      expect(toolNames).toContain('contaminants_get');
      expect(toolNames).toContain('contaminants_update');
      expect(toolNames).toContain('contaminants_delete');
      expect(toolNames).toContain('contaminants_list');

      // Inspection tools
      expect(toolNames).toContain('inspections_create');
      expect(toolNames).toContain('inspections_get');
      expect(toolNames).toContain('inspections_update');
      expect(toolNames).toContain('inspections_delete');
      expect(toolNames).toContain('inspections_list');

      // Contract tools
      expect(toolNames).toContain('contracts_create');
      expect(toolNames).toContain('contracts_get');
      expect(toolNames).toContain('contracts_update');
      expect(toolNames).toContain('contracts_delete');
      expect(toolNames).toContain('contracts_list');

      // Waste code tools
      expect(toolNames).toContain('waste_codes_create');
      expect(toolNames).toContain('waste_codes_get');
      expect(toolNames).toContain('waste_codes_update');
      expect(toolNames).toContain('waste_codes_delete');
      expect(toolNames).toContain('waste_codes_list');

      // Waste generator tools
      expect(toolNames).toContain('waste_generators_create');
      expect(toolNames).toContain('waste_generators_get');
      expect(toolNames).toContain('waste_generators_update');
      expect(toolNames).toContain('waste_generators_delete');
      expect(toolNames).toContain('waste_generators_list');

      // Waste property tools
      expect(toolNames).toContain('waste_properties_create');
      expect(toolNames).toContain('waste_properties_get');
      expect(toolNames).toContain('waste_properties_update');
      expect(toolNames).toContain('waste_properties_delete');
      expect(toolNames).toContain('waste_properties_list');

      // Shipment waste composition tools
      expect(toolNames).toContain('shipment_waste_compositions_create');
      expect(toolNames).toContain('shipment_waste_compositions_get');
      expect(toolNames).toContain('shipment_waste_compositions_update');
      expect(toolNames).toContain('shipment_waste_compositions_delete');
      expect(toolNames).toContain('shipment_waste_compositions_list');
    });

    it('should have valid tool schemas', async () => {
      const tools = await executor.listAvailableTools();
      
      for (const tool of tools) {
        expect(tool.name).toBeDefined();
        expect(tool.description).toBeDefined();
        expect(tool.inputSchema).toBeDefined();
        expect(tool.inputSchema.type).toBe('object');
        expect(tool.inputSchema.properties).toBeDefined();
        expect(tool.inputSchema.required).toBeDefined();
        expect(Array.isArray(tool.inputSchema.required)).toBe(true);
      }
    });

    it('should have consistent naming conventions', async () => {
      const tools = await executor.listAvailableTools();
      
      for (const tool of tools) {
        // Tool names should follow pattern: entity_operation
        expect(tool.name).toMatch(/^[a-z_]+_[a-z]+$/);
        
        // Should end with one of the standard operations
        const validOperations = ['create', 'get', 'update', 'delete', 'list'];
        const operation = tool.name.split('_').pop();
        expect(validOperations).toContain(operation);
      }
    });
  });

  describe('Input Schema Validation', () => {
    it('should validate required fields for create operations', async () => {
      // Test clients_create without required name field
      const result = await executor.executeTool('clients_create', {});
      expect(result.success).toBe(false);
      expect(result.error).toContain('name');
    });

    it('should validate required fields for get operations', async () => {
      // Test clients_get without required id field
      const result = await executor.executeTool('clients_get', {});
      expect(result.success).toBe(false);
      expect(result.error).toContain('id');
    });

    it('should validate required fields for list operations', async () => {
      // Test clients_list without required page and limit fields
      const result = await executor.executeTool('clients_list', {});
      expect(result.success).toBe(false);
      expect(result.error).toContain('page');
    });

    it('should accept valid input schemas', async () => {
      // Test clients_create with valid input
      const result = await executor.executeTool('clients_create', {
        name: 'Test Client'
      });
      expect(result.success).toBe(true);
      
      // Clean up
      await executor.executeTool('clients_delete', {
        id: result.data._id
      });
    });
  });

  describe('Error Response Format Validation', () => {
    it('should return consistent error format for missing fields', async () => {
      const result = await executor.executeTool('clients_create', {});
      
      expect(result.success).toBe(false);
      expect(result.error).toBeDefined();
      expect(typeof result.error).toBe('string');
      expect(result.data).toBeUndefined();
    });

    it('should return consistent error format for invalid IDs', async () => {
      const result = await executor.executeTool('clients_get', {
        id: 'invalid-id'
      });
      
      expect(result.success).toBe(false);
      expect(result.error).toBeDefined();
      expect(typeof result.error).toBe('string');
      expect(result.data).toBeUndefined();
    });

    it('should return consistent error format for non-existent resources', async () => {
      const result = await executor.executeTool('clients_get', {
        id: '507f1f77bcf86cd799439011' // Valid ObjectId format but non-existent
      });
      
      expect(result.success).toBe(false);
      expect(result.error).toBeDefined();
      expect(typeof result.error).toBe('string');
      expect(result.data).toBeUndefined();
    });

    it('should return consistent success format', async () => {
      const result = await executor.executeTool('clients_create', {
        name: 'Test Client'
      });
      
      expect(result.success).toBe(true);
      expect(result.data).toBeDefined();
      expect(result.data._id).toBeDefined();
      expect(result.message).toBeDefined();
      
      // Clean up
      await executor.executeTool('clients_delete', {
        id: result.data._id
      });
    });
  });

  describe('Connection Handling', () => {
    it('should handle connection gracefully', async () => {
      expect(mcpClient).toBeDefined();
      expect(executor).toBeDefined();
    });

    it('should handle tool execution after connection', async () => {
      const result = await executor.executeTool('clients_create', {
        name: 'Connection Test Client'
      });
      
      expect(result.success).toBe(true);
      
      // Clean up
      await executor.executeTool('clients_delete', {
        id: result.data._id
      });
    });
  });

  describe('Tool Parameter Validation', () => {
    it('should validate ObjectId format for ID parameters', async () => {
      const invalidIds = [
        'invalid-id',
        '123',
        'not-an-objectid',
        '',
        null,
        undefined
      ];

      for (const invalidId of invalidIds) {
        const result = await executor.executeTool('clients_get', {
          id: invalidId
        });
        
        expect(result.success).toBe(false);
        expect(result.error).toBeDefined();
      }
    });

    it('should validate required string fields', async () => {
      const result = await executor.executeTool('clients_create', {
        name: '' // Empty string should fail validation
      });
      
      expect(result.success).toBe(false);
      expect(result.error).toBeDefined();
    });

    it('should validate numeric fields', async () => {
      // Create a client first
      const clientResult = await executor.executeTool('clients_create', {
        name: 'Test Client'
      });
      expect(clientResult.success).toBe(true);

      // Test with invalid numeric values
      const facilityResult = await executor.executeTool('facilities_create', {
        name: 'Test Facility',
        client_id: clientResult.data._id,
        city: 'Test City',
        country: 'Test Country',
        gate_number: 'not-a-number' // Should fail validation
      });
      
      expect(facilityResult.success).toBe(false);
      expect(facilityResult.error).toBeDefined();

      // Clean up
      await executor.executeTool('clients_delete', {
        id: clientResult.data._id
      });
    });
  });

  describe('Pagination Validation', () => {
    it('should validate pagination parameters', async () => {
      // Test with invalid page number
      const result1 = await executor.executeTool('clients_list', {
        page: 0, // Should be >= 1
        limit: 10
      });
      expect(result1.success).toBe(false);

      // Test with invalid limit
      const result2 = await executor.executeTool('clients_list', {
        page: 1,
        limit: 0 // Should be >= 1
      });
      expect(result2.success).toBe(false);

      // Test with valid pagination
      const result3 = await executor.executeTool('clients_list', {
        page: 1,
        limit: 10
      });
      expect(result3.success).toBe(true);
      expect(Array.isArray(result3.data)).toBe(true);
    });
  });
});

// Set timeout for all tests in this suite
jest.setTimeout(120000);
