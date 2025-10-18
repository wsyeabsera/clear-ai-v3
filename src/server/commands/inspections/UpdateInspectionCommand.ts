import { ICommand, CommandResult } from '../ICommand';
import { Inspection } from '../../models/Inspection';

export class UpdateInspectionCommand implements ICommand {
  async execute(params: any): Promise<CommandResult> {
    try {
      if (!params.uid) {
        return {
          success: false,
          error: 'Missing required field: uid',
        };
      }

      const inspection = await Inspection.findOne({ uid: params.uid });
      
      if (!inspection) {
        return {
          success: false,
          error: `Inspection with uid '${params.uid}' not found`,
        };
      }

      // Convert date strings to Date objects
      if (params.custom_datetime) {
        params.custom_datetime = new Date(params.custom_datetime);
      }

      // Update the inspection
      const updatedInspection = await Inspection.findOneAndUpdate(
        { uid: params.uid },
        { $set: params },
        { new: true, runValidators: true }
      ).populate('facility').populate('shipment');

      return {
        success: true,
        data: updatedInspection?.toObject(),
        message: 'Inspection updated successfully',
      };
    } catch (error: any) {
      return {
        success: false,
        error: error.message,
      };
    }
  }
}
