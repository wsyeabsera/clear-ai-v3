import { ICommand, CommandResult } from '../ICommand';
import { Inspection } from '../../models/Inspection';

export class DeleteInspectionCommand implements ICommand {
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

      await Inspection.deleteOne({ uid: params.uid });

      return {
        success: true,
        message: `Inspection '${params.uid}' deleted successfully`,
      };
    } catch (error: any) {
      return {
        success: false,
        error: error.message,
      };
    }
  }
}
