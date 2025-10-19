import mongoose from 'mongoose';
import { faker } from '@faker-js/faker';
import { connectToDatabase, disconnectFromDatabase } from './connection';
import { Facility } from '../models/Facility';
import { Shipment } from '../models/Shipment';
import { Contaminant } from '../models/Contaminant';
import { Inspection } from '../models/Inspection';
import { Contract } from '../models/Contract';
import { WasteCode } from '../models/WasteCode';
import { WasteGenerator } from '../models/WasteGenerator';
import { ShipmentWasteComposition, SEVERITY_ENUM } from '../models/ShipmentWasteComposition';
import { Bunker } from '../models/Bunker';
import { WasteProperty } from '../models/WasteProperty';

async function seed() {
  try {
    console.log('Connecting to database...');
    await connectToDatabase();

    console.log('Clearing existing data...');
    await Facility.deleteMany({});
    await Shipment.deleteMany({});
    await Contaminant.deleteMany({});
    await Inspection.deleteMany({});
    await Contract.deleteMany({});
    await WasteCode.deleteMany({});
    await WasteGenerator.deleteMany({});
    await ShipmentWasteComposition.deleteMany({});
    await Bunker.deleteMany({});
    await WasteProperty.deleteMany({});

    console.log('Creating facilities...');
    const facilities = await Facility.insertMany([
      {
        name: faker.company.name() + ' Waste Processing Facility',
        address: faker.location.streetAddress(),
        city: faker.location.city(),
        country: faker.location.country(),
        region: faker.location.state(),
        postal_code: faker.location.zipCode(),
        email: faker.internet.email(),
        phone: faker.phone.number(),
        door_count: faker.number.int({ min: 5, max: 20 }),
        number_of_doors: faker.number.int({ min: 5, max: 20 }),
        grid_width: faker.number.int({ min: 100, max: 500 }),
        grid_depth: faker.number.int({ min: 50, max: 200 }),
        disposal_number: faker.string.alphanumeric({ length: 8, casing: 'upper' }),
        rules_explosive_risk_check: faker.datatype.boolean(),
        rules_item_size_limit: faker.datatype.boolean(),
        rules_waste_item_rule_check: faker.datatype.boolean(),
        client: new mongoose.Types.ObjectId(),
      },
      {
        name: faker.company.name() + ' Sorting Center',
        address: faker.location.streetAddress(),
        city: faker.location.city(),
        country: faker.location.country(),
        region: faker.location.state(),
        postal_code: faker.location.zipCode(),
        email: faker.internet.email(),
        phone: faker.phone.number(),
        door_count: faker.number.int({ min: 5, max: 20 }),
        number_of_doors: faker.number.int({ min: 5, max: 20 }),
        grid_width: faker.number.int({ min: 100, max: 500 }),
        grid_depth: faker.number.int({ min: 50, max: 200 }),
        disposal_number: faker.string.alphanumeric({ length: 8, casing: 'upper' }),
        rules_explosive_risk_check: faker.datatype.boolean(),
        rules_singular_delivery_check: faker.datatype.boolean(),
        client: new mongoose.Types.ObjectId(),
      },
    ]);

    console.log('Creating shipments...');
    const shipments = await Shipment.insertMany([
      {
        client: new mongoose.Types.ObjectId(),
        license_plate: faker.vehicle.vrm(),
        entry_timestamp: faker.date.recent({ days: 30 }),
        entry_weight: faker.number.int({ min: 5000, max: 25000 }),
        exit_timestamp: faker.date.recent({ days: 30 }),
        exit_weight: 0,
        gate_number: faker.number.int({ min: 1, max: 10 }),
        shipment_datetime: faker.date.recent({ days: 30 }),
        notes: faker.lorem.sentence(),
        source: faker.company.name(),
        scale_overwrite: faker.datatype.boolean(),
        is_duplicate_check_applied: faker.datatype.boolean(),
        facility: facilities[0]._id,
      },
      {
        client: new mongoose.Types.ObjectId(),
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
        client: new mongoose.Types.ObjectId(),
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
        is_verified: true,
        is_correct: true,
        notes: 'Plastic bottle detected in metal waste',
        analysis_notes: 'PET plastic, estimated 500ml bottle',
        gcp_image_path: '/images/contaminant-001.jpg',
        gcp_highlight_path: '/images/contaminant-001-highlight.jpg',
        waste_item: new mongoose.Types.ObjectId(),
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
        is_verified: false,
        is_correct: false,
        notes: 'Possible hazardous material detected',
        analysis_notes: 'Requires further inspection - chemical container',
        gcp_image_path: '/images/contaminant-002.jpg',
        waste_item: new mongoose.Types.ObjectId(),
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
        client: new mongoose.Types.ObjectId(),
        created_at: new Date()
      },
      {
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
        client: new mongoose.Types.ObjectId(),
        created_at: new Date()
      },
      {
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
        client: new mongoose.Types.ObjectId(),
        created_at: new Date()
      },
    ]);

    console.log('Creating waste codes...');
    const wasteCodes = await WasteCode.insertMany([
      {
        code: '20 03 01',
        name: 'Mixed Municipal Waste',
        description: 'Mixed waste from households and similar establishments',
        color_code: '#FF6B6B',
        code_with_spaces: '20 03 01',
        calorific_value_min: 8.0,
        calorific_value_max: 12.0,
        calorific_value_comment: 'Typical range for mixed municipal waste',
        source: 'European Waste Catalogue',
        created_at: new Date()
      },
      {
        code: '15 01 02',
        name: 'Plastic Packaging',
        description: 'Plastic packaging waste excluding containers',
        color_code: '#4ECDC4',
        code_with_spaces: '15 01 02',
        calorific_value_min: 35.0,
        calorific_value_max: 45.0,
        calorific_value_comment: 'High calorific value for plastic waste',
        source: 'European Waste Catalogue',
        created_at: new Date()
      },
      {
        code: '17 04 05',
        name: 'Iron and Steel',
        description: 'Iron and steel scrap metal',
        color_code: '#45B7D1',
        code_with_spaces: '17 04 05',
        calorific_value_min: 0.0,
        calorific_value_max: 1.0,
        calorific_value_comment: 'Minimal calorific value for metal waste',
        source: 'European Waste Catalogue',
        created_at: new Date()
      },
    ]);

    console.log('Creating waste generators...');
    const wasteGenerators = await WasteGenerator.insertMany([
      {
        name: faker.company.name() + ' Construction Site',
        external_reference_id: faker.string.alphanumeric({ length: 12, casing: 'upper' }),
        region: faker.location.state(),
        // Contact information
        phone: faker.phone.number(),
        telephone: faker.phone.number(),
        email: faker.internet.email(),
        // Address information
        address: faker.location.streetAddress(),
        street_address: faker.location.street(),
        city: faker.location.city(),
        postal_code: faker.location.zipCode(),
        zip_code: faker.location.zipCode(),
        country: faker.location.country(),
        address_notes: faker.lorem.sentence(),
        // Other fields
        source: 'Construction',
        notes: faker.lorem.paragraph(),
        client: new mongoose.Types.ObjectId(),
        created_at: new Date()
      },
      {
        name: faker.company.name() + ' Industrial Park',
        external_reference_id: faker.string.alphanumeric({ length: 12, casing: 'upper' }),
        region: faker.location.state(),
        // Contact information
        phone: faker.phone.number(),
        telephone: faker.phone.number(),
        email: faker.internet.email(),
        // Address information
        address: faker.location.streetAddress(),
        street_address: faker.location.street(),
        city: faker.location.city(),
        postal_code: faker.location.zipCode(),
        zip_code: faker.location.zipCode(),
        country: faker.location.country(),
        address_notes: faker.lorem.sentence(),
        // Other fields
        source: 'Industrial',
        notes: faker.lorem.paragraph(),
        client: new mongoose.Types.ObjectId(),
        created_at: new Date()
      },
      {
        name: faker.company.name() + ' Scrap Yard',
        external_reference_id: faker.string.alphanumeric({ length: 12, casing: 'upper' }),
        region: faker.location.state(),
        // Contact information
        phone: faker.phone.number(),
        telephone: faker.phone.number(),
        email: faker.internet.email(),
        // Address information
        address: faker.location.streetAddress(),
        street_address: faker.location.street(),
        city: faker.location.city(),
        postal_code: faker.location.zipCode(),
        zip_code: faker.location.zipCode(),
        country: faker.location.country(),
        address_notes: faker.lorem.sentence(),
        // Other fields
        source: 'Recycling',
        notes: faker.lorem.paragraph(),
        client: new mongoose.Types.ObjectId(),
        created_at: new Date()
      },
    ]);

    console.log('Creating contracts...');
    const contracts = await Contract.insertMany([
      {
        title: 'Municipal Waste Processing Contract 2025',
        external_reference_id: 'CONTRACT-2025-001',
        external_waste_code_id: '20 03 01',
        start_date: new Date('2025-01-01T00:00:00Z'),
        end_date: new Date('2025-12-31T23:59:59Z'),
        tonnage_min: 1000,
        tonnage_max: 5000,
        tonnage_actual: 1250,
        source: 'Contract Management System',
        facility: facilities[0]._id,
        client: facilities[0]._id, // Simplified for seed data
        waste_generator: wasteGenerators[0]._id,
        waste_code: wasteCodes[0]._id,
        created_at: new Date()
      },
      {
        title: 'Plastic Waste Processing Agreement',
        external_reference_id: 'CONTRACT-2025-002',
        external_waste_code_id: '15 01 02',
        start_date: new Date('2025-01-01T00:00:00Z'),
        end_date: new Date('2025-06-30T23:59:59Z'),
        tonnage_min: 500,
        tonnage_max: 2000,
        tonnage_actual: 750,
        source: 'Contract Management System',
        facility: facilities[1]._id,
        client: facilities[1]._id,
        waste_generator: wasteGenerators[1]._id,
        waste_code: wasteCodes[1]._id,
        created_at: new Date()
      },
    ]);

    console.log('Creating bunkers...');
    const bunkers = await Bunker.insertMany([
      {
        name: 'Bunker A - Mixed Waste',
        facility: facilities[0]._id,
        capacity: 1000,
        current_load: 250,
        waste_type: 'Mixed Municipal Waste',
        status: 'active',
        created_at: new Date()
      },
      {
        name: 'Bunker B - Plastic Waste',
        facility: facilities[1]._id,
        capacity: 800,
        current_load: 150,
        waste_type: 'Plastic Packaging',
        status: 'active',
        created_at: new Date()
      },
      {
        name: 'Bunker C - Metal Waste',
        facility: facilities[0]._id,
        capacity: 1200,
        current_load: 400,
        waste_type: 'Iron and Steel',
        status: 'active',
        created_at: new Date()
      },
    ]);

    console.log('Creating waste properties...');
    const wasteProperties = await WasteProperty.insertMany([
      {
        contract: contracts[0]._id,
        client: new mongoose.Types.ObjectId(),
        waste_description: 'Mixed municipal waste from residential areas',
        waste_amount: faker.number.float({ min: 100, max: 5000, fractionDigits: 2 }),
        waste_designation: 'Non-hazardous',
        consistency: ['Solid', 'Mixed'],
        type_of_waste: ['Municipal', 'Organic', 'Recyclable'],
        processing_steps: ['Sorting', 'Separation', 'Incineration'],
        min_calorific_value: faker.number.float({ min: 8, max: 10, fractionDigits: 1 }),
        calorific_value: faker.number.float({ min: 10, max: 12, fractionDigits: 1 }),
        biogenic_part: faker.number.float({ min: 60, max: 70, fractionDigits: 1 }),
        plastic_content: faker.number.float({ min: 10, max: 20, fractionDigits: 1 }),
        edge_length: faker.number.float({ min: 50, max: 300, fractionDigits: 0 }),
        water: faker.number.float({ min: 15, max: 25, fractionDigits: 1 }),
        ash: faker.number.float({ min: 10, max: 20, fractionDigits: 1 }),
        fluorine: faker.number.float({ min: 10, max: 50, fractionDigits: 1 }),
        sulfur: faker.number.float({ min: 50, max: 200, fractionDigits: 1 }),
        chlorine: faker.number.float({ min: 100, max: 500, fractionDigits: 1 }),
        flue_gas: faker.number.float({ min: 1000, max: 3000, fractionDigits: 0 }),
        mercury: faker.number.float({ min: 0.1, max: 1.0, fractionDigits: 2 }),
        cadmium: faker.number.float({ min: 0.5, max: 2.0, fractionDigits: 2 }),
        lead: faker.number.float({ min: 5, max: 20, fractionDigits: 1 }),
        copper: faker.number.float({ min: 50, max: 200, fractionDigits: 1 }),
        zinc: faker.number.float({ min: 100, max: 500, fractionDigits: 1 }),
        phosphate: faker.number.float({ min: 10, max: 50, fractionDigits: 1 }),
        comments: faker.lorem.sentence(),
        created_at: new Date()
      },
      {
        contract: contracts[1]._id,
        client: new mongoose.Types.ObjectId(),
        waste_description: 'Plastic packaging waste from industrial sources',
        waste_amount: faker.number.float({ min: 100, max: 2000, fractionDigits: 2 }),
        waste_designation: 'Non-hazardous',
        consistency: ['Solid', 'Plastic'],
        type_of_waste: ['Industrial', 'Packaging', 'Recyclable'],
        processing_steps: ['Sorting', 'Shredding', 'Recycling'],
        min_calorific_value: faker.number.float({ min: 35, max: 38, fractionDigits: 1 }),
        calorific_value: faker.number.float({ min: 38, max: 42, fractionDigits: 1 }),
        biogenic_part: faker.number.float({ min: 0, max: 10, fractionDigits: 1 }),
        plastic_content: faker.number.float({ min: 80, max: 95, fractionDigits: 1 }),
        edge_length: faker.number.float({ min: 20, max: 150, fractionDigits: 0 }),
        water: faker.number.float({ min: 1, max: 5, fractionDigits: 1 }),
        ash: faker.number.float({ min: 2, max: 8, fractionDigits: 1 }),
        fluorine: faker.number.float({ min: 5, max: 30, fractionDigits: 1 }),
        sulfur: faker.number.float({ min: 20, max: 100, fractionDigits: 1 }),
        chlorine: faker.number.float({ min: 500, max: 2000, fractionDigits: 1 }),
        flue_gas: faker.number.float({ min: 2000, max: 5000, fractionDigits: 0 }),
        mercury: faker.number.float({ min: 0.05, max: 0.5, fractionDigits: 2 }),
        cadmium: faker.number.float({ min: 0.2, max: 1.0, fractionDigits: 2 }),
        lead: faker.number.float({ min: 2, max: 10, fractionDigits: 1 }),
        copper: faker.number.float({ min: 20, max: 100, fractionDigits: 1 }),
        zinc: faker.number.float({ min: 50, max: 200, fractionDigits: 1 }),
        phosphate: faker.number.float({ min: 5, max: 20, fractionDigits: 1 }),
        comments: faker.lorem.sentence(),
        created_at: new Date()
      },
    ]);

    console.log('Creating shipment waste compositions...');
    await ShipmentWasteComposition.insertMany([
      {
        shipment: shipments[0]._id,
        facility: facilities[0]._id,
        bunker: bunkers[0]._id,
        client: new mongoose.Types.ObjectId(),
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
        // Material composition - Mixed Municipal Waste
        concrete_stones: faker.number.float({ min: 0, max: 10, fractionDigits: 1 }),
        concrete_stones_comment: faker.lorem.sentence(),
        glass: faker.number.float({ min: 5, max: 15, fractionDigits: 1 }),
        glass_comment: faker.lorem.sentence(),
        paper_moist: faker.number.float({ min: 20, max: 35, fractionDigits: 1 }),
        paper_moist_comment: faker.lorem.sentence(),
        msw_mixed: faker.number.float({ min: 30, max: 45, fractionDigits: 1 }),
        msw_mixed_comment: faker.lorem.sentence(),
        hard_plastics: faker.number.float({ min: 8, max: 18, fractionDigits: 1 }),
        hard_plastics_comment: faker.lorem.sentence(),
        textiles_clothing: faker.number.float({ min: 5, max: 12, fractionDigits: 1 }),
        textiles_clothing_comment: faker.lorem.sentence(),
        aluminium_shavings_comb: faker.number.float({ min: 0.5, max: 3, fractionDigits: 1 }),
        aluminium_shavings_comb_comment: faker.lorem.sentence(),
        iron_fe: faker.number.float({ min: 1, max: 4, fractionDigits: 1 }),
        iron_fe_comment: faker.lorem.sentence(),
        gcp_image_path: faker.image.url(),
        created_at: new Date()
      },
      {
        shipment: shipments[1]._id,
        facility: facilities[1]._id,
        bunker: bunkers[1]._id,
        client: new mongoose.Types.ObjectId(),
        moisture_level: SEVERITY_ENUM.LOW,
        moisture_comment: 'Low moisture content for plastic waste',
        dust_load_level: SEVERITY_ENUM.NONE,
        dust_load_comment: 'No significant dust detected',
        calorific_value_min: 38.0,
        calorific_value_max: 42.0,
        calorific_value_comment: 'High calorific value typical for plastics',
        biogenic_content_percentage: 5.0,
        biogenic_content_comment: 'Very low biogenic content',
        sulfur_dioxide_risk: SEVERITY_ENUM.MEDIUM,
        sulfur_dioxide_comment: 'Medium SO2 risk from plastic additives',
        hydrochloric_acid_risk: SEVERITY_ENUM.HIGH,
        hydrochloric_acid_comment: 'High HCl risk from PVC content',
        mono_charge_detected: true,
        mono_charge_comment: 'Mono charge detected - primarily PET',
        likely_ewc_code: '15 01 02',
        likely_ewc_description: 'Plastic Packaging',
        likely_ewc_comment: 'Confirmed plastic packaging waste',
        // Material composition - Plastic Waste
        hard_plastics: faker.number.float({ min: 35, max: 55, fractionDigits: 1 }),
        hard_plastics_comment: faker.lorem.sentence(),
        lightweight_packaging_lwp: faker.number.float({ min: 20, max: 35, fractionDigits: 1 }),
        lightweight_packaging_lwp_comment: faker.lorem.sentence(),
        composite_packaging: faker.number.float({ min: 10, max: 20, fractionDigits: 1 }),
        composite_packaging_comment: faker.lorem.sentence(),
        pvc_items: faker.number.float({ min: 5, max: 15, fractionDigits: 1 }),
        pvc_items_comment: faker.lorem.sentence(),
        films_dirty_pe_pp: faker.number.float({ min: 3, max: 10, fractionDigits: 1 }),
        films_dirty_pe_pp_comment: faker.lorem.sentence(),
        gcp_image_path: faker.image.url(),
        created_at: new Date()
      },
      {
        shipment: shipments[2]._id,
        facility: facilities[0]._id,
        bunker: bunkers[2]._id,
        client: new mongoose.Types.ObjectId(),
        moisture_level: SEVERITY_ENUM.LOW,
        moisture_comment: 'Very low moisture content',
        dust_load_level: SEVERITY_ENUM.MEDIUM,
        dust_load_comment: 'Moderate dust from metal processing',
        calorific_value_min: 0.5,
        calorific_value_max: 1.0,
        calorific_value_comment: 'Minimal calorific value for metal waste',
        biogenic_content_percentage: 0.0,
        biogenic_content_comment: 'No biogenic content in metal waste',
        sulfur_dioxide_risk: SEVERITY_ENUM.NONE,
        sulfur_dioxide_comment: 'No SO2 emission risk from metal',
        hydrochloric_acid_risk: SEVERITY_ENUM.NONE,
        hydrochloric_acid_comment: 'No HCl emission risk from metal',
        mono_charge_detected: false,
        mono_charge_comment: 'Mixed metal types detected',
        likely_ewc_code: '17 04 05',
        likely_ewc_description: 'Iron and Steel',
        likely_ewc_comment: 'Confirmed metal scrap waste',
        // Material composition - Metal Waste
        iron_fe: faker.number.float({ min: 60, max: 85, fractionDigits: 1 }),
        iron_fe_comment: faker.lorem.sentence(),
        aluminium_shavings_comb: faker.number.float({ min: 10, max: 25, fractionDigits: 1 }),
        aluminium_shavings_comb_comment: faker.lorem.sentence(),
        copper_cu: faker.number.float({ min: 5, max: 12, fractionDigits: 1 }),
        copper_cu_comment: faker.lorem.sentence(),
        vehicle_parts_pipes: faker.number.float({ min: 1, max: 5, fractionDigits: 1 }),
        vehicle_parts_pipes_comment: faker.lorem.sentence(),
        gcp_image_path: faker.image.url(),
        created_at: new Date()
      },
    ]);

    console.log('✅ Database seeded successfully!');
    console.log(`   - ${facilities.length} facilities`);
    console.log(`   - ${shipments.length} shipments`);
    console.log(`   - 2 contaminants`);
    console.log(`   - 3 inspections`);
    console.log(`   - ${wasteCodes.length} waste codes`);
    console.log(`   - ${wasteGenerators.length} waste generators`);
    console.log(`   - ${contracts.length} contracts`);
    console.log(`   - ${bunkers.length} bunkers`);
    console.log(`   - ${wasteProperties.length} waste properties`);
    console.log(`   - 3 shipment waste compositions`);

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
