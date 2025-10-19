import mongoose from 'mongoose';
import { Contaminant, IContaminant } from '../../../src/server/models/Contaminant';
import { Facility } from '../../../src/server/models/Facility';
import { Shipment } from '../../../src/server/models/Shipment';

describe('Contaminant Model', () => {
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

  it('should create a contaminant with valid data', async () => {
    const contaminantData: Partial<IContaminant> = {
      is_verified: true,
      is_correct: true,
      notes: 'Plastic contamination detected',
      local_notes: 'Local notes about contamination',
      analysis_notes: 'Detailed analysis results',
      gcp_image_path: '/images/contaminant-001.jpg',
      gcp_highlight_path: '/images/contaminant-001-highlight.jpg',
      waste_item: new mongoose.Types.ObjectId(),
      friendly_name: 'Plastic Bottle',
      local_friendly_name: 'Local Plastic Bottle',
      estimated_size: 50,
      material: 'Plastic',
      local_material: 'Local Plastic',
      gate_number: '1',
      entry_timestamp: new Date('2025-01-18T10:00:00Z'),
      license_plate: 'ABC-123',
      captured_datetime: new Date('2025-01-18T10:05:00Z'),
      client: new mongoose.Types.ObjectId(),
      facility: facility._id,
      shipment: shipment._id,
      created_at: new Date()
    };

    const contaminant = new Contaminant(contaminantData);
    const savedContaminant = await contaminant.save();

    expect(savedContaminant.is_verified).toBe(true);
    expect(savedContaminant.is_correct).toBe(true);
    expect(savedContaminant.notes).toBe('Plastic contamination detected');
    expect(savedContaminant.facility.toString()).toBe(facility._id.toString());
    expect(savedContaminant.shipment.toString()).toBe(shipment._id.toString());
  });

  it('should require client field', async () => {
    const contaminantData = {
      facility: facility._id,
      shipment: shipment._id,
    };

    const contaminant = new Contaminant(contaminantData);
    
    await expect(contaminant.save()).rejects.toThrow();
  });

  it('should require facility field', async () => {
    const contaminantData = {
      client: new mongoose.Types.ObjectId(),
      shipment: shipment._id,
    };

    const contaminant = new Contaminant(contaminantData);
    
    await expect(contaminant.save()).rejects.toThrow();
  });

  it('should require shipment field', async () => {
    const contaminantData = {
      client: new mongoose.Types.ObjectId(),
      facility: facility._id,
    };

    const contaminant = new Contaminant(contaminantData);
    
    await expect(contaminant.save()).rejects.toThrow();
  });

  it('should populate facility and shipment references', async () => {
    const contaminantData: Partial<IContaminant> = {
      client: new mongoose.Types.ObjectId(),
      facility: facility._id,
      shipment: shipment._id,
      created_at: new Date()
    };

    const contaminant = new Contaminant(contaminantData);
    await contaminant.save();

    const populatedContaminant = await Contaminant.findById(contaminant._id)
      .populate('facility')
      .populate('shipment');
    
    expect(populatedContaminant?.facility).toBeDefined();
    expect((populatedContaminant?.facility as any).name).toBe('Test Facility');
    expect(populatedContaminant?.shipment).toBeDefined();
    expect((populatedContaminant?.shipment as any).license_plate).toBe('ABC-123');
  });
});
