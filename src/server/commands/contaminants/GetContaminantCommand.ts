import { ICommand, CommandResult } from '../ICommand';
import { Contaminant } from '../../models/Contaminant';

export class GetContaminantCommand implements ICommand {
  async execute(params: any): Promise<CommandResult> {
    try {
      if (!params.uid) {
        return {
          success: false,
          error: 'Missing required field: uid',
        };
      }

      const contaminant = await Contaminant.findOne({ uid: params.uid })
        .populate('facility')
        .populate('shipment');
      
      if (!contaminant) {
        return {
          success: false,
          error: `Contaminant with uid '${params.uid}' not found`,
        };
      }

      return {
        success: true,
        data: contaminant.toObject(),
      };
    } catch (error: any) {
      return {
        success: false,
        error: error.message,
      };
    }
  }
}
