import { ICommand, CommandResult } from '../ICommand';
import { Facility } from '../../models/Facility';

export class DeleteFacilityCommand implements ICommand {
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

      await Facility.deleteOne({ uid: params.uid });

      return {
        success: true,
        message: `Facility '${params.uid}' deleted successfully`,
      };
    } catch (error: any) {
      return {
        success: false,
        error: error.message,
      };
    }
  }
}
