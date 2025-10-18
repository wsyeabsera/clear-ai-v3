import { ICommand, CommandResult } from '../ICommand';
import { Facility } from '../../models/Facility';

export class UpdateFacilityCommand implements ICommand {
  async execute(params: any): Promise<CommandResult> {
    try {
      if (!params.uid) {
        return {
          success: false,
          error: 'Missing required field: uid',
        };
      }

      const facility = await Facility.findOne({ uid: params.uid });
      
      if (!facility) {
        return {
          success: false,
          error: `Facility with uid '${params.uid}' not found`,
        };
      }

      // Update the facility
      const updatedFacility = await Facility.findOneAndUpdate(
        { uid: params.uid },
        { $set: params },
        { new: true, runValidators: true }
      );

      return {
        success: true,
        data: updatedFacility?.toObject(),
        message: 'Facility updated successfully',
      };
    } catch (error: any) {
      return {
        success: false,
        error: error.message,
      };
    }
  }
}
