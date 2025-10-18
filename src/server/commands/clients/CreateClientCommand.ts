import { ICommand, CommandResult } from '../ICommand';
import { Client } from '../../models/Client';

export class CreateClientCommand implements ICommand {
  async execute(params: any): Promise<CommandResult> {
    try {
      console.error('[CreateClientCommand] Starting execution...');
      
      // Validate required fields
      if (!params.name) {
        console.error('[CreateClientCommand] Missing required fields');
        return {
          success: false,
          error: 'Missing required fields: name'
        };
      }

      console.error('[CreateClientCommand] Creating new client...');

      const client = new Client({
        name: params.name
      });
      
      console.error('[CreateClientCommand] Saving client to database...');
      const savedClient = await client.save();
      console.error('[CreateClientCommand] Client saved successfully:', savedClient._id);

      return {
        success: true,
        data: savedClient.toObject(),
        message: 'Client created successfully'
      };
    } catch (error: any) {
      console.error('[CreateClientCommand] Error:', error);
      return {
        success: false,
        error: error.message
      };
    }
  }
}