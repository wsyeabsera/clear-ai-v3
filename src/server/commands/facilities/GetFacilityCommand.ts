import { ICommand, CommandResult } from '../ICommand';
import { Facility } from '../../models/Facility';

export class GetFacilityCommand implements ICommand {
  async execute(params: any): Promise<CommandResult> {
    try {
      if (!params.id) {
        return {
          success: false,
          error: 'Missing required field: id',
        };
      }

      const facility = await Facility.findById(params.id).populate('client');
      
      if (!facility) {
        return {
          success: false,
          error: `Facility with id '${params.id}' not found`,
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
