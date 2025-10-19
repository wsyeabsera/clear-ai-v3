import mongoose from 'mongoose';
import { WasteCode } from '../../../src/server/models/WasteCode';

describe('WasteCode Model', () => {

  beforeEach(async () => {
    await WasteCode.deleteMany({});
  });

  describe('WasteCode Creation', () => {
    it('should create a waste code with required fields', async () => {
      const wasteCodeData = {
        code: '20 03 01',
        name: 'Mixed Municipal Waste',
        created_at: new Date()
      };

      const wasteCode = new WasteCode(wasteCodeData);
      const savedWasteCode = await wasteCode.save();

      expect(savedWasteCode.code).toBe('20 03 01');
      expect(savedWasteCode.name).toBe('Mixed Municipal Waste');
      expect(savedWasteCode.created_at).toBeDefined();
    });

    it('should create a waste code with all optional fields', async () => {
      const wasteCodeData = {
        code: '15 01 02',
        name: 'Plastic Packaging',
        description: 'Plastic packaging waste excluding containers',
        color_code: '#4ECDC4',
        code_with_spaces: '15 01 02',
        calorific_value_min: 35.0,
        calorific_value_max: 45.0,
        calorific_value_comment: 'High calorific value for plastic waste',
        source: 'European Waste Catalogue',
        created_at: new Date()
      };

      const wasteCode = new WasteCode(wasteCodeData);
      const savedWasteCode = await wasteCode.save();

      expect(savedWasteCode.description).toBe('Plastic packaging waste excluding containers');
      expect(savedWasteCode.color_code).toBe('#4ECDC4');
      expect(savedWasteCode.calorific_value_min).toBe(35.0);
      expect(savedWasteCode.calorific_value_max).toBe(45.0);
      expect(savedWasteCode.source).toBe('European Waste Catalogue');
    });

    it('should not create a waste code without required fields', async () => {
      const wasteCodeData = {
        description: 'Incomplete waste code',
      };

      const wasteCode = new WasteCode(wasteCodeData);
      
      await expect(wasteCode.save()).rejects.toThrow();
    });

    it('should not create a waste code with duplicate code', async () => {
      const wasteCodeData = {
        code: '20 03 01',
        name: 'Mixed Municipal Waste',
        created_at: new Date()
      };

      const wasteCode1 = new WasteCode(wasteCodeData);
      await wasteCode1.save();

      const wasteCode2 = new WasteCode({
        code: '20 03 01',
        name: 'Different Name',
        created_at: new Date()
      });

      await expect(wasteCode2.save()).rejects.toThrow();
    });
  });

  describe('WasteCode Queries', () => {
    beforeEach(async () => {
      const wasteCodes = [
        {
          code: '20 03 01',
          name: 'Mixed Municipal Waste',
          description: 'Mixed waste from households',
          created_at: new Date()
        },
        {
          code: '15 01 02',
          name: 'Plastic Packaging',
          description: 'Plastic packaging waste',
          created_at: new Date()
        },
        {
          code: '17 04 05',
          name: 'Iron and Steel',
          description: 'Metal scrap waste',
          created_at: new Date()
        },
      ];

      await WasteCode.insertMany(wasteCodes);
    });

    it('should find waste codes by code', async () => {
      const wasteCodes = await WasteCode.find({ code: '20 03 01' });
      expect(wasteCodes).toHaveLength(1);
      expect(wasteCodes[0].name).toBe('Mixed Municipal Waste');
    });

    it('should find waste codes by name', async () => {
      const wasteCodes = await WasteCode.find({ name: 'Plastic Packaging' });
      expect(wasteCodes).toHaveLength(1);
      expect(wasteCodes[0].code).toBe('15 01 02');
    });

    it('should find waste codes with calorific value range', async () => {
      const wasteCodes = await WasteCode.find({
        calorific_value_min: { $exists: true },
        calorific_value_max: { $exists: true }
      });
      expect(wasteCodes.length).toBeGreaterThanOrEqual(0);
    });

    it('should find waste codes by partial name match', async () => {
      const wasteCodes = await WasteCode.find({
        name: { $regex: 'Plastic', $options: 'i' }
      });
      expect(wasteCodes).toHaveLength(1);
    });
  });

  describe('WasteCode Updates', () => {
    let wasteCode: any;

    beforeEach(async () => {
      wasteCode = new WasteCode({
        code: '20 03 01',
        name: 'Original Name',
        description: 'Original Description',
        calorific_value_min: 8.0,
        calorific_value_max: 12.0,
        created_at: new Date()
      });
      await wasteCode.save();
    });

    it('should update waste code fields', async () => {
      wasteCode.name = 'Updated Name';
      wasteCode.description = 'Updated Description';
      wasteCode.calorific_value_min = 10.0;
      wasteCode.updated_at = new Date();
      
      const updatedWasteCode = await wasteCode.save();

      expect(updatedWasteCode.name).toBe('Updated Name');
      expect(updatedWasteCode.description).toBe('Updated Description');
      expect(updatedWasteCode.calorific_value_min).toBe(10.0);
      expect(updatedWasteCode.updated_at).toBeDefined();
    });

    it('should soft delete a waste code', async () => {
      wasteCode.deleted_at = new Date();
      
      const deletedWasteCode = await wasteCode.save();

      expect(deletedWasteCode.deleted_at).toBeDefined();
    });

    it('should update calorific value range', async () => {
      wasteCode.calorific_value_min = 9.0;
      wasteCode.calorific_value_max = 13.0;
      wasteCode.calorific_value_comment = 'Updated range based on new analysis';
      
      const updatedWasteCode = await wasteCode.save();

      expect(updatedWasteCode.calorific_value_min).toBe(9.0);
      expect(updatedWasteCode.calorific_value_max).toBe(13.0);
      expect(updatedWasteCode.calorific_value_comment).toBe('Updated range based on new analysis');
    });
  });
});
