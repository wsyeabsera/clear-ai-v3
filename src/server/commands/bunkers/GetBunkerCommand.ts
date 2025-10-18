import { ICommand, CommandResult } from '../ICommand';
import { Bunker } from '../../models/Bunker';
import mongoose from 'mongoose';

export class GetBunkerCommand implements ICommand {
  async execute(params: any): Promise<CommandResult> {
    try {
      if (!params.id) {
        return {
          success: false,
          error: 'Missing required field: id'
        };
      }

      // Validate id is a valid ObjectId
      if (!mongoose.Types.ObjectId.isValid(params.id)) {
        return {
          success: false,
          error: 'Invalid id format'
        };
      }

      const bunker = await Bunker.findById(params.id).populate('facility');
      
      if (!bunker) {
        return {
          success: false,
          error: `Bunker with id '${params.id}' not found`
        };
      }

      return {
        success: true,
        data: bunker.toObject()
      };
    } catch (error: any) {
      return {
        success: false,
        error: error.message
      };
    }
  }
}
