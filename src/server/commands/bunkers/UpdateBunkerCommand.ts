import { ICommand, CommandResult } from '../ICommand';
import { Bunker } from '../../models/Bunker';
import { Facility } from '../../models/Facility';
import mongoose from 'mongoose';

export class UpdateBunkerCommand implements ICommand {
  async execute(params: any): Promise<CommandResult> {
    try {
      if (!params.id) {
        return {
          success: false,
          error: 'Missing required field: id'
        };
      }

      // Validate id is a valid ObjectId
      if (!mongoose.Types.ObjectId.isValid(params.id)) {
        return {
          success: false,
          error: 'Invalid id format'
        };
      }

      const bunker = await Bunker.findById(params.id);
      
      if (!bunker) {
        return {
          success: false,
          error: `Bunker with id '${params.id}' not found`
        };
      }

      // Handle facility update if facility_id is provided
      if (params.facility_id) {
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
        params.facility = facility._id;
        delete params.facility_id;
      }

      // Update the bunker
      const updatedBunker = await Bunker.findByIdAndUpdate(
        params.id,
        { $set: params },
        { new: true, runValidators: true }
      ).populate('facility');

      return {
        success: true,
        data: updatedBunker!.toObject(),
        message: 'Bunker updated successfully'
      };
    } catch (error: any) {
      return {
        success: false,
        error: error.message
      };
    }
  }
}
