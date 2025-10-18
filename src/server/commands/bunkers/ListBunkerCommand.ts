import { ICommand, CommandResult } from '../ICommand';
import { Bunker } from '../../models/Bunker';
import mongoose from 'mongoose';

export class ListBunkerCommand implements ICommand {
  async execute(params: any): Promise<CommandResult> {
    try {
      // Build query filter
      const filter: any = { deleted_at: { $exists: false } }; // Only non-deleted records
      
      if (params.facility_id) {
        if (!mongoose.Types.ObjectId.isValid(params.facility_id)) {
          return {
            success: false,
            error: 'Invalid facility_id format'
          };
        }
        filter.facility = params.facility_id;
      }
      
      if (params.name) {
        filter.name = { $regex: params.name, $options: 'i' };
      }
      
      if (params.status) {
        filter.status = params.status;
      }
      
      if (params.waste_type) {
        filter.waste_type = { $regex: params.waste_type, $options: 'i' };
      }

      // Pagination
      const page = params.page || 1;
      const limit = params.limit || 10;
      const skip = (page - 1) * limit;

      const bunkers = await Bunker.find(filter)
        .populate('facility')
        .sort({ created_at: -1 })
        .skip(skip)
        .limit(limit);

      const total = await Bunker.countDocuments(filter);

      return {
        success: true,
        data: bunkers.map(bunker => bunker.toObject()),
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
