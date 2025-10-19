#!/usr/bin/env ts-node

/**
 * Seed script to populate MongoDB with test data for feedback loop and multi-tool testing
 * Creates 2 clients, 10 facilities, and comprehensive related data
 */

import mongoose from 'mongoose';
import { randomUUID } from 'crypto';

// Database connection
const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/clear-ai-test';

// Sample data generators
const clientNames = [
  'WasteCorp Industries',
  'EcoSolutions Ltd'
];

const facilityNames = [
  'North Processing Plant',
  'South Recycling Center',
  'East Waste Facility',
  'West Treatment Plant',
  'Central Sorting Hub',
  'Metro Disposal Site',
  'Green Valley Processing',
  'Industrial Waste Center',
  'Urban Recycling Depot',
  'Coastal Treatment Facility'
];

const cities = [
  'New York', 'Los Angeles', 'Chicago', 'Houston', 'Phoenix',
  'Philadelphia', 'San Antonio', 'San Diego', 'Dallas', 'San Jose'
];

const countries = ['USA', 'Canada', 'Mexico'];

const wasteTypes = [
  'Municipal Solid Waste', 'Industrial Waste', 'Hazardous Waste',
  'Electronic Waste', 'Construction Debris', 'Medical Waste',
  'Food Waste', 'Plastic Waste', 'Metal Scrap', 'Paper Waste'
];

const materials = [
  'Plastic', 'Metal', 'Glass', 'Paper', 'Organic',
  'Electronic', 'Chemical', 'Textile', 'Rubber', 'Wood'
];

const licensePlates = [
  'ABC-123', 'XYZ-789', 'DEF-456', 'GHI-012', 'JKL-345',
  'MNO-678', 'PQR-901', 'STU-234', 'VWX-567', 'YZA-890'
];

// Generate ObjectId-like strings
function generateObjectId(): string {
  return new mongoose.Types.ObjectId().toString();
}

// Generate random date within last year
function randomDate(): Date {
  const now = new Date();
  const oneYearAgo = new Date(now.getTime() - 365 * 24 * 60 * 60 * 1000);
  return new Date(oneYearAgo.getTime() + Math.random() * (now.getTime() - oneYearAgo.getTime()));
}

// Generate random number between min and max
function randomBetween(min: number, max: number): number {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

// Generate random boolean
function randomBoolean(): boolean {
  return Math.random() < 0.5;
}

// Generate random array element
function randomElement<T>(array: T[]): T {
  return array[Math.floor(Math.random() * array.length)];
}

// Generate random array of elements
function randomElements<T>(array: T[], count: number): T[] {
  const shuffled = [...array].sort(() => 0.5 - Math.random());
  return shuffled.slice(0, count);
}

async function seedDatabase() {
  try {
    console.log('🌱 Starting database seeding...');
    
    // Connect to MongoDB
    await mongoose.connect(MONGODB_URI);
    console.log('✅ Connected to MongoDB');

    // Clear existing data
    console.log('🧹 Clearing existing test data...');
    const collections = ['clients', 'facilities', 'shipments', 'contracts', 'wastecodes', 'wastegenerators', 'inspections', 'contaminants', 'wasteproperties', 'shipmentwastecompositions'];
    for (const collection of collections) {
      await mongoose.connection.db!.collection(collection).deleteMany({});
    }

    // Generate clients
    console.log('👥 Creating clients...');
    const clients = [];
    for (let i = 0; i < 2; i++) {
      const client = {
        _id: generateObjectId(),
        name: clientNames[i],
        email: `contact@${clientNames[i].toLowerCase().replace(/\s+/g, '')}.com`,
        phone: `+1-${randomBetween(200, 999)}-${randomBetween(100, 999)}-${randomBetween(1000, 9999)}`,
        address: `${randomBetween(100, 9999)} Main St`,
        city: randomElement(cities),
        country: randomElement(countries),
        created_at: new Date(),
        updated_at: new Date()
      };
      clients.push(client);
    }
    await mongoose.connection.db!.collection('clients').insertMany(clients as any);
    console.log(`✅ Created ${clients.length} clients`);

    // Generate facilities
    console.log('🏭 Creating facilities...');
    const facilities = [];
    for (let i = 0; i < 10; i++) {
      const facility = {
        _id: generateObjectId(),
        name: facilityNames[i],
        client_id: randomElement(clients)._id,
        address: `${randomBetween(100, 9999)} ${randomElement(['Industrial', 'Commercial', 'Processing', 'Waste'])} Ave`,
        city: randomElement(cities),
        country: randomElement(countries),
        email: `facility@${facilityNames[i].toLowerCase().replace(/\s+/g, '')}.com`,
        phone: `+1-${randomBetween(200, 999)}-${randomBetween(100, 999)}-${randomBetween(1000, 9999)}`,
        created_at: new Date(),
        updated_at: new Date()
      };
      facilities.push(facility);
    }
    await mongoose.connection.db!.collection('facilities').insertMany(facilities as any);
    console.log(`✅ Created ${facilities.length} facilities`);

    // Generate contracts
    console.log('📋 Creating contracts...');
    const contracts = [];
    for (let i = 0; i < 30; i++) {
      const contract = {
        _id: generateObjectId(),
        client_id: (randomElement(clients) as any)._id,
        facility_id: (randomElement(facilities) as any)._id,
        contract_number: `CON-${randomBetween(10000, 99999)}`,
        start_date: randomDate(),
        end_date: new Date(randomDate().getTime() + randomBetween(30, 365) * 24 * 60 * 60 * 1000),
        status: randomElement(['active', 'inactive', 'pending', 'expired']),
        waste_types: randomElements(wasteTypes, randomBetween(1, 3)),
        created_at: new Date(),
        updated_at: new Date()
      };
      contracts.push(contract);
    }
    await mongoose.connection.db!.collection('contracts').insertMany(contracts as any);
    console.log(`✅ Created ${contracts.length} contracts`);

    // Generate waste codes
    console.log('♻️ Creating waste codes...');
    const wasteCodes = [];
    for (let i = 0; i < 50; i++) {
      const wasteCode = {
        _id: generateObjectId(),
        code: `WC-${randomBetween(1000, 9999)}`,
        description: randomElement(wasteTypes),
        category: randomElement(['Hazardous', 'Non-Hazardous', 'Special', 'Recyclable']),
        disposal_method: randomElement(['Landfill', 'Recycling', 'Incineration', 'Composting', 'Treatment']),
        created_at: new Date(),
        updated_at: new Date()
      };
      wasteCodes.push(wasteCode);
    }
    await mongoose.connection.db!.collection('wastecodes').insertMany(wasteCodes as any);
    console.log(`✅ Created ${wasteCodes.length} waste codes`);

    // Generate waste generators
    console.log('🏢 Creating waste generators...');
    const wasteGenerators = [];
    for (let i = 0; i < 40; i++) {
      const generator = {
        _id: generateObjectId(),
        client_id: (randomElement(clients) as any)._id,
        facility_id: (randomElement(facilities) as any)._id,
        name: `Generator ${i + 1}`,
        type: randomElement(['Industrial', 'Commercial', 'Residential', 'Institutional']),
        contact_person: `Contact Person ${i + 1}`,
        email: `generator${i + 1}@example.com`,
        phone: `+1-${randomBetween(200, 999)}-${randomBetween(100, 999)}-${randomBetween(1000, 9999)}`,
        address: `${randomBetween(100, 9999)} Generator St`,
        city: randomElement(cities),
        created_at: new Date(),
        updated_at: new Date()
      };
      wasteGenerators.push(generator);
    }
    await mongoose.connection.db!.collection('wastegenerators').insertMany(wasteGenerators as any);
    console.log(`✅ Created ${wasteGenerators.length} waste generators`);

    // Generate shipments
    console.log('🚛 Creating shipments...');
    const shipments = [];
    for (let i = 0; i < 100; i++) {
      const entryTime = randomDate();
      const exitTime = new Date(entryTime.getTime() + randomBetween(30, 480) * 60 * 1000); // 30 min to 8 hours
      
      const shipment = {
        _id: generateObjectId(),
        client_id: (randomElement(clients) as any)._id,
        facility_id: (randomElement(facilities) as any)._id,
        license_plate: randomElement(licensePlates),
        entry_weight: randomBetween(1000, 50000), // kg
        exit_weight: randomBetween(800, 45000), // kg
        entry_timestamp: entryTime,
        exit_timestamp: exitTime,
        gate_number: randomBetween(1, 10),
        notes: randomBoolean() ? `Shipment notes ${i + 1}` : null,
        status: randomElement(['completed', 'in_progress', 'pending', 'cancelled']),
        created_at: new Date(),
        updated_at: new Date()
      };
      shipments.push(shipment);
    }
    await mongoose.connection.db!.collection('shipments').insertMany(shipments as any);
    console.log(`✅ Created ${shipments.length} shipments`);

    // Generate inspections
    console.log('🔍 Creating inspections...');
    const inspections = [];
    for (let i = 0; i < 80; i++) {
      const inspection = {
        _id: generateObjectId(),
        client_id: (randomElement(clients) as any)._id,
        facility_id: (randomElement(facilities) as any)._id,
        shipment_id: (randomElement(shipments) as any)._id,
        inspector_name: `Inspector ${i + 1}`,
        inspection_date: randomDate(),
        inspection_type: randomElement(['Routine', 'Compliance', 'Safety', 'Quality']),
        status: randomElement(['passed', 'failed', 'pending', 'in_progress']),
        findings: randomBoolean() ? `Inspection findings ${i + 1}` : null,
        recommendations: randomBoolean() ? `Recommendations ${i + 1}` : null,
        created_at: new Date(),
        updated_at: new Date()
      };
      inspections.push(inspection);
    }
    await mongoose.connection.db!.collection('inspections').insertMany(inspections as any);
    console.log(`✅ Created ${inspections.length} inspections`);

    // Generate contaminants
    console.log('⚠️ Creating contaminants...');
    const contaminants = [];
    for (let i = 0; i < 60; i++) {
      const contaminant = {
        _id: generateObjectId(),
        client_id: (randomElement(clients) as any)._id,
        facility_id: (randomElement(facilities) as any)._id,
        shipment_id: (randomElement(shipments) as any)._id,
        material: randomElement(materials),
        estimated_size: randomBetween(1, 1000), // cm³
        notes: randomBoolean() ? `Contaminant notes ${i + 1}` : null,
        is_verified: randomBoolean(),
        created_at: new Date(),
        updated_at: new Date()
      };
      contaminants.push(contaminant);
    }
    await mongoose.connection.db!.collection('contaminants').insertMany(contaminants as any);
    console.log(`✅ Created ${contaminants.length} contaminants`);

    // Generate waste properties
    console.log('📊 Creating waste properties...');
    const wasteProperties = [];
    for (let i = 0; i < 70; i++) {
      const wasteProperty = {
        _id: generateObjectId(),
        client_id: randomElement(clients)._id,
        contract_id: (randomElement(contracts) as any)._id,
        waste_description: `Waste description ${i + 1}`,
        waste_amount: randomBetween(100, 10000), // tons
        waste_designation: randomElement(['Hazardous', 'Non-Hazardous', 'Special']),
        consistency: randomElements(['Solid', 'Liquid', 'Sludge', 'Gas'], randomBetween(1, 2)),
        type_of_waste: randomElements(wasteTypes, randomBetween(1, 3)),
        processing_steps: randomElements(['Sorting', 'Shredding', 'Treatment', 'Disposal'], randomBetween(1, 3)),
        min_calorific_value: randomBetween(5, 25), // MJ/kg
        calorific_value: randomBetween(10, 30), // MJ/kg
        biogenic_part: randomBetween(0, 100), // %
        plastic_content: randomBetween(0, 50), // %
        edge_length: randomBetween(10, 500), // mm
        water: randomBetween(0, 50), // %
        ash: randomBetween(0, 30), // %
        fluorine: randomBetween(0, 1000), // ppm
        sulfur: randomBetween(0, 5000), // ppm
        chlorine: randomBetween(0, 10000), // ppm
        flue_gas: randomBetween(0, 100), // %
        created_at: new Date(),
        updated_at: new Date()
      };
      wasteProperties.push(wasteProperty);
    }
    await mongoose.connection.db!.collection('wasteproperties').insertMany(wasteProperties as any);
    console.log(`✅ Created ${wasteProperties.length} waste properties`);

    // Generate shipment waste compositions
    console.log('🔗 Creating shipment waste compositions...');
    const shipmentWasteCompositions = [];
    for (let i = 0; i < 50; i++) {
      const composition = {
        _id: generateObjectId(),
        shipment_id: (randomElement(shipments) as any)._id,
        waste_code_id: (randomElement(wasteCodes) as any)._id,
        percentage: randomBetween(1, 100),
        weight: randomBetween(100, 5000), // kg
        notes: randomBoolean() ? `Composition notes ${i + 1}` : null,
        created_at: new Date(),
        updated_at: new Date()
      };
      shipmentWasteCompositions.push(composition);
    }
    await mongoose.connection.db!.collection('shipmentwastecompositions').insertMany(shipmentWasteCompositions as any);
    console.log(`✅ Created ${shipmentWasteCompositions.length} shipment waste compositions`);

    console.log('🎉 Database seeding completed successfully!');
    console.log('\n📊 Summary:');
    console.log(`- Clients: ${clients.length}`);
    console.log(`- Facilities: ${facilities.length}`);
    console.log(`- Contracts: ${contracts.length}`);
    console.log(`- Waste Codes: ${wasteCodes.length}`);
    console.log(`- Waste Generators: ${wasteGenerators.length}`);
    console.log(`- Shipments: ${shipments.length}`);
    console.log(`- Inspections: ${inspections.length}`);
    console.log(`- Contaminants: ${contaminants.length}`);
    console.log(`- Waste Properties: ${wasteProperties.length}`);
    console.log(`- Shipment Waste Compositions: ${shipmentWasteCompositions.length}`);

  } catch (error) {
    console.error('❌ Error seeding database:', error);
    process.exit(1);
  } finally {
    await mongoose.disconnect();
    console.log('👋 Disconnected from MongoDB');
  }
}

// Run the seed script
if (require.main === module) {
  seedDatabase();
}

export default seedDatabase;
