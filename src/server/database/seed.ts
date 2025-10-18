import mongoose from 'mongoose';
import { connectToDatabase, disconnectFromDatabase } from './connection';
import { Facility } from '../models/Facility';
import { Shipment } from '../models/Shipment';
import { Contaminant } from '../models/Contaminant';
import { Inspection } from '../models/Inspection';

async function seed() {
  try {
    console.log('Connecting to database...');
    await connectToDatabase();

    console.log('Clearing existing data...');
    await Facility.deleteMany({});
    await Shipment.deleteMany({});
    await Contaminant.deleteMany({});
    await Inspection.deleteMany({});

    console.log('Creating facilities...');
    const facilities = await Facility.insertMany([
      {
        uid: 'facility-001',
        name: 'Central Waste Processing Facility',
        address: '123 Industrial Blvd',
        city: 'Berlin',
        country: 'Germany',
        region: 'Brandenburg',
        postal_code: '10115',
        email: 'contact@central-waste.de',
        phone: '+49-30-12345678',
        door_count: 10,
        number_of_doors: 10,
        grid_width: 200,
        grid_depth: 100,
        disposal_number: 'DE-001',
        rules_explosive_risk_check: true,
        rules_item_size_limit: true,
        rules_waste_item_rule_check: true,
        client: new mongoose.Types.ObjectId(),
      },
      {
        uid: 'facility-002',
        name: 'North Sorting Center',
        address: '456 Recycling Way',
        city: 'Hamburg',
        country: 'Germany',
        region: 'Hamburg',
        postal_code: '20095',
        email: 'info@north-sorting.de',
        phone: '+49-40-98765432',
        door_count: 8,
        number_of_doors: 8,
        grid_width: 150,
        grid_depth: 80,
        disposal_number: 'DE-002',
        rules_explosive_risk_check: true,
        rules_singular_delivery_check: true,
        client: new mongoose.Types.ObjectId(),
      },
    ]);

    console.log('Creating shipments...');
    const shipments = await Shipment.insertMany([
      {
        uid: 'shipment-001',
        client_uid: 'client-001',
        license_plate: 'B-WM-1234',
        entry_timestamp: new Date('2025-01-18T08:00:00Z'),
        entry_weight: 15000,
        exit_timestamp: new Date('2025-01-18T09:30:00Z'),
        exit_weight: 0,
        gate_number: 1,
        shipment_datetime: new Date('2025-01-18T08:00:00Z'),
        notes: 'Mixed waste delivery from construction site',
        source: 'Construction Site Alpha',
        scale_overwrite: false,
        is_duplicate_check_applied: true,
        facility: facilities[0]._id,
      },
      {
        uid: 'shipment-002',
        client_uid: 'client-001',
        license_plate: 'HH-RC-5678',
        entry_timestamp: new Date('2025-01-18T10:00:00Z'),
        entry_weight: 8500,
        exit_timestamp: new Date('2025-01-18T11:00:00Z'),
        exit_weight: 0,
        gate_number: 2,
        shipment_datetime: new Date('2025-01-18T10:00:00Z'),
        notes: 'Plastic waste from industrial facility',
        source: 'Industrial Park Beta',
        scale_overwrite: false,
        is_duplicate_check_applied: true,
        facility: facilities[1]._id,
      },
      {
        uid: 'shipment-003',
        client_uid: 'client-002',
        license_plate: 'B-WM-9999',
        entry_timestamp: new Date('2025-01-18T14:00:00Z'),
        entry_weight: 12000,
        gate_number: 3,
        shipment_datetime: new Date('2025-01-18T14:00:00Z'),
        notes: 'Metal waste collection',
        source: 'Scrap Yard Gamma',
        facility: facilities[0]._id,
      },
    ]);

    console.log('Creating contaminants...');
    await Contaminant.insertMany([
      {
        uid: 'contaminant-001',
        is_verified: true,
        is_correct: true,
        notes: 'Plastic bottle detected in metal waste',
        analysis_notes: 'PET plastic, estimated 500ml bottle',
        gcp_image_path: '/images/contaminant-001.jpg',
        gcp_highlight_path: '/images/contaminant-001-highlight.jpg',
        waste_item_uid: 'waste-item-plastic-001',
        friendly_name: 'Plastic Bottle',
        local_friendly_name: 'Plastikflasche',
        estimated_size: 50,
        material: 'Plastic - PET',
        local_material: 'Kunststoff - PET',
        hydrochloric_acid_risk_level: { level: 'low', value: 0.1 },
        sulfur_dioxide_risk_level: { level: 'low', value: 0.05 },
        explosive_risk_level: { level: 'none', value: 0 },
        gate_number: '1',
        entry_timestamp: new Date('2025-01-18T08:15:00Z'),
        license_plate: 'B-WM-1234',
        captured_datetime: new Date('2025-01-18T08:20:00Z'),
        client: new mongoose.Types.ObjectId(),
        facility: facilities[0]._id,
        shipment: shipments[0]._id,
      },
      {
        uid: 'contaminant-002',
        is_verified: false,
        is_correct: false,
        notes: 'Possible hazardous material detected',
        analysis_notes: 'Requires further inspection - chemical container',
        gcp_image_path: '/images/contaminant-002.jpg',
        waste_item_uid: 'waste-item-chemical-001',
        friendly_name: 'Chemical Container',
        estimated_size: 200,
        material: 'Unknown Chemical',
        hydrochloric_acid_risk_level: { level: 'high', value: 0.8 },
        sulfur_dioxide_risk_level: { level: 'medium', value: 0.5 },
        explosive_risk_level: { level: 'medium', value: 0.6 },
        gate_number: '2',
        entry_timestamp: new Date('2025-01-18T10:10:00Z'),
        license_plate: 'HH-RC-5678',
        captured_datetime: new Date('2025-01-18T10:15:00Z'),
        client: new mongoose.Types.ObjectId(),
        facility: facilities[1]._id,
        shipment: shipments[1]._id,
      },
    ]);

    console.log('Creating inspections...');
    await Inspection.insertMany([
      {
        uid: 'inspection-001',
        client_uid: 'client-001',
        calorific_value: 18.5,
        comments: 'Standard waste inspection completed. Minor contamination detected.',
        consistency: 'Mixed solid waste',
        custom_datetime: new Date('2025-01-18T08:30:00Z'),
        delivery_accepted: true,
        delivery_matches_conditions: true,
        delivery_rejected: false,
        edge_length: 2.5,
        external_reference_id: 'INS-2025-001',
        fecal_smell: false,
        incorrectly_declared: false,
        license_plate: 'B-WM-1234',
        moisture: 15.5,
        partial_unloading: false,
        pungent_smell: false,
        salvage: false,
        sample_incineration: false,
        solvent_like_smell: false,
        facility: facilities[0]._id,
        shipment: shipments[0]._id,
      },
      {
        uid: 'inspection-002',
        client_uid: 'client-001',
        calorific_value: 22.3,
        comments: 'Hazardous material suspected. Delivery rejected pending further analysis.',
        consistency: 'Industrial plastic waste',
        custom_datetime: new Date('2025-01-18T10:30:00Z'),
        delivery_accepted: false,
        delivery_matches_conditions: false,
        delivery_rejected: true,
        edge_length: 1.8,
        external_reference_id: 'INS-2025-002',
        fecal_smell: false,
        incorrectly_declared: true,
        license_plate: 'HH-RC-5678',
        moisture: 5.2,
        partial_unloading: false,
        pungent_smell: true,
        salvage: false,
        sample_incineration: true,
        solvent_like_smell: true,
        facility: facilities[1]._id,
        shipment: shipments[1]._id,
      },
      {
        uid: 'inspection-003',
        client_uid: 'client-002',
        calorific_value: 12.1,
        comments: 'Metal waste inspection - all clear',
        consistency: 'Scrap metal',
        custom_datetime: new Date('2025-01-18T14:30:00Z'),
        delivery_accepted: true,
        delivery_matches_conditions: true,
        delivery_rejected: false,
        edge_length: 3.0,
        external_reference_id: 'INS-2025-003',
        fecal_smell: false,
        incorrectly_declared: false,
        license_plate: 'B-WM-9999',
        moisture: 2.1,
        partial_unloading: false,
        pungent_smell: false,
        salvage: true,
        sample_incineration: false,
        solvent_like_smell: false,
        facility: facilities[0]._id,
        shipment: shipments[2]._id,
      },
    ]);

    console.log('✅ Database seeded successfully!');
    console.log(`   - ${facilities.length} facilities`);
    console.log(`   - ${shipments.length} shipments`);
    console.log(`   - 2 contaminants`);
    console.log(`   - 3 inspections`);

    await disconnectFromDatabase();
  } catch (error) {
    console.error('Error seeding database:', error);
    process.exit(1);
  }
}

// Run seed if called directly
if (require.main === module) {
  seed();
}

export { seed };
