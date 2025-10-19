import mongoose from 'mongoose';
import { Inspection, IInspection } from '../../../src/server/models/Inspection';
import { Facility } from '../../../src/server/models/Facility';
import { Shipment } from '../../../src/server/models/Shipment';

describe('Inspection Model', () => {
  let facility: any;
  let shipment: any;

  beforeEach(async () => {
    // Create test facility
    facility = new Facility({
      name: 'Test Facility',
      client: new mongoose.Types.ObjectId(),
      created_at: new Date()
    });
    await facility.save();

    // Create test shipment
    shipment = new Shipment({
      client: new mongoose.Types.ObjectId(),
      license_plate: 'ABC-123',
      facility: facility._id,
      created_at: new Date()
    });
    await shipment.save();
  });

  it('should create an inspection with valid data', async () => {
    const inspectionData: Partial<IInspection> = {
      client: new mongoose.Types.ObjectId(),
      calorific_value: 18.5,
      comments: 'Inspection completed successfully',
      consistency: 'Mixed waste',
      custom_datetime: new Date('2025-01-18T10:00:00Z'),
      delivery_accepted: true,
      delivery_matches_conditions: true,
      delivery_rejected: false,
      edge_length: 2.5,
      external_reference_id: 'EXT-001',
      fecal_smell: false,
      incorrectly_declared: false,
      license_plate: 'ABC-123',
      moisture: 25.5,
      partial_unloading: false,
      pungent_smell: false,
      salvage: false,
      sample_incineration: false,
      solvent_like_smell: false,
      facility: facility._id,
      shipment: shipment._id,
      created_at: new Date()
    };

    const inspection = new Inspection(inspectionData);
    const savedInspection = await inspection.save();

    expect(savedInspection.calorific_value).toBe(18.5);
    expect(savedInspection.delivery_accepted).toBe(true);
    expect(savedInspection.moisture).toBe(25.5);
    expect(savedInspection.facility.toString()).toBe(facility._id.toString());
    expect(savedInspection.shipment.toString()).toBe(shipment._id.toString());
  });

  it('should require client field', async () => {
    const inspectionData = {
      facility: facility._id,
      shipment: shipment._id,
    };

    const inspection = new Inspection(inspectionData);
    
    await expect(inspection.save()).rejects.toThrow();
  });

  it('should require facility field', async () => {
    const inspectionData = {
      client: new mongoose.Types.ObjectId(),
      shipment: shipment._id,
    };

    const inspection = new Inspection(inspectionData);
    
    await expect(inspection.save()).rejects.toThrow();
  });

  it('should require shipment field', async () => {
    const inspectionData = {
      client: new mongoose.Types.ObjectId(),
      facility: facility._id,
    };

    const inspection = new Inspection(inspectionData);
    
    await expect(inspection.save()).rejects.toThrow();
  });

  it('should set default values for boolean fields', async () => {
    const inspectionData: Partial<IInspection> = {
      client: new mongoose.Types.ObjectId(),
      facility: facility._id,
      shipment: shipment._id,
      created_at: new Date()
    };

    const inspection = new Inspection(inspectionData);
    const savedInspection = await inspection.save();

    expect(savedInspection.delivery_accepted).toBe(false);
    expect(savedInspection.delivery_matches_conditions).toBe(false);
    expect(savedInspection.delivery_rejected).toBe(false);
    expect(savedInspection.fecal_smell).toBe(false);
    expect(savedInspection.pungent_smell).toBe(false);
    expect(savedInspection.solvent_like_smell).toBe(false);
  });

  it('should populate facility and shipment references', async () => {
    const inspectionData: Partial<IInspection> = {
      client: new mongoose.Types.ObjectId(),
      facility: facility._id,
      shipment: shipment._id,
      created_at: new Date()
    };

    const inspection = new Inspection(inspectionData);
    await inspection.save();

    const populatedInspection = await Inspection.findById(inspection._id)
      .populate('facility')
      .populate('shipment');
    
    expect(populatedInspection?.facility).toBeDefined();
    expect((populatedInspection?.facility as any).name).toBe('Test Facility');
    expect(populatedInspection?.shipment).toBeDefined();
    expect((populatedInspection?.shipment as any).license_plate).toBe('ABC-123');
  });
});
