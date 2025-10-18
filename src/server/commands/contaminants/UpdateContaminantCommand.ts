import { ICommand, CommandResult } from '../ICommand';
import { Contaminant } from '../../models/Contaminant';

export class UpdateContaminantCommand implements ICommand {
  async execute(params: any): Promise<CommandResult> {
    try {
      if (!params.uid) {
        return {
          success: false,
          error: 'Missing required field: uid',
        };
      }

      const contaminant = await Contaminant.findOne({ uid: params.uid });
      
      if (!contaminant) {
        return {
          success: false,
          error: `Contaminant with uid '${params.uid}' not found`,
        };
      }

      // Convert date strings to Date objects
      if (params.entry_timestamp) {
        params.entry_timestamp = new Date(params.entry_timestamp);
      }
      if (params.captured_datetime) {
        params.captured_datetime = new Date(params.captured_datetime);
      }

      // Update the contaminant
      const updatedContaminant = await Contaminant.findOneAndUpdate(
        { uid: params.uid },
        { $set: params },
        { new: true, runValidators: true }
      ).populate('facility').populate('shipment');

      return {
        success: true,
        data: updatedContaminant?.toObject(),
        message: 'Contaminant updated successfully',
      };
    } catch (error: any) {
      return {
        success: false,
        error: error.message,
      };
    }
  }
}
