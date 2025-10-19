import mongoose from 'mongoose';
import { Contract } from '../../../src/server/models/Contract';
import { Facility } from '../../../src/server/models/Facility';

describe('Contract Model', () => {

  beforeEach(async () => {
    await Contract.deleteMany({});
    await Facility.deleteMany({});
  });

  describe('Contract Creation', () => {
    it('should create a contract with required fields', async () => {
      const facility = new Facility({
        name: 'Test Facility',
        client: new mongoose.Types.ObjectId(),
        created_at: new Date()
      });
      await facility.save();

      const contractData = {
        title: 'Test Contract',
        facility: facility._id,
        client: facility._id,
        created_at: new Date()
      };

      const contract = new Contract(contractData);
      const savedContract = await contract.save();

      expect(savedContract.title).toBe('Test Contract');
      expect(savedContract.created_at).toBeDefined();
    });

    it('should create a contract with all optional fields', async () => {
      const facility = new Facility({
        name: 'Test Facility 2',
        client: new mongoose.Types.ObjectId(),
        created_at: new Date()
      });
      await facility.save();

      const contractData = {
        title: 'Comprehensive Test Contract',
        external_reference_id: 'EXT-REF-001',
        external_waste_code_id: '20 03 01',
        start_date: new Date('2025-01-01'),
        end_date: new Date('2025-12-31'),
        tonnage_min: 1000,
        tonnage_max: 5000,
        tonnage_actual: 2500,
        source: 'Test Source',
        facility: facility._id,
        client: facility._id,
        created_at: new Date()
      };

      const contract = new Contract(contractData);
      const savedContract = await contract.save();

      expect(savedContract.title).toBe('Comprehensive Test Contract');
      expect(savedContract.external_reference_id).toBe('EXT-REF-001');
      expect(savedContract.external_waste_code_id).toBe('20 03 01');
      expect(savedContract.tonnage_min).toBe(1000);
      expect(savedContract.tonnage_max).toBe(5000);
      expect(savedContract.tonnage_actual).toBe(2500);
    });

    it('should not create a contract without required fields', async () => {
      const contractData = {
        title: 'Incomplete Contract',
      };

      const contract = new Contract(contractData);
      
      await expect(contract.save()).rejects.toThrow();
    });

    it('should not create a contract without required fields', async () => {
      const facility = new Facility({
        name: 'Test Facility 3',
        client: new mongoose.Types.ObjectId(),
        created_at: new Date()
      });
      await facility.save();

      const contractData = {
        facility: facility._id,
        // Missing client field
      };

      const contract = new Contract(contractData);
      await expect(contract.save()).rejects.toThrow();
    });
  });

  describe('Contract Queries', () => {
    let facility: any;
    let client1: any;
    let client2: any;

    beforeEach(async () => {
      facility = new Facility({
        name: 'Test Facility 4',
        client: new mongoose.Types.ObjectId(),
        created_at: new Date()
      });
      await facility.save();

      client1 = new mongoose.Types.ObjectId();
      client2 = new mongoose.Types.ObjectId();

      const contracts = [
        {
          title: 'Contract 1',
          tonnage_actual: 1000,
          facility: facility._id,
          client: client1,
          created_at: new Date()
        },
        {
          title: 'Contract 2',
          tonnage_actual: 2000,
          facility: facility._id,
          client: client2,
          created_at: new Date()
        },
      ];

      await Contract.insertMany(contracts);
    });

    it('should find contracts by facility', async () => {
      const contracts = await Contract.find({ facility: facility._id });
      expect(contracts).toHaveLength(2);
    });

    it('should find contracts by client', async () => {
      const contracts = await Contract.find({ client: client1 });
      expect(contracts).toHaveLength(1);
    });

    it('should find contracts by title', async () => {
      const contracts = await Contract.find({ title: 'Contract 1' });
      expect(contracts).toHaveLength(1);
      expect(contracts[0].title).toBe('Contract 1');
    });
  });

  describe('Contract Updates', () => {
    let contract: any;

    beforeEach(async () => {
      const facility = new Facility({
        name: 'Test Facility 5',
        client: new mongoose.Types.ObjectId(),
        created_at: new Date()
      });
      await facility.save();

      contract = new Contract({
        title: 'Original Title',
        tonnage_actual: 1000,
        facility: facility._id,
        client: facility._id,
        created_at: new Date()
      });
      await contract.save();
    });

    it('should update contract fields', async () => {
      contract.title = 'Updated Title';
      contract.tonnage_actual = 1500;
      contract.updated_at = new Date();
      
      const updatedContract = await contract.save();

      expect(updatedContract.title).toBe('Updated Title');
      expect(updatedContract.tonnage_actual).toBe(1500);
      expect(updatedContract.updated_at).toBeDefined();
    });

    it('should soft delete a contract', async () => {
      contract.deleted_at = new Date();
      
      const deletedContract = await contract.save();

      expect(deletedContract.deleted_at).toBeDefined();
    });
  });
});
