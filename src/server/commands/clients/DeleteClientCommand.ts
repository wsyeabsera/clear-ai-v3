import { ICommand, CommandResult } from '../ICommand';
import { Client } from '../../models/Client';
import mongoose from 'mongoose';

export class DeleteClientCommand implements ICommand {
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

      const client = await Client.findOneAndUpdate(
        { _id: params.id },
        { deleted_at: new Date() },
        { new: true }
      );
      
      if (!client) {
        return {
          success: false,
          error: `Client with ID ${params.id} not found`
        };
      }

      return {
        success: true,
        data: {
          deleted_at: client.deleted_at
        },
        message: 'Client deleted successfully'
      };
    } catch (error: any) {
      return {
        success: false,
        error: error.message
      };
    }
  }
}
