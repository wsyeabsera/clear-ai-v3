import mongoose from 'mongoose';
import { connectToDatabase, disconnectFromDatabase } from '../../../src/server/database/connection';
import { ShipmentWasteComposition, SEVERITY_ENUM } from '../../../src/server/models/ShipmentWasteComposition';
import { Shipment } from '../../../src/server/models/Shipment';
import { Facility } from '../../../src/server/models/Facility';
import { Bunker } from '../../../src/server/models/Bunker';

describe('ShipmentWasteComposition Model', () => {
  beforeAll(async () => {
    await connectToDatabase();
  });

  afterAll(async () => {
    await disconnectFromDatabase();
  });

  beforeEach(async () => {
    await ShipmentWasteComposition.deleteMany({});
    await Shipment.deleteMany({});
    await Facility.deleteMany({});
    await Bunker.deleteMany({});
  });

  describe('ShipmentWasteComposition Creation', () => {
    let shipment: any;
    let facility: any;
    let bunker: any;

    beforeEach(async () => {
      facility = new Facility({
        uid: 'facility-test-001',
        name: 'Test Facility',
        client: new mongoose.Types.ObjectId(),
      });
      await facility.save();

      bunker = new Bunker({
        uid: 'bunker-test-001',
        name: 'Test Bunker',
        facility: facility._id,
        capacity: 1000,
        current_load: 0,
        waste_type: 'Mixed Waste',
        status: 'active',
      });
      await bunker.save();

      shipment = new Shipment({
        uid: 'shipment-test-001',
        client_uid: 'client-test-001',
        license_plate: 'TEST-001',
        facility: facility._id,
      });
      await shipment.save();
    });

    it('should create a shipment waste composition with required fields', async () => {
      const compositionData = {
        uid: 'composition-test-001',
        client_uid: 'client-test-001',
        shipment: shipment._id,
        facility: facility._id,
        bunker: bunker._id,
      };

      const composition = new ShipmentWasteComposition(compositionData);
      const savedComposition = await composition.save();

      expect(savedComposition.uid).toBe('composition-test-001');
      expect(savedComposition.client_uid).toBe('client-test-001');
      expect(savedComposition.shipment.toString()).toBe(shipment._id.toString());
      expect(savedComposition.facility.toString()).toBe(facility._id.toString());
      expect(savedComposition.bunker.toString()).toBe(bunker._id.toString());
      expect(savedComposition.created_at).toBeDefined();
    });

    it('should create a shipment waste composition with all optional fields', async () => {
      const compositionData = {
        uid: 'composition-test-002',
        client_uid: 'client-test-001',
        shipment: shipment._id,
        facility: facility._id,
        bunker: bunker._id,
        moisture_level: SEVERITY_ENUM.MEDIUM,
        moisture_comment: 'Moderate moisture content detected',
        dust_load_level: SEVERITY_ENUM.LOW,
        dust_load_comment: 'Low dust levels',
        calorific_value_min: 8.5,
        calorific_value_max: 11.5,
        calorific_value_comment: 'Within expected range for mixed waste',
        biogenic_content_percentage: 65.0,
        biogenic_content_comment: 'High biogenic content from organic waste',
        sulfur_dioxide_risk: SEVERITY_ENUM.LOW,
        sulfur_dioxide_comment: 'Low SO2 emission risk',
        hydrochloric_acid_risk: SEVERITY_ENUM.LOW,
        hydrochloric_acid_comment: 'Low HCl emission risk',
        mono_charge_detected: false,
        mono_charge_comment: 'No mono charge detected',
        likely_ewc_code: '20 03 01',
        likely_ewc_description: 'Mixed Municipal Waste',
        likely_ewc_comment: 'Confirmed classification',
      };

      const composition = new ShipmentWasteComposition(compositionData);
      const savedComposition = await composition.save();

      expect(savedComposition.moisture_level).toBe(SEVERITY_ENUM.MEDIUM);
      expect(savedComposition.dust_load_level).toBe(SEVERITY_ENUM.LOW);
      expect(savedComposition.calorific_value_min).toBe(8.5);
      expect(savedComposition.calorific_value_max).toBe(11.5);
      expect(savedComposition.biogenic_content_percentage).toBe(65.0);
      expect(savedComposition.sulfur_dioxide_risk).toBe(SEVERITY_ENUM.LOW);
      expect(savedComposition.hydrochloric_acid_risk).toBe(SEVERITY_ENUM.LOW);
      expect(savedComposition.mono_charge_detected).toBe(false);
      expect(savedComposition.likely_ewc_code).toBe('20 03 01');
    });

    it('should not create a shipment waste composition without required fields', async () => {
      const compositionData = {
        moisture_level: SEVERITY_ENUM.HIGH,
      };

      const composition = new ShipmentWasteComposition(compositionData);
      
      await expect(composition.save()).rejects.toThrow();
    });

    it('should not create a shipment waste composition with duplicate UID', async () => {
      const compositionData = {
        uid: 'composition-test-duplicate',
        client_uid: 'client-test-001',
        shipment: shipment._id,
        facility: facility._id,
        bunker: bunker._id,
      };

      const composition1 = new ShipmentWasteComposition(compositionData);
      await composition1.save();

      const composition2 = new ShipmentWasteComposition({
        ...compositionData,
        moisture_level: SEVERITY_ENUM.HIGH,
      });

      await expect(composition2.save()).rejects.toThrow();
    });

    it('should validate biogenic content percentage range', async () => {
      const compositionData = {
        uid: 'composition-test-invalid-percentage',
        client_uid: 'client-test-001',
        shipment: shipment._id,
        facility: facility._id,
        bunker: bunker._id,
        biogenic_content_percentage: 150, // Invalid: > 100
      };

      const composition = new ShipmentWasteComposition(compositionData);
      
      await expect(composition.save()).rejects.toThrow();
    });
  });

  describe('ShipmentWasteComposition Queries', () => {
    let compositions: any[];

    beforeEach(async () => {
      const facility = new Facility({
        uid: 'facility-test-002',
        name: 'Test Facility 2',
        client: new mongoose.Types.ObjectId(),
      });
      await facility.save();

      const bunker = new Bunker({
        uid: 'bunker-test-002',
        name: 'Test Bunker 2',
        facility: facility._id,
        capacity: 1000,
        waste_type: 'Mixed Waste',
        status: 'active',
      });
      await bunker.save();

      const shipments = await Shipment.insertMany([
        {
          uid: 'shipment-test-002',
          client_uid: 'client-test-002',
          license_plate: 'TEST-002',
          facility: facility._id,
        },
        {
          uid: 'shipment-test-003',
          client_uid: 'client-test-002',
          license_plate: 'TEST-003',
          facility: facility._id,
        },
      ]);

      compositions = await ShipmentWasteComposition.insertMany([
        {
          uid: 'composition-test-003',
          client_uid: 'client-test-002',
          shipment: shipments[0]._id,
          facility: facility._id,
          bunker: bunker._id,
          moisture_level: SEVERITY_ENUM.MEDIUM,
          sulfur_dioxide_risk: SEVERITY_ENUM.LOW,
        },
        {
          uid: 'composition-test-004',
          client_uid: 'client-test-002',
          shipment: shipments[1]._id,
          facility: facility._id,
          bunker: bunker._id,
          moisture_level: SEVERITY_ENUM.HIGH,
          sulfur_dioxide_risk: SEVERITY_ENUM.MEDIUM,
        },
      ]);
    });

    it('should find compositions by client UID', async () => {
      const foundCompositions = await ShipmentWasteComposition.find({ 
        client_uid: 'client-test-002' 
      });
      expect(foundCompositions).toHaveLength(2);
    });

    it('should find compositions by moisture level', async () => {
      const foundCompositions = await ShipmentWasteComposition.find({ 
        moisture_level: SEVERITY_ENUM.MEDIUM 
      });
      expect(foundCompositions).toHaveLength(1);
      expect(foundCompositions[0].uid).toBe('composition-test-003');
    });

    it('should find compositions by sulfur dioxide risk', async () => {
      const foundCompositions = await ShipmentWasteComposition.find({ 
        sulfur_dioxide_risk: SEVERITY_ENUM.LOW 
      });
      expect(foundCompositions).toHaveLength(1);
    });

    it('should find compositions with mono charge detected', async () => {
      const composition = new ShipmentWasteComposition({
        uid: 'composition-test-005',
        client_uid: 'client-test-002',
        shipment: compositions[0].shipment,
        facility: compositions[0].facility,
        bunker: compositions[0].bunker,
        mono_charge_detected: true,
      });
      await composition.save();

      const foundCompositions = await ShipmentWasteComposition.find({ 
        mono_charge_detected: true 
      });
      expect(foundCompositions).toHaveLength(1);
    });
  });

  describe('ShipmentWasteComposition Updates', () => {
    let composition: any;

    beforeEach(async () => {
      const facility = new Facility({
        uid: 'facility-test-003',
        name: 'Test Facility 3',
        client: new mongoose.Types.ObjectId(),
      });
      await facility.save();

      const bunker = new Bunker({
        uid: 'bunker-test-003',
        name: 'Test Bunker 3',
        facility: facility._id,
        capacity: 1000,
        waste_type: 'Mixed Waste',
        status: 'active',
      });
      await bunker.save();

      const shipment = new Shipment({
        uid: 'shipment-test-004',
        client_uid: 'client-test-003',
        license_plate: 'TEST-004',
        facility: facility._id,
      });
      await shipment.save();

      composition = new ShipmentWasteComposition({
        uid: 'composition-test-006',
        client_uid: 'client-test-003',
        shipment: shipment._id,
        facility: facility._id,
        bunker: bunker._id,
        moisture_level: SEVERITY_ENUM.LOW,
        calorific_value_min: 8.0,
        calorific_value_max: 12.0,
      });
      await composition.save();
    });

    it('should update composition fields', async () => {
      composition.moisture_level = SEVERITY_ENUM.HIGH;
      composition.calorific_value_min = 10.0;
      composition.calorific_value_max = 14.0;
      composition.biogenic_content_percentage = 70.0;
      composition.updated_at = new Date();
      
      const updatedComposition = await composition.save();

      expect(updatedComposition.moisture_level).toBe(SEVERITY_ENUM.HIGH);
      expect(updatedComposition.calorific_value_min).toBe(10.0);
      expect(updatedComposition.calorific_value_max).toBe(14.0);
      expect(updatedComposition.biogenic_content_percentage).toBe(70.0);
      expect(updatedComposition.updated_at).toBeDefined();
    });

    it('should soft delete a composition', async () => {
      composition.deleted_at = new Date();
      composition.deleted_by_uid = 'user-test-001';
      
      const deletedComposition = await composition.save();

      expect(deletedComposition.deleted_at).toBeDefined();
      expect(deletedComposition.deleted_by_uid).toBe('user-test-001');
    });
  });
});
