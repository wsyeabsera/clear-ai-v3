import mongoose from 'mongoose';
import { Facility } from '../../../src/server/models/Facility';
import { Shipment } from '../../../src/server/models/Shipment';
import { CreateShipmentCommand } from '../../../src/server/commands/shipments/CreateShipmentCommand';
import { GetShipmentCommand } from '../../../src/server/commands/shipments/GetShipmentCommand';
import { UpdateShipmentCommand } from '../../../src/server/commands/shipments/UpdateShipmentCommand';
import { DeleteShipmentCommand } from '../../../src/server/commands/shipments/DeleteShipmentCommand';
import { ListShipmentsCommand } from '../../../src/server/commands/shipments/ListShipmentsCommand';

describe('Shipment Commands', () => {
  let facility: any;

  beforeEach(async () => {
    // Create a test facility first
    facility = new Facility({
      uid: 'facility-001',
      name: 'Test Facility',
      address: '123 Test St',
      city: 'Test City',
      country: 'Test Country',
      client: new mongoose.Types.ObjectId(),
    });
    await facility.save();
  });

  describe('CreateShipmentCommand', () => {
    it('should create a shipment with valid data', async () => {
      const command = new CreateShipmentCommand();
      const params = {
        uid: 'shipment-001',
        client_uid: 'client-001',
        license_plate: 'ABC-123',
        entry_weight: 1500.5,
        exit_weight: 1500.5,
        facility_uid: facility.uid,
        notes: 'Test shipment',
      };

      const result = await command.execute(params);

      expect(result.success).toBe(true);
      expect(result.data.uid).toBe('shipment-001');
      expect(result.data.license_plate).toBe('ABC-123');
      expect(result.data.entry_weight).toBe(1500.5);
    });

    it('should fail with missing required fields', async () => {
      const command = new CreateShipmentCommand();
      const params = {
        uid: 'shipment-001',
        // Missing client_uid and license_plate
      };

      const result = await command.execute(params);

      expect(result.success).toBe(false);
      expect(result.error).toBeDefined();
    });
  });

  describe('GetShipmentCommand', () => {
    let shipment: any;

    beforeEach(async () => {
      shipment = new Shipment({
        uid: 'shipment-001',
        client_uid: 'client-001',
        license_plate: 'ABC-123',
        facility: facility._id,
      });
      await shipment.save();
    });

    it('should get a shipment by uid', async () => {
      const command = new GetShipmentCommand();
      const params = { uid: 'shipment-001' };

      const result = await command.execute(params);

      expect(result.success).toBe(true);
      expect(result.data.uid).toBe('shipment-001');
      expect(result.data.license_plate).toBe('ABC-123');
    });

    it('should return error for non-existent shipment', async () => {
      const command = new GetShipmentCommand();
      const params = { uid: 'non-existent' };

      const result = await command.execute(params);

      expect(result.success).toBe(false);
      expect(result.error).toBeDefined();
    });
  });

  describe('UpdateShipmentCommand', () => {
    let shipment: any;

    beforeEach(async () => {
      shipment = new Shipment({
        uid: 'shipment-001',
        client_uid: 'client-001',
        license_plate: 'ABC-123',
        facility: facility._id,
      });
      await shipment.save();
    });

    it('should update a shipment', async () => {
      const command = new UpdateShipmentCommand();
      const params = {
        uid: 'shipment-001',
        notes: 'Updated notes',
        entry_weight: 2000,
      };

      const result = await command.execute(params);

      expect(result.success).toBe(true);
      expect(result.data.notes).toBe('Updated notes');
      expect(result.data.entry_weight).toBe(2000);
    });
  });

  describe('DeleteShipmentCommand', () => {
    let shipment: any;

    beforeEach(async () => {
      shipment = new Shipment({
        uid: 'shipment-001',
        client_uid: 'client-001',
        license_plate: 'ABC-123',
        facility: facility._id,
      });
      await shipment.save();
    });

    it('should delete a shipment', async () => {
      const command = new DeleteShipmentCommand();
      const params = { uid: 'shipment-001' };

      const result = await command.execute(params);

      expect(result.success).toBe(true);
      expect(result.message).toContain('deleted');

      // Verify it's deleted
      const deletedShipment = await Shipment.findOne({ uid: 'shipment-001' });
      expect(deletedShipment).toBeNull();
    });
  });

  describe('ListShipmentsCommand', () => {
    beforeEach(async () => {
      // Create multiple shipments
      const shipments = [
        {
          uid: 'shipment-001',
          client_uid: 'client-001',
          license_plate: 'ABC-123',
          facility: facility._id,
        },
        {
          uid: 'shipment-002',
          client_uid: 'client-001',
          license_plate: 'DEF-456',
          facility: facility._id,
        },
      ];

      for (const shipmentData of shipments) {
        const shipment = new Shipment(shipmentData);
        await shipment.save();
      }
    });

    it('should list all shipments', async () => {
      const command = new ListShipmentsCommand();
      const params = {};

      const result = await command.execute(params);

      expect(result.success).toBe(true);
      expect(result.data.length).toBe(2);
      expect(result.data[0].uid).toBeDefined();
      expect(result.data[1].uid).toBeDefined();
    });

    it('should filter shipments by client_uid', async () => {
      const command = new ListShipmentsCommand();
      const params = { client_uid: 'client-001' };

      const result = await command.execute(params);

      expect(result.success).toBe(true);
      expect(result.data.length).toBe(2);
    });
  });
});
