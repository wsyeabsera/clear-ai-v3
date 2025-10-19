import mongoose from 'mongoose';
import { Facility } from '../../../src/server/models/Facility';
import { Shipment } from '../../../src/server/models/Shipment';
import { Client } from '../../../src/server/models/Client';
import { CreateShipmentCommand } from '../../../src/server/commands/shipments/CreateShipmentCommand';
import { GetShipmentCommand } from '../../../src/server/commands/shipments/GetShipmentCommand';
import { UpdateShipmentCommand } from '../../../src/server/commands/shipments/UpdateShipmentCommand';
import { DeleteShipmentCommand } from '../../../src/server/commands/shipments/DeleteShipmentCommand';
import { ListShipmentsCommand } from '../../../src/server/commands/shipments/ListShipmentsCommand';

describe('Shipment Commands', () => {
  let facility: any;

  beforeEach(async () => {
    // Clean up all data first
    await Shipment.deleteMany({});
    await Facility.deleteMany({});
    
    // Create a test facility first
    facility = new Facility({
      name: 'Test Facility',
      address: '123 Test St',
      city: 'Test City',
      country: 'Test Country',
      client: new mongoose.Types.ObjectId(),
      created_at: new Date()
    });
    await facility.save();
  });

  describe('CreateShipmentCommand', () => {
    it('should create a shipment with valid data', async () => {
      const command = new CreateShipmentCommand();
      const params = {
        client_id: new mongoose.Types.ObjectId().toString(),
        license_plate: 'ABC-123',
        entry_weight: 1500.5,
        exit_weight: 1500.5,
        facility_id: facility._id.toString(),
        notes: 'Test shipment',
      };

      const result = await command.execute(params);

      expect(result.success).toBe(true);
      expect(result.data.license_plate).toBe('ABC-123');
      expect(result.data.entry_weight).toBe(1500.5);
    });

    it('should fail with missing required fields', async () => {
      const command = new CreateShipmentCommand();
      const params = {
        license_plate: 'ABC-123',
        // Missing client_id
      };

      const result = await command.execute(params);

      expect(result.success).toBe(false);
      expect(result.error).toContain('Missing required fields');
    });
  });

  describe('GetShipmentCommand', () => {
    let shipment: any;

    beforeEach(async () => {
      shipment = new Shipment({
        client: new mongoose.Types.ObjectId(),
        license_plate: 'ABC-123',
        facility: facility._id,
        created_at: new Date()
      });
      await shipment.save();
    });

    it('should get a shipment by id', async () => {
      const command = new GetShipmentCommand();
      const params = { id: shipment._id.toString() };

      const result = await command.execute(params);
      

      expect(result.success).toBe(true);
      expect(result.data.license_plate).toBe('ABC-123');
    });

    it('should return error for non-existent shipment', async () => {
      const command = new GetShipmentCommand();
      const params = { id: new mongoose.Types.ObjectId().toString() };

      const result = await command.execute(params);

      expect(result.success).toBe(false);
      expect(result.error).toContain('not found');
    });
  });

  describe('UpdateShipmentCommand', () => {
    let shipment: any;

    beforeEach(async () => {
      shipment = new Shipment({
        client: new mongoose.Types.ObjectId(),
        license_plate: 'ABC-123',
        facility: facility._id,
        created_at: new Date()
      });
      await shipment.save();
    });

    it('should update a shipment', async () => {
      const command = new UpdateShipmentCommand();
      const params = {
        id: shipment._id.toString(),
        entry_weight: 2000,
        notes: 'Updated shipment',
      };

      const result = await command.execute(params);

      expect(result.success).toBe(true);
      expect(result.data.entry_weight).toBe(2000);
      expect(result.data.notes).toBe('Updated shipment');
    });
  });

  describe('DeleteShipmentCommand', () => {
    let shipment: any;

    beforeEach(async () => {
      shipment = new Shipment({
        client: new mongoose.Types.ObjectId(),
        license_plate: 'ABC-123',
        facility: facility._id,
        created_at: new Date()
      });
      await shipment.save();
    });

    it('should delete a shipment', async () => {
      const command = new DeleteShipmentCommand();
      const params = { id: shipment._id.toString() };

      const result = await command.execute(params);

      expect(result.success).toBe(true);
      expect(result.message).toContain('deleted successfully');
    });
  });

  describe('ListShipmentsCommand', () => {
    let clientId1: any;
    let clientId2: any;

    beforeEach(async () => {
      clientId1 = new mongoose.Types.ObjectId();
      clientId2 = new mongoose.Types.ObjectId();
      
      // Create test shipments
      const shipments = [
        {
          client: clientId1,
          license_plate: 'ABC-123',
          facility: facility._id,
          created_at: new Date()
        },
        {
          client: clientId2,
          license_plate: 'DEF-456',
          facility: facility._id,
          created_at: new Date()
        },
      ];
      await Shipment.insertMany(shipments);
    });

    it('should list all shipments', async () => {
      const command = new ListShipmentsCommand();
      const params = { page: 1, limit: 10 };

      const result = await command.execute(params);
      

      expect(result.success).toBe(true);
      expect(result.data).toHaveLength(2);
    });

    it('should filter shipments by client_id', async () => {
      const command = new ListShipmentsCommand();
      const params = {
        client_id: clientId1.toString(),
        page: 1,
        limit: 10,
      };

      const result = await command.execute(params);

      expect(result.success).toBe(true);
      expect(result.data).toHaveLength(1);
      expect(result.data[0].client.toString()).toBe(clientId1.toString());
    });
  });
});