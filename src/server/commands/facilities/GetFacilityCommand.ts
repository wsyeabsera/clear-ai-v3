import { ICommand, CommandResult } from '../ICommand';
import { Facility } from '../../models/Facility';

export class GetFacilityCommand implements ICommand {
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

      return {
        success: true,
        data: facility.toObject(),
      };
    } catch (error: any) {
      return {
        success: false,
        error: error.message,
      };
    }
  }
}
