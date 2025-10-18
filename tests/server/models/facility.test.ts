import mongoose from 'mongoose';
import { Facility, IFacility } from '../../../src/server/models/Facility';

describe('Facility Model', () => {
  it('should create a facility with valid data', async () => {
    const facilityData: Partial<IFacility> = {
      uid: 'facility-001',
      name: 'Test Waste Facility',
      address: '123 Industrial St',
      city: 'Test City',
      country: 'Test Country',
      region: 'Test Region',
      postal_code: '12345',
      email: 'contact@testfacility.com',
      phone: '+1-555-0123',
      door_count: 5,
      number_of_doors: 5,
      grid_width: 100,
      grid_depth: 50,
      disposal_number: 'DIS-001',
      rules_explosive_risk_check: true,
      rules_item_size_limit: true,
      client: new mongoose.Types.ObjectId(),
    };

    const facility = new Facility(facilityData);
    const savedFacility = await facility.save();

    expect(savedFacility.uid).toBe('facility-001');
    expect(savedFacility.name).toBe('Test Waste Facility');
    expect(savedFacility.city).toBe('Test City');
    expect(savedFacility.door_count).toBe(5);
    expect(savedFacility.rules_explosive_risk_check).toBe(true);
  });

  it('should require uid field', async () => {
    const facilityData = {
      name: 'Test Facility',
    };

    const facility = new Facility(facilityData);
    
    await expect(facility.save()).rejects.toThrow();
  });

  it('should require name field', async () => {
    const facilityData = {
      uid: 'facility-001',
    };

    const facility = new Facility(facilityData);
    
    await expect(facility.save()).rejects.toThrow();
  });

  it('should require client field', async () => {
    const facilityData = {
      uid: 'facility-001',
      name: 'Test Facility',
    };

    const facility = new Facility(facilityData);
    
    await expect(facility.save()).rejects.toThrow();
  });

  it('should set default values for rules', async () => {
    const facilityData: Partial<IFacility> = {
      uid: 'facility-001',
      name: 'Test Facility',
      client: new mongoose.Types.ObjectId(),
    };

    const facility = new Facility(facilityData);
    const savedFacility = await facility.save();

    expect(savedFacility.rules_explosive_risk_check).toBe(false);
    expect(savedFacility.rules_item_size_limit).toBe(false);
    expect(savedFacility.rules_singular_delivery_check).toBe(false);
  });
});
