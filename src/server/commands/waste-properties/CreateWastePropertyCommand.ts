import { ICommand } from '../ICommand';
import { WasteProperty } from '../../models/WasteProperty';
import { Contract } from '../../models/Contract';

export class CreateWastePropertyCommand implements ICommand {
  async execute(params: any): Promise<any> {
    try {
      const {
        uid,
        client_uid,
        contract_uid,
        // Waste details
        waste_description,
        waste_amount,
        waste_designation,
        // Properties (arrays)
        consistency,
        type_of_waste,
        processing_steps,
        // Calorific properties
        min_calorific_value,
        calorific_value,
        biogenic_part,
        plastic_content,
        edge_length,
        // Chemical composition
        water,
        ash,
        fluorine,
        sulfur,
        chlorine,
        flue_gas,
        // Heavy metals
        mercury,
        cadmium,
        lead,
        copper,
        zinc,
        phosphate,
        // Other
        comments
      } = params;

      // Validate required fields
      if (!uid || !client_uid || !contract_uid) {
        throw new Error('Missing required fields: uid, client_uid, contract_uid');
      }

      // Check if waste property already exists
      const existingWasteProperty = await WasteProperty.findOne({ uid });
      if (existingWasteProperty) {
        throw new Error(`Waste property with UID ${uid} already exists`);
      }

      // Find contract by UID
      const contract = await Contract.findOne({ uid: contract_uid });
      if (!contract) {
        throw new Error(`Contract with UID ${contract_uid} not found`);
      }

      // Create new waste property
      const wastePropertyData: any = {
        uid,
        client_uid,
        contract_uid,
        contract: contract._id,
        created_at: new Date(),
        created_by_uid: client_uid
      };

      // Add optional fields if provided
      if (waste_description) wastePropertyData.waste_description = waste_description;
      if (waste_amount !== undefined) wastePropertyData.waste_amount = waste_amount;
      if (waste_designation) wastePropertyData.waste_designation = waste_designation;
      // Properties (arrays)
      if (consistency) wastePropertyData.consistency = consistency;
      if (type_of_waste) wastePropertyData.type_of_waste = type_of_waste;
      if (processing_steps) wastePropertyData.processing_steps = processing_steps;
      // Calorific properties
      if (min_calorific_value !== undefined) wastePropertyData.min_calorific_value = min_calorific_value;
      if (calorific_value !== undefined) wastePropertyData.calorific_value = calorific_value;
      if (biogenic_part !== undefined) wastePropertyData.biogenic_part = biogenic_part;
      if (plastic_content !== undefined) wastePropertyData.plastic_content = plastic_content;
      if (edge_length !== undefined) wastePropertyData.edge_length = edge_length;
      // Chemical composition
      if (water !== undefined) wastePropertyData.water = water;
      if (ash !== undefined) wastePropertyData.ash = ash;
      if (fluorine !== undefined) wastePropertyData.fluorine = fluorine;
      if (sulfur !== undefined) wastePropertyData.sulfur = sulfur;
      if (chlorine !== undefined) wastePropertyData.chlorine = chlorine;
      if (flue_gas !== undefined) wastePropertyData.flue_gas = flue_gas;
      // Heavy metals
      if (mercury !== undefined) wastePropertyData.mercury = mercury;
      if (cadmium !== undefined) wastePropertyData.cadmium = cadmium;
      if (lead !== undefined) wastePropertyData.lead = lead;
      if (copper !== undefined) wastePropertyData.copper = copper;
      if (zinc !== undefined) wastePropertyData.zinc = zinc;
      if (phosphate !== undefined) wastePropertyData.phosphate = phosphate;
      // Other
      if (comments) wastePropertyData.comments = comments;

      const wasteProperty = new WasteProperty(wastePropertyData);
      const savedWasteProperty = await wasteProperty.save();

      return {
        success: true,
        data: savedWasteProperty.toObject(),
        message: 'Waste property created successfully'
      };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error occurred',
        message: 'Failed to create waste property'
      };
    }
  }
}

