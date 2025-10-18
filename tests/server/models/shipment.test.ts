import mongoose from 'mongoose';
import { Shipment, IShipment } from '../../../src/server/models/Shipment';
import { Facility } from '../../../src/server/models/Facility';

describe('Shipment Model', () => {
  let facility: any;

  beforeEach(async () => {
    // Create a test facility first
    facility = new Facility({
      uid: 'facility-001',
      name: 'Test Facility',
      address: '123 Test St',
      city: 'Test City',
      country: 'Test Country',
      client: new mongoose.Types.ObjectId()
    });
    await facility.save();
  });

  it('should create a shipment with valid data', async () => {
    const shipmentData: Partial<IShipment> = {
      uid: 'shipment-001',
      client_uid: 'client-001',
      license_plate: 'ABC-123',
      entry_timestamp: new Date('2025-01-18T10:00:00Z'),
      entry_weight: 1500.5,
      exit_timestamp: new Date('2025-01-18T11:00:00Z'),
      exit_weight: 1500.5,
      external_reference_id: 'EXT-001',
      gate_number: 1,
      shipment_datetime: new Date('2025-01-18T10:30:00Z'),
      notes: 'Test shipment',
      source: 'Test Source',
      scale_overwrite: false,
      is_duplicate_check_applied: true,
      facility: facility._id,
    };

    const shipment = new Shipment(shipmentData);
    const savedShipment = await shipment.save();

    expect(savedShipment.uid).toBe('shipment-001');
    expect(savedShipment.license_plate).toBe('ABC-123');
    expect(savedShipment.entry_weight).toBe(1500.5);
    expect(savedShipment.facility?.toString()).toBe(facility._id.toString());
  });

  it('should require uid field', async () => {
    const shipmentData = {
      client_uid: 'client-001',
      license_plate: 'ABC-123',
    };

    const shipment = new Shipment(shipmentData);
    
    await expect(shipment.save()).rejects.toThrow();
  });

  it('should require client_uid field', async () => {
    const shipmentData = {
      uid: 'shipment-001',
      license_plate: 'ABC-123',
    };

    const shipment = new Shipment(shipmentData);
    
    await expect(shipment.save()).rejects.toThrow();
  });

  it('should populate facility reference', async () => {
    const shipmentData: Partial<IShipment> = {
      uid: 'shipment-001',
      client_uid: 'client-001',
      license_plate: 'ABC-123',
      facility: facility._id,
    };

    const shipment = new Shipment(shipmentData);
    await shipment.save();

    const populatedShipment = await Shipment.findById(shipment._id).populate('facility');
    
    expect(populatedShipment?.facility).toBeDefined();
    expect((populatedShipment?.facility as any).name).toBe('Test Facility');
  });
});
