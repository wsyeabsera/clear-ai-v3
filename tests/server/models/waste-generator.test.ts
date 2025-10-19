import mongoose from 'mongoose';
import { WasteGenerator } from '../../../src/server/models/WasteGenerator';

describe('WasteGenerator Model', () => {

  beforeEach(async () => {
    await WasteGenerator.deleteMany({});
  });

  describe('WasteGenerator Creation', () => {
    it('should create a waste generator with required fields', async () => {
      const wasteGeneratorData = {
        name: 'Test Waste Generator',
        client: new mongoose.Types.ObjectId(),
        created_at: new Date()
      };

      const wasteGenerator = new WasteGenerator(wasteGeneratorData);
      const savedWasteGenerator = await wasteGenerator.save();

      expect(savedWasteGenerator.name).toBe('Test Waste Generator');
      expect(savedWasteGenerator.client).toBeDefined();
      expect(savedWasteGenerator.created_at).toBeDefined();
    });

    it('should create a waste generator with all optional fields', async () => {
      const wasteGeneratorData = {
        name: 'Comprehensive Test Generator',
        external_reference_id: 'EXT-REF-GEN-001',
        region: 'Test Region',
        client: new mongoose.Types.ObjectId(),
        created_at: new Date()
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

    it('should not create a waste generator without required fields', async () => {
      const wasteGeneratorData = {
        region: 'Test Region',
        // Missing name and client
      };

      const wasteGenerator = new WasteGenerator(wasteGeneratorData);
      await expect(wasteGenerator.save()).rejects.toThrow();
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
          name: 'Generator 1',
          external_reference_id: 'GEN-001',
          region: 'Region A',
          client: clientId1,
          created_at: new Date()
        },
        {
          name: 'Generator 2',
          external_reference_id: 'GEN-002',
          region: 'Region B',
          client: clientId1,
          created_at: new Date()
        },
        {
          name: 'Generator 3',
          external_reference_id: 'GEN-003',
          region: 'Region A',
          client: clientId2,
          created_at: new Date()
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
      expect(wasteGenerators[0].name).toBe('Generator 1');
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
        name: 'Original Name',
        region: 'Original Region',
        client: new mongoose.Types.ObjectId(),
        created_at: new Date()
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
      
      const deletedWasteGenerator = await wasteGenerator.save();

      expect(deletedWasteGenerator.deleted_at).toBeDefined();
    });
  });

  describe('WasteGenerator Relationships', () => {
    it('should populate client information when queried', async () => {
      const clientId = new mongoose.Types.ObjectId();
      const wasteGenerator = new WasteGenerator({
        name: 'Test Generator with Client',
        client: clientId,
        created_at: new Date()
      });
      await wasteGenerator.save();

      // Note: In a real scenario, you would need to create a Client model
      // and populate it. For now, we're just testing that the reference is stored correctly.
      const foundWasteGenerator = await WasteGenerator.findById(wasteGenerator._id);
      expect(foundWasteGenerator?.client.toString()).toBe(clientId.toString());
    });
  });
});
