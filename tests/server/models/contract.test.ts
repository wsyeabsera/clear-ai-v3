import mongoose from 'mongoose';
import { connectToDatabase, disconnectFromDatabase } from '../../../src/server/database/connection';
import { Contract } from '../../../src/server/models/Contract';
import { Facility } from '../../../src/server/models/Facility';

describe('Contract Model', () => {
  beforeAll(async () => {
    await connectToDatabase();
  });

  afterAll(async () => {
    await disconnectFromDatabase();
  });

  beforeEach(async () => {
    await Contract.deleteMany({});
    await Facility.deleteMany({});
  });

  describe('Contract Creation', () => {
    it('should create a contract with required fields', async () => {
      const facility = new Facility({
        uid: 'facility-test-001',
        name: 'Test Facility',
        client: new mongoose.Types.ObjectId(),
      });
      await facility.save();

      const contractData = {
        uid: 'contract-test-001',
        facility_uid: 'facility-test-001',
        client_uid: 'client-test-001',
        title: 'Test Contract',
        facility: facility._id,
        client: facility._id,
      };

      const contract = new Contract(contractData);
      const savedContract = await contract.save();

      expect(savedContract.uid).toBe('contract-test-001');
      expect(savedContract.facility_uid).toBe('facility-test-001');
      expect(savedContract.client_uid).toBe('client-test-001');
      expect(savedContract.title).toBe('Test Contract');
      expect(savedContract.created_at).toBeDefined();
    });

    it('should create a contract with all optional fields', async () => {
      const facility = new Facility({
        uid: 'facility-test-002',
        name: 'Test Facility 2',
        client: new mongoose.Types.ObjectId(),
      });
      await facility.save();

      const contractData = {
        uid: 'contract-test-002',
        facility_uid: 'facility-test-002',
        client_uid: 'client-test-002',
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

    it('should not create a contract with duplicate UID', async () => {
      const facility = new Facility({
        uid: 'facility-test-003',
        name: 'Test Facility 3',
        client: new mongoose.Types.ObjectId(),
      });
      await facility.save();

      const contractData = {
        uid: 'contract-test-duplicate',
        facility_uid: 'facility-test-003',
        client_uid: 'client-test-003',
        facility: facility._id,
        client: facility._id,
      };

      const contract1 = new Contract(contractData);
      await contract1.save();

      const contract2 = new Contract({
        ...contractData,
        title: 'Duplicate Contract',
      });

      await expect(contract2.save()).rejects.toThrow();
    });
  });

  describe('Contract Queries', () => {
    beforeEach(async () => {
      const facility = new Facility({
        uid: 'facility-test-004',
        name: 'Test Facility 4',
        client: new mongoose.Types.ObjectId(),
      });
      await facility.save();

      const contracts = [
        {
          uid: 'contract-test-004',
          facility_uid: 'facility-test-004',
          client_uid: 'client-test-004',
          title: 'Contract 1',
          tonnage_actual: 1000,
          facility: facility._id,
          client: facility._id,
        },
        {
          uid: 'contract-test-005',
          facility_uid: 'facility-test-004',
          client_uid: 'client-test-005',
          title: 'Contract 2',
          tonnage_actual: 2000,
          facility: facility._id,
          client: facility._id,
        },
      ];

      await Contract.insertMany(contracts);
    });

    it('should find contracts by facility UID', async () => {
      const contracts = await Contract.find({ facility_uid: 'facility-test-004' });
      expect(contracts).toHaveLength(2);
    });

    it('should find contracts by client UID', async () => {
      const contracts = await Contract.find({ client_uid: 'client-test-004' });
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
        uid: 'facility-test-005',
        name: 'Test Facility 5',
        client: new mongoose.Types.ObjectId(),
      });
      await facility.save();

      contract = new Contract({
        uid: 'contract-test-006',
        facility_uid: 'facility-test-005',
        client_uid: 'client-test-006',
        title: 'Original Title',
        tonnage_actual: 1000,
        facility: facility._id,
        client: facility._id,
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
      contract.deleted_by_uid = 'user-test-001';
      
      const deletedContract = await contract.save();

      expect(deletedContract.deleted_at).toBeDefined();
      expect(deletedContract.deleted_by_uid).toBe('user-test-001');
    });
  });
});
