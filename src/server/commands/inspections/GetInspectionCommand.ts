import { ICommand, CommandResult } from '../ICommand';
import { Inspection } from '../../models/Inspection';

export class GetInspectionCommand implements ICommand {
  async execute(params: any): Promise<CommandResult> {
    try {
      if (!params.uid) {
        return {
          success: false,
          error: 'Missing required field: uid',
        };
      }

      const inspection = await Inspection.findOne({ uid: params.uid })
        .populate('facility')
        .populate('shipment');
      
      if (!inspection) {
        return {
          success: false,
          error: `Inspection with uid '${params.uid}' not found`,
        };
      }

      return {
        success: true,
        data: inspection.toObject(),
      };
    } catch (error: any) {
      return {
        success: false,
        error: error.message,
      };
    }
  }
}
