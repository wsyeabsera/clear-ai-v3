import mongoose from 'mongoose';
import { connectToDatabase, disconnectFromDatabase } from '../../src/server/database/connection';
import { CommandFactory } from '../../src/server/commands/CommandFactory';
import { Facility } from '../../src/server/models/Facility';
import { Shipment } from '../../src/server/models/Shipment';
import { Bunker } from '../../src/server/models/Bunker';

describe('New MCP Tools Integration Tests', () => {
  let testFacility: any;
  let testShipment: any;
  let testBunker: any;
  let testClientId: any;

  beforeAll(async () => {
    await connectToDatabase();
  });

  afterAll(async () => {
    await disconnectFromDatabase();
  });

  beforeEach(async () => {
    // Clean up existing test data
    if (mongoose.connection.db) {
      await mongoose.connection.db.dropDatabase();
    }
    
    // Create test client ID
    testClientId = new mongoose.Types.ObjectId();
    
    // Create test facility
    testFacility = new Facility({
      uid: 'test-facility-001',
      name: 'Test Facility',
      address: '123 Test Street',
      city: 'Test City',
      country: 'Test Country',
      client: testClientId,
    });
    await testFacility.save();

    // Create test bunker
    testBunker = new Bunker({
      uid: 'test-bunker-001',
      name: 'Test Bunker',
      facility: testFacility._id,
      capacity: 1000,
      current_load: 0,
      waste_type: 'Mixed Waste',
      status: 'active',
    });
    await testBunker.save();

    // Create test shipment
    testShipment = new Shipment({
      uid: 'test-shipment-001',
      client_uid: 'test-client-001',
      license_plate: 'TEST-001',
      facility: testFacility._id,
    });
    await testShipment.save();
  });

  afterEach(async () => {
    // Clean up test data
    if (mongoose.connection.db) {
      await mongoose.connection.db.dropDatabase();
    }
  });

  describe('Contract Tools', () => {
    let contractUid: string;

    it('should create a contract', async () => {
      const params = {
        uid: 'test-contract-001',
        facility_uid: testFacility.uid,
        client_uid: 'test-client-001',
        title: 'Test Contract',
        external_reference_id: 'CONTRACT-001',
        start_date: new Date('2025-01-01').toISOString(),
        end_date: new Date('2025-12-31').toISOString(),
        tonnage_min: 1000,
        tonnage_max: 5000,
        tonnage_actual: 2500,
        source: 'Test Source',
      };

      const result = await CommandFactory.executeCommand('contracts_create', params);
      
      expect(result.success).toBe(true);
      expect(result.data.uid).toBe('test-contract-001');
      expect(result.data.title).toBe('Test Contract');
      expect(result.data.tonnage_actual).toBe(2500);
      
      contractUid = result.data.uid;
    });

    it('should get a contract by UID', async () => {
      // First create a contract
      const createParams = {
        uid: 'test-contract-002',
        facility_uid: testFacility.uid,
        client_uid: 'test-client-001',
        title: 'Test Contract 2',
      };
      await CommandFactory.executeCommand('contracts_create', createParams);

      const result = await CommandFactory.executeCommand('contracts_get', { uid: 'test-contract-002' });
      
      expect(result.success).toBe(true);
      expect(result.data.uid).toBe('test-contract-002');
      expect(result.data.title).toBe('Test Contract 2');
    });

    it('should list contracts with filters', async () => {
      // Create multiple contracts
      const contracts = [
        {
          uid: 'test-contract-003',
          facility_uid: testFacility.uid,
          client_uid: 'test-client-001',
          title: 'Contract A',
        },
        {
          uid: 'test-contract-004',
          facility_uid: testFacility.uid,
          client_uid: 'test-client-002',
          title: 'Contract B',
        },
      ];

      for (const contract of contracts) {
        await CommandFactory.executeCommand('contracts_create', contract);
      }

      const result = await CommandFactory.executeCommand('contracts_list', {
        facility_uid: testFacility.uid,
        page: 1,
        limit: 10,
      });
      
      expect(result.success).toBe(true);
      expect(result.data.contracts).toHaveLength(2);
      expect(result.data.pagination.totalCount).toBe(2);
    });

    it('should update a contract', async () => {
      // Create a contract first
      const createParams = {
        uid: 'test-contract-005',
        facility_uid: testFacility.uid,
        client_uid: 'test-client-001',
        title: 'Original Title',
        tonnage_actual: 1000,
      };
      await CommandFactory.executeCommand('contracts_create', createParams);

      const updateParams = {
        uid: 'test-contract-005',
        title: 'Updated Title',
        tonnage_actual: 1500,
      };

      const result = await CommandFactory.executeCommand('contracts_update', updateParams);
      
      expect(result.success).toBe(true);
      expect(result.data.title).toBe('Updated Title');
      expect(result.data.tonnage_actual).toBe(1500);
    });

    it('should delete a contract', async () => {
      // Create a contract first
      const createParams = {
        uid: 'test-contract-006',
        facility_uid: testFacility.uid,
        client_uid: 'test-client-001',
        title: 'Contract to Delete',
      };
      await CommandFactory.executeCommand('contracts_create', createParams);

      const result = await CommandFactory.executeCommand('contracts_delete', { uid: 'test-contract-006' });
      
      expect(result.success).toBe(true);
      expect(result.data.deleted_at).toBeDefined();

      // Verify it's soft deleted by trying to get it
      const getResult = await CommandFactory.executeCommand('contracts_get', { uid: 'test-contract-006' });
      expect(getResult.success).toBe(false);
    });
  });

  describe('WasteCode Tools', () => {
    it('should create a waste code', async () => {
      const params = {
        uid: 'test-waste-code-001',
        code: '20 03 01',
        name: 'Mixed Municipal Waste',
        description: 'Mixed waste from households',
        color_code: '#FF6B6B',
        calorific_value_min: 8.0,
        calorific_value_max: 12.0,
        source: 'European Waste Catalogue',
      };

      const result = await CommandFactory.executeCommand('waste_codes_create', params);
      
      expect(result.success).toBe(true);
      expect(result.data.uid).toBe('test-waste-code-001');
      expect(result.data.code).toBe('20 03 01');
      expect(result.data.name).toBe('Mixed Municipal Waste');
      expect(result.data.calorific_value_min).toBe(8.0);
    });

    it('should get a waste code by UID', async () => {
      // Create a waste code first
      const createParams = {
        uid: 'test-waste-code-002',
        code: '15 01 02',
        name: 'Plastic Packaging',
      };
      await CommandFactory.executeCommand('waste_codes_create', createParams);

      const result = await CommandFactory.executeCommand('waste_codes_get', { uid: 'test-waste-code-002' });
      
      expect(result.success).toBe(true);
      expect(result.data.code).toBe('15 01 02');
      expect(result.data.name).toBe('Plastic Packaging');
    });

    it('should list waste codes with filters', async () => {
      // Create multiple waste codes
      const wasteCodes = [
        {
          uid: 'test-waste-code-003',
          code: '20 03 01',
          name: 'Mixed Municipal Waste',
        },
        {
          uid: 'test-waste-code-004',
          code: '15 01 02',
          name: 'Plastic Packaging',
        },
      ];

      for (const wasteCode of wasteCodes) {
        await CommandFactory.executeCommand('waste_codes_create', wasteCode);
      }

      const result = await CommandFactory.executeCommand('waste_codes_list', {
        code: '20 03 01',
        page: 1,
        limit: 10,
      });
      
      expect(result.success).toBe(true);
      expect(result.data.wasteCodes).toHaveLength(1);
      expect(result.data.wasteCodes[0].code).toBe('20 03 01');
    });

    it('should update a waste code', async () => {
      // Create a waste code first
      const createParams = {
        uid: 'test-waste-code-005',
        code: '17 04 05',
        name: 'Original Name',
        calorific_value_min: 8.0,
      };
      await CommandFactory.executeCommand('waste_codes_create', createParams);

      const updateParams = {
        uid: 'test-waste-code-005',
        name: 'Updated Name',
        calorific_value_min: 10.0,
      };

      const result = await CommandFactory.executeCommand('waste_codes_update', updateParams);
      
      expect(result.success).toBe(true);
      expect(result.data.name).toBe('Updated Name');
      expect(result.data.calorific_value_min).toBe(10.0);
    });

    it('should delete a waste code', async () => {
      // Create a waste code first
      const createParams = {
        uid: 'test-waste-code-006',
        code: '17 04 05',
        name: 'Waste Code to Delete',
      };
      await CommandFactory.executeCommand('waste_codes_create', createParams);

      const result = await CommandFactory.executeCommand('waste_codes_delete', { uid: 'test-waste-code-006' });
      
      expect(result.success).toBe(true);
      expect(result.data.deleted_at).toBeDefined();
    });
  });

  describe('WasteGenerator Tools', () => {
    it('should create a waste generator', async () => {
      const params = {
        uid: 'test-waste-generator-001',
        name: 'Test Waste Generator',
        external_reference_id: 'GEN-001',
        region: 'Test Region',
        client_uid: 'test-client-001',
      };

      const result = await CommandFactory.executeCommand('waste_generators_create', params);
      
      expect(result.success).toBe(true);
      expect(result.data.uid).toBe('test-waste-generator-001');
      expect(result.data.name).toBe('Test Waste Generator');
      expect(result.data.region).toBe('Test Region');
    });

    it('should get a waste generator by UID', async () => {
      // Create a waste generator first
      const createParams = {
        uid: 'test-waste-generator-002',
        name: 'Test Generator 2',
        client_uid: 'test-client-001',
      };
      await CommandFactory.executeCommand('waste_generators_create', createParams);

      const result = await CommandFactory.executeCommand('waste_generators_get', { uid: 'test-waste-generator-002' });
      
      expect(result.success).toBe(true);
      expect(result.data.name).toBe('Test Generator 2');
    });

    it('should list waste generators with filters', async () => {
      // Create multiple waste generators
      const wasteGenerators = [
        {
          uid: 'test-waste-generator-003',
          name: 'Generator A',
          client_uid: 'test-client-001',
          region: 'Region A',
        },
        {
          uid: 'test-waste-generator-004',
          name: 'Generator B',
          client_uid: 'test-client-002',
          region: 'Region B',
        },
      ];

      for (const wasteGenerator of wasteGenerators) {
        await CommandFactory.executeCommand('waste_generators_create', wasteGenerator);
      }

      const result = await CommandFactory.executeCommand('waste_generators_list', {
        client_uid: 'test-client-001',
        page: 1,
        limit: 10,
      });
      
      expect(result.success).toBe(true);
      expect(result.data.wasteGenerators).toHaveLength(1);
      expect(result.data.wasteGenerators[0].name).toBe('Generator A');
    });

    it('should update a waste generator', async () => {
      // Create a waste generator first
      const createParams = {
        uid: 'test-waste-generator-005',
        name: 'Original Name',
        client_uid: 'test-client-001',
        region: 'Original Region',
      };
      await CommandFactory.executeCommand('waste_generators_create', createParams);

      const updateParams = {
        uid: 'test-waste-generator-005',
        name: 'Updated Name',
        region: 'Updated Region',
      };

      const result = await CommandFactory.executeCommand('waste_generators_update', updateParams);
      
      expect(result.success).toBe(true);
      expect(result.data.name).toBe('Updated Name');
      expect(result.data.region).toBe('Updated Region');
    });

    it('should delete a waste generator', async () => {
      // Create a waste generator first
      const createParams = {
        uid: 'test-waste-generator-006',
        name: 'Generator to Delete',
        client_uid: 'test-client-001',
      };
      await CommandFactory.executeCommand('waste_generators_create', createParams);

      const result = await CommandFactory.executeCommand('waste_generators_delete', { uid: 'test-waste-generator-006' });
      
      expect(result.success).toBe(true);
      expect(result.data.deleted_at).toBeDefined();
    });
  });

  describe('ShipmentWasteComposition Tools', () => {
    it('should create a shipment waste composition', async () => {
      const params = {
        uid: 'test-composition-001',
        client_uid: 'test-client-001',
        shipment_uid: testShipment.uid,
        facility_uid: testFacility.uid,
        bunker_uid: testBunker.uid,
        moisture_level: 'MEDIUM',
        moisture_comment: 'Moderate moisture content',
        dust_load_level: 'LOW',
        calorific_value_min: 8.5,
        calorific_value_max: 11.5,
        biogenic_content_percentage: 65.0,
        sulfur_dioxide_risk: 'LOW',
        hydrochloric_acid_risk: 'LOW',
        mono_charge_detected: false,
        likely_ewc_code: '20 03 01',
        likely_ewc_description: 'Mixed Municipal Waste',
      };

      const result = await CommandFactory.executeCommand('shipment_waste_compositions_create', params);
      
      expect(result.success).toBe(true);
      expect(result.data.uid).toBe('test-composition-001');
      expect(result.data.moisture_level).toBe('MEDIUM');
      expect(result.data.calorific_value_min).toBe(8.5);
      expect(result.data.biogenic_content_percentage).toBe(65.0);
    });

    it('should get a shipment waste composition by UID', async () => {
      // Create a composition first
      const createParams = {
        uid: 'test-composition-002',
        client_uid: 'test-client-001',
        shipment_uid: testShipment.uid,
        facility_uid: testFacility.uid,
        bunker_uid: testBunker.uid,
        moisture_level: 'HIGH',
      };
      await CommandFactory.executeCommand('shipment_waste_compositions_create', createParams);

      const result = await CommandFactory.executeCommand('shipment_waste_compositions_get', { uid: 'test-composition-002' });
      
      expect(result.success).toBe(true);
      expect(result.data.moisture_level).toBe('HIGH');
    });

    it('should list shipment waste compositions with filters', async () => {
      // Create multiple compositions
      const compositions = [
        {
          uid: 'test-composition-003',
          client_uid: 'test-client-001',
          shipment_uid: testShipment.uid,
          facility_uid: testFacility.uid,
          bunker_uid: testBunker.uid,
          moisture_level: 'MEDIUM',
          sulfur_dioxide_risk: 'LOW',
        },
        {
          uid: 'test-composition-004',
          client_uid: 'test-client-001',
          shipment_uid: testShipment.uid,
          facility_uid: testFacility.uid,
          bunker_uid: testBunker.uid,
          moisture_level: 'HIGH',
          sulfur_dioxide_risk: 'MEDIUM',
        },
      ];

      for (const composition of compositions) {
        await CommandFactory.executeCommand('shipment_waste_compositions_create', composition);
      }

      const result = await CommandFactory.executeCommand('shipment_waste_compositions_list', {
        moisture_level: 'MEDIUM',
        page: 1,
        limit: 10,
      });
      
      expect(result.success).toBe(true);
      expect(result.data.compositions).toHaveLength(1);
      expect(result.data.compositions[0].moisture_level).toBe('MEDIUM');
    });

    it('should update a shipment waste composition', async () => {
      // Create a composition first
      const createParams = {
        uid: 'test-composition-005',
        client_uid: 'test-client-001',
        shipment_uid: testShipment.uid,
        facility_uid: testFacility.uid,
        bunker_uid: testBunker.uid,
        moisture_level: 'LOW',
        calorific_value_min: 8.0,
        biogenic_content_percentage: 60.0,
      };
      await CommandFactory.executeCommand('shipment_waste_compositions_create', createParams);

      const updateParams = {
        uid: 'test-composition-005',
        moisture_level: 'HIGH',
        calorific_value_min: 10.0,
        biogenic_content_percentage: 70.0,
      };

      const result = await CommandFactory.executeCommand('shipment_waste_compositions_update', updateParams);
      
      expect(result.success).toBe(true);
      expect(result.data.moisture_level).toBe('HIGH');
      expect(result.data.calorific_value_min).toBe(10.0);
      expect(result.data.biogenic_content_percentage).toBe(70.0);
    });

    it('should delete a shipment waste composition', async () => {
      // Create a composition first
      const createParams = {
        uid: 'test-composition-006',
        client_uid: 'test-client-001',
        shipment_uid: testShipment.uid,
        facility_uid: testFacility.uid,
        bunker_uid: testBunker.uid,
      };
      await CommandFactory.executeCommand('shipment_waste_compositions_create', createParams);

      const result = await CommandFactory.executeCommand('shipment_waste_compositions_delete', { uid: 'test-composition-006' });
      
      expect(result.success).toBe(true);
      expect(result.data.deleted_at).toBeDefined();
    });
  });

  describe('Error Handling', () => {
    it('should handle missing required fields in contract creation', async () => {
      const params = {
        title: 'Invalid Contract',
        // Missing uid, facility_uid, client_uid
      };

      const result = await CommandFactory.executeCommand('contracts_create', params);
      
      expect(result.success).toBe(false);
      expect(result.error).toContain('Missing required fields');
    });

    it('should handle non-existent entity references', async () => {
      const params = {
        uid: 'test-contract-invalid',
        facility_uid: 'non-existent-facility',
        client_uid: 'test-client-001',
      };

      const result = await CommandFactory.executeCommand('contracts_create', params);
      
      expect(result.success).toBe(false);
      expect(result.error).toContain('not found');
    });

    it('should handle duplicate UID creation', async () => {
      const params = {
        uid: 'test-waste-code-duplicate',
        code: '20 03 01',
        name: 'First Waste Code',
      };

      await CommandFactory.executeCommand('waste_codes_create', params);

      const duplicateParams = {
        uid: 'test-waste-code-duplicate',
        code: '15 01 02',
        name: 'Second Waste Code',
      };

      const result = await CommandFactory.executeCommand('waste_codes_create', duplicateParams);
      
      expect(result.success).toBe(false);
      expect(result.error).toContain('already exists');
    });
  });
});
