import { MCPClient } from '../../../src/client/MCPClient';
import { DynamicToolExecutor } from '../../../src/client/DynamicToolExecutor';
// Mock faker for now since it has ES module issues
const faker = {
  company: { name: () => 'Test Company' },
  vehicle: { vrm: () => 'TEST-123' },
  number: { int: (opts: any) => Math.floor(Math.random() * (opts.max - opts.min)) + opts.min },
  date: { recent: () => new Date() },
  location: { streetAddress: () => '123 Test St', city: () => 'Test City', country: () => 'Test Country' },
  internet: { email: () => 'test@example.com' },
  phone: { number: () => '555-0123' },
  lorem: { sentence: () => 'Test sentence', word: () => 'test' }
};
import path from 'path';

// Skip integration tests by default (they require building the project first)
describe('MCP Tools Integration Tests', () => {
  let mcpClient: MCPClient;
  let executor: DynamicToolExecutor;
  let testData: any = {};

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

  describe('Tool Discovery', () => {
    it('should list all available tools', async () => {
      const tools = await executor.listAvailableTools();
      
      expect(Array.isArray(tools)).toBe(true);
      expect(tools.length).toBeGreaterThan(0);
      
      // Check for expected tool categories
      const toolNames = tools.map((t: any) => t.name);
      expect(toolNames.some((name: string) => name.startsWith('clients_'))).toBe(true);
      expect(toolNames.some((name: string) => name.startsWith('facilities_'))).toBe(true);
      expect(toolNames.some((name: string) => name.startsWith('shipments_'))).toBe(true);
      expect(toolNames.some((name: string) => name.startsWith('contaminants_'))).toBe(true);
      expect(toolNames.some((name: string) => name.startsWith('inspections_'))).toBe(true);
    });
  });

  describe('Client Operations', () => {
    it('should create a client', async () => {
      const clientData = {
        name: faker.company.name() + ' Waste Management'
      };

      const result = await executor.executeTool('clients_create', clientData);
      
      expect(result.success).toBe(true);
      expect(result.data).toBeDefined();
      expect(result.data.name).toBe(clientData.name);
      
      testData.clientId = result.data._id;
    });

    it('should get a client', async () => {
      const result = await executor.executeTool('clients_get', {
        id: testData.clientId
      });

      expect(result.success).toBe(true);
      expect(result.data._id).toBe(testData.clientId);
    });

    it('should update a client', async () => {
      const updateData = {
        id: testData.clientId,
        name: 'Updated ' + faker.company.name()
      };

      const result = await executor.executeTool('clients_update', updateData);

      expect(result.success).toBe(true);
      expect(result.data.name).toBe(updateData.name);
    });

    it('should list clients', async () => {
      const result = await executor.executeTool('clients_list', {
        page: 1,
        limit: 10
      });

      expect(result.success).toBe(true);
      expect(Array.isArray(result.data)).toBe(true);
      expect(result.data.length).toBeGreaterThan(0);
    });

    it('should delete a client', async () => {
      const result = await executor.executeTool('clients_delete', {
        id: testData.clientId
      });

      expect(result.success).toBe(true);
    });
  });

  describe('Facility Operations', () => {
    let facilityId: string;

    beforeAll(async () => {
      // Create a client first
      const clientResult = await executor.executeTool('clients_create', {
        name: faker.company.name() + ' Client'
      });
      testData.facilityClientId = clientResult.data._id;
    });

    it('should create a facility', async () => {
      const facilityData = {
        name: faker.company.name() + ' Waste Processing Facility',
        client_id: testData.facilityClientId,
        address: faker.location.streetAddress(),
        city: faker.location.city(),
        country: faker.location.country(),
        email: faker.internet.email(),
        phone: faker.phone.number()
      };

      const result = await executor.executeTool('facilities_create', facilityData);
      
      expect(result.success).toBe(true);
      expect(result.data).toBeDefined();
      expect(result.data.name).toBe(facilityData.name);
      
      facilityId = result.data._id;
    });

    it('should get a facility', async () => {
      const result = await executor.executeTool('facilities_get', {
        id: facilityId
      });

      expect(result.success).toBe(true);
      expect(result.data._id).toBe(facilityId);
    });

    it('should update a facility', async () => {
      const updateData = {
        id: facilityId,
        name: 'Updated ' + faker.company.name(),
        email: faker.internet.email()
      };

      const result = await executor.executeTool('facilities_update', updateData);

      expect(result.success).toBe(true);
      expect(result.data.name).toBe(updateData.name);
    });

    it('should list facilities', async () => {
      const result = await executor.executeTool('facilities_list', {
        page: 1,
        limit: 10
      });

      expect(result.success).toBe(true);
      expect(Array.isArray(result.data)).toBe(true);
    });

    it('should delete a facility', async () => {
      const result = await executor.executeTool('facilities_delete', {
        id: facilityId
      });

      expect(result.success).toBe(true);
    });
  });

  describe('Shipment Operations', () => {
    let shipmentId: string;

    beforeAll(async () => {
      // Create a client and facility first
      const clientResult = await executor.executeTool('clients_create', {
        name: faker.company.name() + ' Client'
      });
      testData.shipmentClientId = clientResult.data._id;

      const facilityResult = await executor.executeTool('facilities_create', {
        name: faker.company.name() + ' Facility',
        client_id: testData.shipmentClientId,
        city: faker.location.city(),
        country: faker.location.country()
      });
      testData.shipmentFacilityId = facilityResult.data._id;
    });

    it('should create a shipment', async () => {
      const shipmentData = {
        client_id: testData.shipmentClientId,
        license_plate: faker.vehicle.vrm(),
        entry_weight: faker.number.int({ min: 1000, max: 5000 }),
        exit_weight: faker.number.int({ min: 1000, max: 5000 }),
        entry_timestamp: faker.date.recent().toISOString(),
        exit_timestamp: faker.date.recent().toISOString(),
        facility_id: testData.shipmentFacilityId,
        gate_number: faker.number.int({ min: 1, max: 10 }),
        notes: faker.lorem.sentence()
      };

      const result = await executor.executeTool('shipments_create', shipmentData);
      
      expect(result.success).toBe(true);
      expect(result.data).toBeDefined();
      expect(result.data.license_plate).toBe(shipmentData.license_plate);
      
      shipmentId = result.data._id;
    });

    it('should get a shipment', async () => {
      const result = await executor.executeTool('shipments_get', {
        id: shipmentId
      });

      expect(result.success).toBe(true);
      expect(result.data._id).toBe(shipmentId);
    });

    it('should update a shipment', async () => {
      const updateData = {
        id: shipmentId,
        entry_weight: faker.number.int({ min: 1000, max: 5000 }),
        exit_weight: faker.number.int({ min: 1000, max: 5000 }),
        notes: 'Updated ' + faker.lorem.sentence()
      };

      const result = await executor.executeTool('shipments_update', updateData);

      expect(result.success).toBe(true);
      expect(result.data.entry_weight).toBe(updateData.entry_weight);
    });

    it('should list shipments', async () => {
      const result = await executor.executeTool('shipments_list', {
        client_id: testData.shipmentClientId,
        page: 1,
        limit: 10
      });

      expect(result.success).toBe(true);
      expect(Array.isArray(result.data)).toBe(true);
    });

    it('should delete a shipment', async () => {
      const result = await executor.executeTool('shipments_delete', {
        id: shipmentId
      });

      expect(result.success).toBe(true);
    });
  });

  describe('Contaminant Operations', () => {
    let contaminantId: string;

    beforeAll(async () => {
      // Create required dependencies
      const clientResult = await executor.executeTool('clients_create', {
        name: faker.company.name() + ' Client'
      });
      testData.contaminantClientId = clientResult.data._id;

      const facilityResult = await executor.executeTool('facilities_create', {
        name: faker.company.name() + ' Facility',
        client_id: testData.contaminantClientId,
        city: faker.location.city(),
        country: faker.location.country()
      });
      testData.contaminantFacilityId = facilityResult.data._id;

      const shipmentResult = await executor.executeTool('shipments_create', {
        client_id: testData.contaminantClientId,
        license_plate: faker.vehicle.vrm(),
        facility_id: testData.contaminantFacilityId
      });
      testData.contaminantShipmentId = shipmentResult.data._id;
    });

    it('should create a contaminant', async () => {
      const contaminantData = {
        client_id: testData.contaminantClientId,
        facility_id: testData.contaminantFacilityId,
        shipment_id: testData.contaminantShipmentId,
        material: faker.lorem.word(),
        estimated_size: faker.number.int({ min: 1, max: 100 }),
        notes: faker.lorem.sentence()
      };

      const result = await executor.executeTool('contaminants_create', contaminantData);
      
      expect(result.success).toBe(true);
      expect(result.data).toBeDefined();
      expect(result.data.material).toBe(contaminantData.material);
      
      contaminantId = result.data._id;
    });

    it('should get a contaminant', async () => {
      const result = await executor.executeTool('contaminants_get', {
        id: contaminantId
      });

      expect(result.success).toBe(true);
      expect(result.data._id).toBe(contaminantId);
    });

    it('should update a contaminant', async () => {
      const updateData = {
        id: contaminantId,
        material: 'Updated ' + faker.lorem.word(),
        estimated_size: faker.number.int({ min: 1, max: 100 })
      };

      const result = await executor.executeTool('contaminants_update', updateData);

      expect(result.success).toBe(true);
      expect(result.data.material).toBe(updateData.material);
    });

    it('should list contaminants', async () => {
      const result = await executor.executeTool('contaminants_list', {
        client_id: testData.contaminantClientId,
        page: 1,
        limit: 10
      });

      expect(result.success).toBe(true);
      expect(Array.isArray(result.data)).toBe(true);
    });

    it('should delete a contaminant', async () => {
      const result = await executor.executeTool('contaminants_delete', {
        id: contaminantId
      });

      expect(result.success).toBe(true);
    });
  });

  describe('Error Handling', () => {
    it('should handle missing required fields', async () => {
      const result = await executor.executeTool('clients_create', {
        // Missing name field
      });

      expect(result.success).toBe(false);
      expect(result.error).toBeDefined();
    });

    it('should handle non-existent tool', async () => {
      const result = await executor.executeTool('non_existent_tool', {});

      expect(result.success).toBe(false);
      expect(result.error).toBeDefined();
    });

    it('should handle invalid ObjectId', async () => {
      const result = await executor.executeTool('clients_get', {
        id: 'invalid-id'
      });

      expect(result.success).toBe(false);
      expect(result.error).toBeDefined();
    });
  });
});

// Set timeout for all tests in this suite
jest.setTimeout(120000);
