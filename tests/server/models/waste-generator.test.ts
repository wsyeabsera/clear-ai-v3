import mongoose from 'mongoose';
import { connectToDatabase, disconnectFromDatabase } from '../../../src/server/database/connection';
import { WasteGenerator } from '../../../src/server/models/WasteGenerator';

describe('WasteGenerator Model', () => {
  beforeAll(async () => {
    await connectToDatabase();
  });

  afterAll(async () => {
    await disconnectFromDatabase();
  });

  beforeEach(async () => {
    await WasteGenerator.deleteMany({});
  });

  describe('WasteGenerator Creation', () => {
    it('should create a waste generator with required fields', async () => {
      const wasteGeneratorData = {
        uid: 'waste-generator-test-001',
        name: 'Test Waste Generator',
        client: new mongoose.Types.ObjectId(),
      };

      const wasteGenerator = new WasteGenerator(wasteGeneratorData);
      const savedWasteGenerator = await wasteGenerator.save();

      expect(savedWasteGenerator.uid).toBe('waste-generator-test-001');
      expect(savedWasteGenerator.name).toBe('Test Waste Generator');
      expect(savedWasteGenerator.client).toBeDefined();
      expect(savedWasteGenerator.created_at).toBeDefined();
    });

    it('should create a waste generator with all optional fields', async () => {
      const wasteGeneratorData = {
        uid: 'waste-generator-test-002',
        name: 'Comprehensive Test Generator',
        external_reference_id: 'EXT-REF-GEN-001',
        region: 'Test Region',
        client: new mongoose.Types.ObjectId(),
      };

      const wasteGenerator = new WasteGenerator(wasteGeneratorData);
      const savedWasteGenerator = await wasteGenerator.save();

      expect(savedWasteGenerator.name).toBe('Comprehensive Test Generator');
      expect(savedWasteGenerator.external_reference_id).toBe('EXT-REF-GEN-001');
      expect(savedWasteGenerator.region).toBe('Test Region');
    });

    it('should not create a waste generator without required fields', async () => {
      const wasteGeneratorData = {
        region: 'Test Region',
      };

      const wasteGenerator = new WasteGenerator(wasteGeneratorData);
      
      await expect(wasteGenerator.save()).rejects.toThrow();
    });

    it('should not create a waste generator with duplicate UID', async () => {
      const clientId = new mongoose.Types.ObjectId();
      const wasteGeneratorData = {
        uid: 'waste-generator-test-duplicate',
        name: 'Test Generator',
        client: clientId,
      };

      const wasteGenerator1 = new WasteGenerator(wasteGeneratorData);
      await wasteGenerator1.save();

      const wasteGenerator2 = new WasteGenerator({
        ...wasteGeneratorData,
        name: 'Different Name',
      });

      await expect(wasteGenerator2.save()).rejects.toThrow();
    });
  });

  describe('WasteGenerator Queries', () => {
    let clientId1: any;
    let clientId2: any;

    beforeEach(async () => {
      clientId1 = new mongoose.Types.ObjectId();
      clientId2 = new mongoose.Types.ObjectId();

      const wasteGenerators = [
        {
          uid: 'waste-generator-test-003',
          name: 'Generator 1',
          external_reference_id: 'GEN-001',
          region: 'Region A',
          client: clientId1,
        },
        {
          uid: 'waste-generator-test-004',
          name: 'Generator 2',
          external_reference_id: 'GEN-002',
          region: 'Region B',
          client: clientId1,
        },
        {
          uid: 'waste-generator-test-005',
          name: 'Generator 3',
          external_reference_id: 'GEN-003',
          region: 'Region A',
          client: clientId2,
        },
      ];

      await WasteGenerator.insertMany(wasteGenerators);
    });

    it('should find waste generators by client', async () => {
      const wasteGenerators = await WasteGenerator.find({ client: clientId1 });
      expect(wasteGenerators).toHaveLength(2);
    });

    it('should find waste generators by name', async () => {
      const wasteGenerators = await WasteGenerator.find({ name: 'Generator 1' });
      expect(wasteGenerators).toHaveLength(1);
      expect(wasteGenerators[0].uid).toBe('waste-generator-test-003');
    });

    it('should find waste generators by region', async () => {
      const wasteGenerators = await WasteGenerator.find({ region: 'Region A' });
      expect(wasteGenerators).toHaveLength(2);
    });

    it('should find waste generators by external reference ID', async () => {
      const wasteGenerators = await WasteGenerator.find({ external_reference_id: 'GEN-002' });
      expect(wasteGenerators).toHaveLength(1);
      expect(wasteGenerators[0].name).toBe('Generator 2');
    });

    it('should find waste generators with partial name match', async () => {
      const wasteGenerators = await WasteGenerator.find({
        name: { $regex: 'Generator', $options: 'i' }
      });
      expect(wasteGenerators).toHaveLength(3);
    });
  });

  describe('WasteGenerator Updates', () => {
    let wasteGenerator: any;

    beforeEach(async () => {
      wasteGenerator = new WasteGenerator({
        uid: 'waste-generator-test-006',
        name: 'Original Name',
        region: 'Original Region',
        client: new mongoose.Types.ObjectId(),
      });
      await wasteGenerator.save();
    });

    it('should update waste generator fields', async () => {
      wasteGenerator.name = 'Updated Name';
      wasteGenerator.region = 'Updated Region';
      wasteGenerator.external_reference_id = 'UPDATED-REF';
      wasteGenerator.updated_at = new Date();
      
      const updatedWasteGenerator = await wasteGenerator.save();

      expect(updatedWasteGenerator.name).toBe('Updated Name');
      expect(updatedWasteGenerator.region).toBe('Updated Region');
      expect(updatedWasteGenerator.external_reference_id).toBe('UPDATED-REF');
      expect(updatedWasteGenerator.updated_at).toBeDefined();
    });

    it('should soft delete a waste generator', async () => {
      wasteGenerator.deleted_at = new Date();
      wasteGenerator.deleted_by_uid = 'user-test-001';
      
      const deletedWasteGenerator = await wasteGenerator.save();

      expect(deletedWasteGenerator.deleted_at).toBeDefined();
      expect(deletedWasteGenerator.deleted_by_uid).toBe('user-test-001');
    });
  });

  describe('WasteGenerator Relationships', () => {
    it('should populate client information when queried', async () => {
      const clientId = new mongoose.Types.ObjectId();
      const wasteGenerator = new WasteGenerator({
        uid: 'waste-generator-test-007',
        name: 'Test Generator with Client',
        client: clientId,
      });
      await wasteGenerator.save();

      // Note: In a real scenario, you would need to create a Client model
      // and populate it. For now, we're just testing that the reference is stored correctly.
      const foundWasteGenerator = await WasteGenerator.findById(wasteGenerator._id);
      expect(foundWasteGenerator?.client.toString()).toBe(clientId.toString());
    });
  });
});
