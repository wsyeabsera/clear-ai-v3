import { ICommand, CommandResult } from '../ICommand';
import { Bunker } from '../../models/Bunker';
import { Facility } from '../../models/Facility';
import mongoose from 'mongoose';

export class CreateBunkerCommand implements ICommand {
  async execute(params: any): Promise<CommandResult> {
    try {
      // Validate required fields
      if (!params.name || !params.facility_id) {
        return {
          success: false,
          error: 'Missing required fields: name, facility_id'
        };
      }

      // Validate facility exists
      if (!mongoose.Types.ObjectId.isValid(params.facility_id)) {
        return {
          success: false,
          error: 'Invalid facility_id format'
        };
      }
      const facility = await Facility.findById(params.facility_id);
      if (!facility) {
        return {
          success: false,
          error: `Facility with id '${params.facility_id}' not found`
        };
      }

      // Create bunker data
      const bunkerData = {
        name: params.name,
        facility: facility._id,
        capacity: params.capacity,
        current_load: params.current_load || 0,
        waste_type: params.waste_type,
        status: params.status || 'active',
        has_crane_arm: params.has_crane_arm,
        crane_arm_model_version: params.crane_arm_model_version,
        gate_number: params.gate_number,
        image_type: params.image_type,
        gcp_image_path: params.gcp_image_path
      };

      const bunker = new Bunker(bunkerData);
      const savedBunker = await bunker.save();

      return {
        success: true,
        data: savedBunker.toObject(),
        message: 'Bunker created successfully'
      };
    } catch (error: any) {
      return {
        success: false,
        error: error.message
      };
    }
  }
}