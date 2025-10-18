import { ICommand, CommandResult } from '../ICommand';
import { Client } from '../../models/Client';

export class ListClientCommand implements ICommand {
  async execute(params: any): Promise<CommandResult> {
    try {
      // Build query filter
      const filter: any = { deleted_at: { $exists: false } }; // Only non-deleted records
      
      if (params.name) {
        filter.name = { $regex: params.name, $options: 'i' };
      }

      // Pagination
      const page = params.page || 1;
      const limit = params.limit || 10;
      const skip = (page - 1) * limit;

      const clients = await Client.find(filter)
        .sort({ created_at: -1 })
        .skip(skip)
        .limit(limit);

      const total = await Client.countDocuments(filter);

      return {
        success: true,
        data: clients.map(client => client.toObject()),
        meta: {
          total,
          page,
          limit,
          totalPages: Math.ceil(total / limit)
        }
      };
    } catch (error: any) {
      return {
        success: false,
        error: error.message
      };
    }
  }
}
