import { ICommand, CommandResult } from '../ICommand';
import { Contaminant } from '../../models/Contaminant';

export class DeleteContaminantCommand implements ICommand {
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

      await Contaminant.deleteOne({ uid: params.uid });

      return {
        success: true,
        message: `Contaminant '${params.uid}' deleted successfully`,
      };
    } catch (error: any) {
      return {
        success: false,
        error: error.message,
      };
    }
  }
}
