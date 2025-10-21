#!/usr/bin/env ts-node

/**
 * Database Data Assessment Script
 * 
 * This script calls all MCP tools to discover actual data patterns
 * and relationships in the database for creating intelligent test queries.
 */

import fetch from 'node-fetch';

// GraphQL endpoint
const GRAPHQL_ENDPOINT = 'http://localhost:4000/graphql';

interface DataAssessment {
  facilities: any[];
  shipments: any[];
  inspections: any[];
  contaminants: any[];
  contracts: any[];
  wasteGenerators: any[];
  wasteCodes: any[];
  relationships: {
    facilitiesWithShipments: string[];
    shipmentsWithInspections: string[];
    shipmentsWithContaminants: string[];
    facilitiesWithContracts: string[];
    clientsWithGenerators: string[];
    contractsWithWasteCodes: string[];
  };
  patterns: {
    dateRanges: {
      shipments: { earliest: string; latest: string };
      inspections: { earliest: string; latest: string };
      contaminants: { earliest: string; latest: string };
      contracts: { earliest: string; latest: string };
    };
    geographicDistribution: {
      cities: string[];
      countries: string[];
    };
    tonnageRanges: {
      min: number;
      max: number;
      average: number;
    };
    contaminantTypes: string[];
    inspectionRates: {
      accepted: number;
      rejected: number;
      total: number;
    };
  };
}

class DatabaseAssessor {
  private assessment: DataAssessment = {
    facilities: [],
    shipments: [],
    inspections: [],
    contaminants: [],
    contracts: [],
    wasteGenerators: [],
    wasteCodes: [],
    relationships: {
      facilitiesWithShipments: [],
      shipmentsWithInspections: [],
      shipmentsWithContaminants: [],
      facilitiesWithContracts: [],
      clientsWithGenerators: [],
      contractsWithWasteCodes: []
    },
    patterns: {
      dateRanges: {
        shipments: { earliest: '', latest: '' },
        inspections: { earliest: '', latest: '' },
        contaminants: { earliest: '', latest: '' },
        contracts: { earliest: '', latest: '' }
      },
      geographicDistribution: {
        cities: [],
        countries: []
      },
      tonnageRanges: {
        min: 0,
        max: 0,
        average: 0
      },
      contaminantTypes: [],
      inspectionRates: {
        accepted: 0,
        rejected: 0,
        total: 0
      }
    }
  };

  async executeGraphQL(query: string, variables: any = {}): Promise<any> {
    const response = await fetch(GRAPHQL_ENDPOINT, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        query,
        variables,
      }),
    });

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    const data = await response.json();
    
    if (data.errors) {
      throw new Error(`GraphQL errors: ${JSON.stringify(data.errors)}`);
    }

    return data.data;
  }

  async executeTool(toolName: string, params: any = {}): Promise<any> {
    const mutation = `
      mutation ExecuteTool($name: String!, $params: JSON!) {
        executeTool(name: $name, params: $params) {
          success
          data
          error
          message
          meta
        }
      }
    `;

    const result = await this.executeGraphQL(mutation, {
      name: toolName,
      params
    });

    if (!result.executeTool.success) {
      throw new Error(`Tool execution failed: ${result.executeTool.error}`);
    }

    return result.executeTool.data;
  }

  async assessFacilities(): Promise<void> {
    console.log('🏢 Assessing facilities...');
    
    try {
      const facilities = await this.executeTool('facilities_list', {
        page: 1,
        limit: 100
      });
      
      this.assessment.facilities = facilities || [];
      
      console.log(`   Found ${this.assessment.facilities.length} facilities`);
      
      // Extract geographic distribution
      const cities = [...new Set(this.assessment.facilities.map(f => f.city).filter(Boolean))];
      const countries = [...new Set(this.assessment.facilities.map(f => f.country).filter(Boolean))];
      
      this.assessment.patterns.geographicDistribution.cities = cities;
      this.assessment.patterns.geographicDistribution.countries = countries;
      
      console.log(`   Cities: ${cities.join(', ')}`);
      console.log(`   Countries: ${countries.join(', ')}`);
      
    } catch (error) {
      console.warn(`   ⚠️  Failed to assess facilities: ${error}`);
    }
  }

  async assessShipments(): Promise<void> {
    console.log('📦 Assessing shipments...');
    
    try {
      const shipments = await this.executeTool('shipments_list', {
        page: 1,
        limit: 100
      });
      
      this.assessment.shipments = shipments || [];
      
      console.log(`   Found ${this.assessment.shipments.length} shipments`);
      
      // Extract date ranges
      const dates = this.assessment.shipments
        .map(s => s.entry_timestamp || s.exit_timestamp)
        .filter(Boolean)
        .sort();
      
      if (dates.length > 0) {
        this.assessment.patterns.dateRanges.shipments.earliest = dates[0];
        this.assessment.patterns.dateRanges.shipments.latest = dates[dates.length - 1];
      }
      
      // Extract tonnage ranges
      const weights = this.assessment.shipments
        .map(s => s.entry_weight || s.exit_weight)
        .filter(w => typeof w === 'number' && w > 0);
      
      if (weights.length > 0) {
        this.assessment.patterns.tonnageRanges.min = Math.min(...weights);
        this.assessment.patterns.tonnageRanges.max = Math.max(...weights);
        this.assessment.patterns.tonnageRanges.average = weights.reduce((a, b) => a + b, 0) / weights.length;
      }
      
      console.log(`   Date range: ${this.assessment.patterns.dateRanges.shipments.earliest} to ${this.assessment.patterns.dateRanges.shipments.latest}`);
      console.log(`   Weight range: ${this.assessment.patterns.tonnageRanges.min} - ${this.assessment.patterns.tonnageRanges.max} kg`);
      
    } catch (error) {
      console.warn(`   ⚠️  Failed to assess shipments: ${error}`);
    }
  }

  async assessInspections(): Promise<void> {
    console.log('🔍 Assessing inspections...');
    
    try {
      const inspections = await this.executeTool('inspections_list', {
        page: 1,
        limit: 100
      });
      
      this.assessment.inspections = inspections || [];
      
      console.log(`   Found ${this.assessment.inspections.length} inspections`);
      
      // Extract date ranges
      const dates = this.assessment.inspections
        .map(i => i.created_at || i.updated_at)
        .filter(Boolean)
        .sort();
      
      if (dates.length > 0) {
        this.assessment.patterns.dateRanges.inspections.earliest = dates[0];
        this.assessment.patterns.dateRanges.inspections.latest = dates[dates.length - 1];
      }
      
      // Calculate acceptance rates
      const accepted = this.assessment.inspections.filter(i => i.delivery_accepted).length;
      const rejected = this.assessment.inspections.filter(i => i.delivery_rejected).length;
      const total = this.assessment.inspections.length;
      
      this.assessment.patterns.inspectionRates = {
        accepted,
        rejected,
        total
      };
      
      console.log(`   Date range: ${this.assessment.patterns.dateRanges.inspections.earliest} to ${this.assessment.patterns.dateRanges.inspections.latest}`);
      console.log(`   Acceptance rate: ${accepted}/${total} (${((accepted/total)*100).toFixed(1)}%)`);
      
    } catch (error) {
      console.warn(`   ⚠️  Failed to assess inspections: ${error}`);
    }
  }

  async assessContaminants(): Promise<void> {
    console.log('☢️  Assessing contaminants...');
    
    try {
      const contaminants = await this.executeTool('contaminants_list', {
        page: 1,
        limit: 100
      });
      
      this.assessment.contaminants = contaminants || [];
      
      console.log(`   Found ${this.assessment.contaminants.length} contaminants`);
      
      // Extract date ranges
      const dates = this.assessment.contaminants
        .map(c => c.created_at || c.updated_at)
        .filter(Boolean)
        .sort();
      
      if (dates.length > 0) {
        this.assessment.patterns.dateRanges.contaminants.earliest = dates[0];
        this.assessment.patterns.dateRanges.contaminants.latest = dates[dates.length - 1];
      }
      
      // Extract contaminant types
      const materials = [...new Set(this.assessment.contaminants.map(c => c.material).filter(Boolean))];
      this.assessment.patterns.contaminantTypes = materials;
      
      console.log(`   Date range: ${this.assessment.patterns.dateRanges.contaminants.earliest} to ${this.assessment.patterns.dateRanges.contaminants.latest}`);
      console.log(`   Material types: ${materials.join(', ')}`);
      
    } catch (error) {
      console.warn(`   ⚠️  Failed to assess contaminants: ${error}`);
    }
  }

  async assessContracts(): Promise<void> {
    console.log('📋 Assessing contracts...');
    
    try {
      const contracts = await this.executeTool('contracts_list', {
        page: 1,
        limit: 100
      });
      
      this.assessment.contracts = Array.isArray(contracts) ? contracts : [];
      
      console.log(`   Found ${this.assessment.contracts.length} contracts`);
      
      // Extract date ranges
      const startDates = this.assessment.contracts
        .map(c => c.start_date)
        .filter(Boolean)
        .sort();
      
      const endDates = this.assessment.contracts
        .map(c => c.end_date)
        .filter(Boolean)
        .sort();
      
      if (startDates.length > 0) {
        this.assessment.patterns.dateRanges.contracts.earliest = startDates[0];
      }
      if (endDates.length > 0) {
        this.assessment.patterns.dateRanges.contracts.latest = endDates[endDates.length - 1];
      }
      
      console.log(`   Date range: ${this.assessment.patterns.dateRanges.contracts.earliest} to ${this.assessment.patterns.dateRanges.contracts.latest}`);
      
    } catch (error) {
      console.warn(`   ⚠️  Failed to assess contracts: ${error}`);
    }
  }

  async assessWasteGenerators(): Promise<void> {
    console.log('🏭 Assessing waste generators...');
    
    try {
      const generators = await this.executeTool('waste_generators_list', {
        page: 1,
        limit: 100
      });
      
      this.assessment.wasteGenerators = Array.isArray(generators) ? generators : [];
      
      console.log(`   Found ${this.assessment.wasteGenerators.length} waste generators`);
      
      const regions = [...new Set(this.assessment.wasteGenerators.map(g => g.region).filter(Boolean))];
      console.log(`   Regions: ${regions.join(', ')}`);
      
    } catch (error) {
      console.warn(`   ⚠️  Failed to assess waste generators: ${error}`);
    }
  }

  async assessWasteCodes(): Promise<void> {
    console.log('🏷️  Assessing waste codes...');
    
    try {
      const codes = await this.executeTool('waste_codes_list', {
        page: 1,
        limit: 100
      });
      
      this.assessment.wasteCodes = Array.isArray(codes) ? codes : [];
      
      console.log(`   Found ${this.assessment.wasteCodes.length} waste codes`);
      
      const codeNames = this.assessment.wasteCodes.map(c => c.name).filter(Boolean);
      console.log(`   Sample codes: ${codeNames.slice(0, 5).join(', ')}${codeNames.length > 5 ? '...' : ''}`);
      
    } catch (error) {
      console.warn(`   ⚠️  Failed to assess waste codes: ${error}`);
    }
  }

  analyzeRelationships(): void {
    console.log('🔗 Analyzing relationships...');
    
    // Map facilities with shipments
    const facilityIds = new Set(this.assessment.shipments.map(s => s.facility_id).filter(Boolean));
    this.assessment.relationships.facilitiesWithShipments = Array.from(facilityIds);
    
    // Map shipments with inspections
    const shipmentIds = new Set(this.assessment.inspections.map(i => i.shipment_id).filter(Boolean));
    this.assessment.relationships.shipmentsWithInspections = Array.from(shipmentIds);
    
    // Map shipments with contaminants
    const contaminantShipmentIds = new Set(this.assessment.contaminants.map(c => c.shipment_id).filter(Boolean));
    this.assessment.relationships.shipmentsWithContaminants = Array.from(contaminantShipmentIds);
    
    // Map facilities with contracts
    const contractFacilityIds = new Set(this.assessment.contracts.map(c => c.facility_id).filter(Boolean));
    this.assessment.relationships.facilitiesWithContracts = Array.from(contractFacilityIds);
    
    // Map clients with generators
    const clientIds = new Set(this.assessment.wasteGenerators.map(g => g.client_id).filter(Boolean));
    this.assessment.relationships.clientsWithGenerators = Array.from(clientIds);
    
    // Map contracts with waste codes
    const wasteCodeIds = new Set(this.assessment.contracts.map(c => c.external_waste_code_id).filter(Boolean));
    this.assessment.relationships.contractsWithWasteCodes = Array.from(wasteCodeIds);
    
    console.log(`   Facilities with shipments: ${this.assessment.relationships.facilitiesWithShipments.length}`);
    console.log(`   Shipments with inspections: ${this.assessment.relationships.shipmentsWithInspections.length}`);
    console.log(`   Shipments with contaminants: ${this.assessment.relationships.shipmentsWithContaminants.length}`);
    console.log(`   Facilities with contracts: ${this.assessment.relationships.facilitiesWithContracts.length}`);
    console.log(`   Clients with generators: ${this.assessment.relationships.clientsWithGenerators.length}`);
    console.log(`   Contracts with waste codes: ${this.assessment.relationships.contractsWithWasteCodes.length}`);
  }

  async runAssessment(): Promise<DataAssessment> {
    console.log('🔍 Starting Database Data Assessment');
    console.log('='.repeat(50));
    
    await this.assessFacilities();
    await this.assessShipments();
    await this.assessInspections();
    await this.assessContaminants();
    await this.assessContracts();
    await this.assessWasteGenerators();
    await this.assessWasteCodes();
    
    this.analyzeRelationships();
    
    console.log('\n' + '='.repeat(50));
    console.log('✅ Assessment Complete');
    
    return this.assessment;
  }

  printSummary(): void {
    console.log('\n📊 DATA ASSESSMENT SUMMARY');
    console.log('='.repeat(50));
    
    console.log(`\n📈 DATA VOLUMES:`);
    console.log(`   Facilities: ${this.assessment.facilities.length}`);
    console.log(`   Shipments: ${this.assessment.shipments.length}`);
    console.log(`   Inspections: ${this.assessment.inspections.length}`);
    console.log(`   Contaminants: ${this.assessment.contaminants.length}`);
    console.log(`   Contracts: ${this.assessment.contracts.length}`);
    console.log(`   Waste Generators: ${this.assessment.wasteGenerators.length}`);
    console.log(`   Waste Codes: ${this.assessment.wasteCodes.length}`);
    
    console.log(`\n🌍 GEOGRAPHIC DISTRIBUTION:`);
    console.log(`   Cities: ${this.assessment.patterns.geographicDistribution.cities.join(', ')}`);
    console.log(`   Countries: ${this.assessment.patterns.geographicDistribution.countries.join(', ')}`);
    
    console.log(`\n📅 DATE RANGES:`);
    console.log(`   Shipments: ${this.assessment.patterns.dateRanges.shipments.earliest} to ${this.assessment.patterns.dateRanges.shipments.latest}`);
    console.log(`   Inspections: ${this.assessment.patterns.dateRanges.inspections.earliest} to ${this.assessment.patterns.dateRanges.inspections.latest}`);
    console.log(`   Contaminants: ${this.assessment.patterns.dateRanges.contaminants.earliest} to ${this.assessment.patterns.dateRanges.contaminants.latest}`);
    console.log(`   Contracts: ${this.assessment.patterns.dateRanges.contracts.earliest} to ${this.assessment.patterns.dateRanges.contracts.latest}`);
    
    console.log(`\n⚖️  TONNAGE RANGES:`);
    console.log(`   Min: ${this.assessment.patterns.tonnageRanges.min} kg`);
    console.log(`   Max: ${this.assessment.patterns.tonnageRanges.max} kg`);
    console.log(`   Average: ${this.assessment.patterns.tonnageRanges.average.toFixed(2)} kg`);
    
    console.log(`\n🔍 INSPECTION RATES:`);
    console.log(`   Accepted: ${this.assessment.patterns.inspectionRates.accepted}`);
    console.log(`   Rejected: ${this.assessment.patterns.inspectionRates.rejected}`);
    console.log(`   Total: ${this.assessment.patterns.inspectionRates.total}`);
    
    console.log(`\n☢️  CONTAMINANT TYPES:`);
    console.log(`   ${this.assessment.patterns.contaminantTypes.join(', ')}`);
    
    console.log(`\n🔗 RELATIONSHIPS:`);
    console.log(`   Facilities with shipments: ${this.assessment.relationships.facilitiesWithShipments.length}`);
    console.log(`   Shipments with inspections: ${this.assessment.relationships.shipmentsWithInspections.length}`);
    console.log(`   Shipments with contaminants: ${this.assessment.relationships.shipmentsWithContaminants.length}`);
    console.log(`   Facilities with contracts: ${this.assessment.relationships.facilitiesWithContracts.length}`);
    console.log(`   Clients with generators: ${this.assessment.relationships.clientsWithGenerators.length}`);
    console.log(`   Contracts with waste codes: ${this.assessment.relationships.contractsWithWasteCodes.length}`);
  }
}

// Main execution
async function main() {
  const assessor = new DatabaseAssessor();
  
  try {
    const assessment = await assessor.runAssessment();
    assessor.printSummary();
    
    // Save assessment to file
    const fs = require('fs');
    const assessmentPath = '/Users/yab/Projects/clear-ai-v3/DATABASE_ASSESSMENT.json';
    fs.writeFileSync(assessmentPath, JSON.stringify(assessment, null, 2));
    console.log(`\n💾 Assessment saved to: ${assessmentPath}`);
    
  } catch (error) {
    console.error('❌ Assessment failed:', error);
    process.exit(1);
  }
}

// Run if called directly
if (require.main === module) {
  main().catch(console.error);
}

export { DatabaseAssessor, DataAssessment };
