import { MCPClient } from '../../../src/client/MCPClient';
import { DynamicToolExecutor } from '../../../src/client/DynamicToolExecutor';
// Mock faker for now since it has ES module issues
const faker = {
  company: { name: () => 'Test Company' },
  vehicle: { vrm: () => 'TEST-123' },
  number: { int: (opts: any) => Math.floor(Math.random() * (opts.max - opts.min)) + opts.min },
  date: { recent: () => new Date(), past: () => new Date(Date.now() - 86400000), future: () => new Date(Date.now() + 86400000) },
  location: { streetAddress: () => '123 Test St', city: () => 'Test City', country: () => 'Test Country', state: () => 'Test State' },
  internet: { email: () => 'test@example.com' },
  phone: { number: () => '555-0123' },
  lorem: { sentence: () => 'Test sentence', word: () => 'test', words: (n: number) => 'test words'.split(' ').slice(0, n).join(' ') },
  string: { alphanumeric: (n: number) => 'abc123'.repeat(Math.ceil(n/6)).slice(0, n) },
  color: { rgb: () => '#FF0000' },
  datatype: { boolean: () => Math.random() > 0.5 }
};
import path from 'path';

// Skip integration tests by default (they require building the project first)
describe('MCP Workflow Integration Tests', () => {
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

  describe('Complete Shipment Workflow', () => {
    let workflowData: any = {};

    it('should complete a full shipment workflow', async () => {
      // Step 1: Create a client
      const clientResult = await executor.executeTool('clients_create', {
        name: faker.company.name() + ' Waste Management Company'
      });
      expect(clientResult.success).toBe(true);
      workflowData.clientId = clientResult.data._id;

      // Step 2: Create a facility
      const facilityResult = await executor.executeTool('facilities_create', {
        name: faker.company.name() + ' Processing Facility',
        client_id: workflowData.clientId,
        address: faker.location.streetAddress(),
        city: faker.location.city(),
        country: faker.location.country(),
        email: faker.internet.email(),
        phone: faker.phone.number()
      });
      expect(facilityResult.success).toBe(true);
      workflowData.facilityId = facilityResult.data._id;

      // Step 3: Create a contract
      const contractResult = await executor.executeTool('contracts_create', {
        facility_id: workflowData.facilityId,
        client_id: workflowData.clientId,
        title: faker.lorem.words(3) + ' Contract',
        external_reference_id: faker.string.alphanumeric(10),
        start_date: faker.date.past().toISOString(),
        end_date: faker.date.future().toISOString(),
        tonnage_min: faker.number.int({ min: 100, max: 1000 }),
        tonnage_max: faker.number.int({ min: 1000, max: 10000 }),
        source: 'Test Workflow'
      });
      expect(contractResult.success).toBe(true);
      workflowData.contractId = contractResult.data._id;

      // Step 4: Create a waste generator
      const wasteGeneratorResult = await executor.executeTool('waste_generators_create', {
        client_id: workflowData.clientId,
        name: faker.company.name() + ' Generator',
        external_reference_id: faker.string.alphanumeric(8),
        region: faker.location.state(),
        address: faker.location.streetAddress(),
        city: faker.location.city(),
        country: faker.location.country(),
        email: faker.internet.email(),
        phone: faker.phone.number()
      });
      expect(wasteGeneratorResult.success).toBe(true);
      workflowData.wasteGeneratorId = wasteGeneratorResult.data._id;

      // Step 5: Create a waste code
      const wasteCodeResult = await executor.executeTool('waste_codes_create', {
        code: faker.string.alphanumeric(6),
        name: faker.lorem.words(2) + ' Waste',
        description: faker.lorem.sentence(),
        color_code: faker.color.rgb(),
        code_with_spaces: faker.string.alphanumeric(8),
        calorific_value_min: faker.number.int({ min: 10, max: 20 }),
        calorific_value_max: faker.number.int({ min: 20, max: 30 }),
        source: 'Test Workflow'
      });
      expect(wasteCodeResult.success).toBe(true);
      workflowData.wasteCodeId = wasteCodeResult.data._id;

      // Step 6: Create a waste property
      const wastePropertyResult = await executor.executeTool('waste_properties_create', {
        client_id: workflowData.clientId,
        contract_id: workflowData.contractId,
        waste_description: faker.lorem.sentence(),
        waste_amount: faker.number.int({ min: 50, max: 500 }),
        waste_designation: faker.lorem.words(2),
        consistency: ['solid', 'liquid'],
        type_of_waste: ['industrial', 'commercial'],
        processing_steps: ['sorting', 'treatment'],
        calorific_value: faker.number.int({ min: 15, max: 25 }),
        biogenic_part: faker.number.int({ min: 10, max: 50 }),
        plastic_content: faker.number.int({ min: 5, max: 30 }),
        water: faker.number.int({ min: 5, max: 20 }),
        ash: faker.number.int({ min: 5, max: 15 })
      });
      expect(wastePropertyResult.success).toBe(true);
      workflowData.wastePropertyId = wastePropertyResult.data._id;

      // Step 7: Create a shipment
      const shipmentResult = await executor.executeTool('shipments_create', {
        client_id: workflowData.clientId,
        license_plate: faker.vehicle.vrm(),
        entry_weight: faker.number.int({ min: 1000, max: 5000 }),
        exit_weight: faker.number.int({ min: 1000, max: 5000 }),
        entry_timestamp: faker.date.recent().toISOString(),
        exit_timestamp: faker.date.recent().toISOString(),
        facility_id: workflowData.facilityId,
        gate_number: faker.number.int({ min: 1, max: 10 }),
        notes: 'Workflow test shipment'
      });
      expect(shipmentResult.success).toBe(true);
      workflowData.shipmentId = shipmentResult.data._id;

      // Step 8: Create a contaminant
      const contaminantResult = await executor.executeTool('contaminants_create', {
        client_id: workflowData.clientId,
        facility_id: workflowData.facilityId,
        shipment_id: workflowData.shipmentId,
        material: faker.lorem.word(),
        estimated_size: faker.number.int({ min: 1, max: 100 }),
        notes: 'Workflow test contaminant'
      });
      expect(contaminantResult.success).toBe(true);
      workflowData.contaminantId = contaminantResult.data._id;

      // Step 9: Create an inspection
      const inspectionResult = await executor.executeTool('inspections_create', {
        client_id: workflowData.clientId,
        facility_id: workflowData.facilityId,
        shipment_id: workflowData.shipmentId,
        delivery_accepted: faker.datatype.boolean(),
        delivery_rejected: faker.datatype.boolean(),
        comments: 'Workflow test inspection'
      });
      expect(inspectionResult.success).toBe(true);
      workflowData.inspectionId = inspectionResult.data._id;

      // Step 10: Create a shipment waste composition
      const wasteCompositionResult = await executor.executeTool('shipment_waste_compositions_create', {
        client_id: workflowData.clientId,
        shipment_id: workflowData.shipmentId,
        facility_id: workflowData.facilityId,
        bunker_id: workflowData.facilityId, // Using facility as bunker for simplicity
        moisture_level: 'MEDIUM',
        dust_load_level: 'LOW',
        calorific_value_min: faker.number.int({ min: 15, max: 20 }),
        calorific_value_max: faker.number.int({ min: 20, max: 25 }),
        biogenic_content_percentage: faker.number.int({ min: 10, max: 40 }),
        sulfur_dioxide_risk: 'LOW',
        hydrochloric_acid_risk: 'LOW',
        mono_charge_detected: faker.datatype.boolean(),
        likely_ewc_code: faker.string.alphanumeric(6),
        likely_ewc_description: faker.lorem.sentence(),
        concrete_stones: faker.number.int({ min: 0, max: 20 }),
        glass: faker.number.int({ min: 0, max: 15 }),
        hard_plastics: faker.number.int({ min: 0, max: 25 }),
        textiles_clothing: faker.number.int({ min: 0, max: 10 }),
        iron_fe: faker.number.int({ min: 0, max: 15 }),
        copper_cu: faker.number.int({ min: 0, max: 5 })
      });
      expect(wasteCompositionResult.success).toBe(true);
      workflowData.wasteCompositionId = wasteCompositionResult.data._id;

      // Verify all entities were created successfully
      expect(workflowData.clientId).toBeDefined();
      expect(workflowData.facilityId).toBeDefined();
      expect(workflowData.contractId).toBeDefined();
      expect(workflowData.wasteGeneratorId).toBeDefined();
      expect(workflowData.wasteCodeId).toBeDefined();
      expect(workflowData.wastePropertyId).toBeDefined();
      expect(workflowData.shipmentId).toBeDefined();
      expect(workflowData.contaminantId).toBeDefined();
      expect(workflowData.inspectionId).toBeDefined();
      expect(workflowData.wasteCompositionId).toBeDefined();
    });

    it('should verify relationships work correctly', async () => {
      // Get the shipment and verify it has the correct facility
      const shipmentResult = await executor.executeTool('shipments_get', {
        id: workflowData.shipmentId
      });
      expect(shipmentResult.success).toBe(true);
      expect(shipmentResult.data.facility).toBe(workflowData.facilityId);

      // Get contaminants for this shipment
      const contaminantsResult = await executor.executeTool('contaminants_list', {
        shipment_id: workflowData.shipmentId,
        page: 1,
        limit: 10
      });
      expect(contaminantsResult.success).toBe(true);
      expect(contaminantsResult.data.length).toBeGreaterThan(0);

      // Get inspections for this shipment
      const inspectionsResult = await executor.executeTool('inspections_list', {
        shipment_id: workflowData.shipmentId,
        page: 1,
        limit: 10
      });
      expect(inspectionsResult.success).toBe(true);
      expect(inspectionsResult.data.length).toBeGreaterThan(0);

      // Get waste compositions for this shipment
      const wasteCompositionsResult = await executor.executeTool('shipment_waste_compositions_list', {
        shipment_id: workflowData.shipmentId,
        page: 1,
        limit: 10
      });
      expect(wasteCompositionsResult.success).toBe(true);
      expect(wasteCompositionsResult.data.length).toBeGreaterThan(0);
    });

    it('should clean up test data', async () => {
      // Clean up in reverse order to respect foreign key constraints
      if (workflowData.wasteCompositionId) {
        await executor.executeTool('shipment_waste_compositions_delete', {
          id: workflowData.wasteCompositionId
        });
      }

      if (workflowData.inspectionId) {
        await executor.executeTool('inspections_delete', {
          id: workflowData.inspectionId
        });
      }

      if (workflowData.contaminantId) {
        await executor.executeTool('contaminants_delete', {
          id: workflowData.contaminantId
        });
      }

      if (workflowData.shipmentId) {
        await executor.executeTool('shipments_delete', {
          id: workflowData.shipmentId
        });
      }

      if (workflowData.wastePropertyId) {
        await executor.executeTool('waste_properties_delete', {
          id: workflowData.wastePropertyId
        });
      }

      if (workflowData.wasteCodeId) {
        await executor.executeTool('waste_codes_delete', {
          id: workflowData.wasteCodeId
        });
      }

      if (workflowData.wasteGeneratorId) {
        await executor.executeTool('waste_generators_delete', {
          id: workflowData.wasteGeneratorId
        });
      }

      if (workflowData.contractId) {
        await executor.executeTool('contracts_delete', {
          id: workflowData.contractId
        });
      }

      if (workflowData.facilityId) {
        await executor.executeTool('facilities_delete', {
          id: workflowData.facilityId
        });
      }

      if (workflowData.clientId) {
        await executor.executeTool('clients_delete', {
          id: workflowData.clientId
        });
      }
    });
  });

  describe('Error Handling in Workflows', () => {
    it('should handle missing dependencies gracefully', async () => {
      // Try to create a facility without a client
      const facilityResult = await executor.executeTool('facilities_create', {
        name: 'Test Facility',
        client_id: 'invalid-client-id',
        city: 'Test City',
        country: 'Test Country'
      });

      expect(facilityResult.success).toBe(false);
      expect(facilityResult.error).toBeDefined();
    });

    it('should handle invalid relationships', async () => {
      // Create a client first
      const clientResult = await executor.executeTool('clients_create', {
        name: 'Test Client'
      });
      expect(clientResult.success).toBe(true);

      // Try to create a shipment with invalid facility
      const shipmentResult = await executor.executeTool('shipments_create', {
        client_id: clientResult.data._id,
        license_plate: 'TEST-123',
        facility_id: 'invalid-facility-id'
      });

      expect(shipmentResult.success).toBe(false);
      expect(shipmentResult.error).toBeDefined();

      // Clean up
      await executor.executeTool('clients_delete', {
        id: clientResult.data._id
      });
    });
  });
});

// Set timeout for all tests in this suite
jest.setTimeout(180000);
