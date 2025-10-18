import { ICommand, CommandResult } from '../ICommand';
import { Client } from '../../models/Client';
import mongoose from 'mongoose';

export class GetClientCommand implements ICommand {
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

      const client = await Client.findById(params.id);
      
      if (!client) {
        return {
          success: false,
          error: `Client with id '${params.id}' not found`
        };
      }

      return {
        success: true,
        data: client.toObject()
      };
    } catch (error: any) {
      return {
        success: false,
        error: error.message
      };
    }
  }
}
