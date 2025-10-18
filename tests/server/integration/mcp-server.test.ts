import { MCPClient } from '../../../src/client/MCPClient';
import { DynamicToolExecutor } from '../../../src/client/DynamicToolExecutor';
import { Facility } from '../../../src/server/models/Facility';
import mongoose from 'mongoose';
import path from 'path';

// Skip integration tests by default (they require building the project first)
describe.skip('MCP Server Integration Tests', () => {
  let mcpClient: MCPClient;
  let executor: DynamicToolExecutor;
  let facility: any;

  beforeAll(async () => {
    // Create a test facility using existing connection
    facility = new Facility({
      uid: 'test-facility-001',
      name: 'Test Integration Facility',
      client: new mongoose.Types.ObjectId(),
    });
    await facility.save();

    // Connect MCP client to server
    mcpClient = new MCPClient();
    const serverPath = path.join(__dirname, '../../../dist/src/server/index.js');
    await mcpClient.connect(serverPath);
    
    executor = new DynamicToolExecutor(mcpClient);
  });

  afterAll(async () => {
    if (mcpClient) {
      await mcpClient.disconnect();
    }
  });

  describe('Tool Listing', () => {
    it('should list all available tools', async () => {
      const tools = await executor.listAvailableTools();
      
      expect(Array.isArray(tools)).toBe(true);
      expect(tools.length).toBeGreaterThan(0);
      
      // Check for expected tools
      const toolNames = tools.map((t: any) => t.name);
      expect(toolNames).toContain('shipments_create');
      expect(toolNames).toContain('facilities_list');
      expect(toolNames).toContain('contaminants_get');
      expect(toolNames).toContain('inspections_update');
    });
  });

  describe('Shipment Operations', () => {
    it('should create a shipment via MCP', async () => {
      const result = await executor.executeTool('shipments_create', {
        uid: 'integration-shipment-001',
        client_uid: 'client-001',
        license_plate: 'TEST-123',
        entry_weight: 1500,
        facility_uid: facility.uid,
        notes: 'Integration test shipment',
      });

      expect(result.success).toBe(true);
      expect(result.data.uid).toBe('integration-shipment-001');
      expect(result.data.license_plate).toBe('TEST-123');
    });

    it('should get a shipment via MCP', async () => {
      const result = await executor.executeTool('shipments_get', {
        uid: 'integration-shipment-001',
      });

      expect(result.success).toBe(true);
      expect(result.data.uid).toBe('integration-shipment-001');
    });

    it('should list shipments via MCP', async () => {
      const result = await executor.executeTool('shipments_list', {
        client_uid: 'client-001',
      });

      expect(result.success).toBe(true);
      expect(Array.isArray(result.data)).toBe(true);
      expect(result.data.length).toBeGreaterThan(0);
    });
  });

  describe('Facility Operations', () => {
    it('should create a facility via MCP', async () => {
      const result = await executor.executeTool('facilities_create', {
        uid: 'integration-facility-001',
        name: 'Integration Test Facility',
        client_uid: new mongoose.Types.ObjectId().toString(),
        city: 'Test City',
        country: 'Test Country',
      });

      expect(result.success).toBe(true);
      expect(result.data.uid).toBe('integration-facility-001');
      expect(result.data.name).toBe('Integration Test Facility');
    });

    it('should list facilities via MCP', async () => {
      const result = await executor.executeTool('facilities_list', {
        city: 'Test City',
      });

      expect(result.success).toBe(true);
      expect(Array.isArray(result.data)).toBe(true);
    });
  });

  describe('Error Handling', () => {
    it('should handle missing required fields', async () => {
      const result = await executor.executeTool('shipments_create', {
        uid: 'incomplete-shipment',
        // Missing client_uid and license_plate
      });

      expect(result.success).toBe(false);
      expect(result.error).toBeDefined();
    });

    it('should handle non-existent tool', async () => {
      const result = await executor.executeTool('non_existent_tool', {});

      expect(result.success).toBe(false);
      expect(result.error).toBeDefined();
    });
  });
});

// Set timeout for all tests in this suite
jest.setTimeout(60000);
