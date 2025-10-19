import { ICommand, CommandResult } from '../ICommand';
import { Facility } from '../../models/Facility';
import mongoose from 'mongoose';

export class CreateFacilityCommand implements ICommand {
  async execute(params: any): Promise<CommandResult> {
    try {
      // Validate required fields
      if (!params.name || !params.client_id) {
        return {
          success: false,
          error: 'Missing required fields: name, client_id',
        };
      }

      // Create facility data
      const facilityData = {
        name: params.name,
        address: params.address,
        city: params.city,
        country: params.country,
        region: params.region,
        postal_code: params.postal_code,
        zip_code: params.zip_code,
        street_address: params.street_address,
        email: params.email,
        phone: params.phone,
        telephone: params.telephone,
        language: params.language,
        sort_code: params.sort_code,
        door_count: params.door_count,
        number_of_doors: params.number_of_doors,
        grid_width: params.grid_width,
        grid_depth: params.grid_depth,
        disposal_number: params.disposal_number,
        address_notes: params.address_notes,
        notes: params.notes,
        external_reference_id: params.external_reference_id,
        photo_bunkers_processing_time: params.photo_bunkers_processing_time,
        photo_doors_processing_time: params.photo_doors_processing_time,
        photo_loads_processing_time: params.photo_loads_processing_time,
        rules_explosive_risk_check: params.rules_explosive_risk_check,
        rules_item_size_limit: params.rules_item_size_limit,
        rules_singular_delivery_check: params.rules_singular_delivery_check,
        rules_waste_item_rule_check: params.rules_waste_item_rule_check,
        rules_waste_item_size_check: params.rules_waste_item_size_check,
        client: new mongoose.Types.ObjectId(params.client_id),
      };

      const facility = new Facility(facilityData);
      const savedFacility = await facility.save();

      return {
        success: true,
        data: savedFacility.toObject(),
        message: 'Facility created successfully',
      };
    } catch (error: any) {
      return {
        success: false,
        error: error.message,
      };
    }
  }
}
