import { ICommand, CommandResult } from '../ICommand';
import { Facility } from '../../models/Facility';

export class ListFacilitiesCommand implements ICommand {
  async execute(params: any): Promise<CommandResult> {
    try {
      // Build query filter
      const filter: any = {};
      
      if (params.client_id) {
        filter.client = params.client_id;
      }
      
      if (params.name) {
        filter.name = { $regex: params.name, $options: 'i' };
      }
      
      if (params.city) {
        filter.city = { $regex: params.city, $options: 'i' };
      }
      
      if (params.country) {
        filter.country = { $regex: params.country, $options: 'i' };
      }

      // Validate required pagination parameters
      if (params.page === undefined || params.page === null) {
        return {
          success: false,
          error: 'Page parameter is required'
        };
      }
      if (params.limit === undefined || params.limit === null) {
        return {
          success: false,
          error: 'Limit parameter is required'
        };
      }

      // Pagination
      const page = parseInt(params.page);
      const limit = parseInt(params.limit);
      const skip = (page - 1) * limit;

      // Execute query
      const facilities = await Facility.find(filter)
        .sort({ name: 1 })
        .skip(skip)
        .limit(limit);

      const total = await Facility.countDocuments(filter);

      return {
        success: true,
        data: facilities.map(facility => facility.toObject()),
        meta: {
          total,
          page,
          limit,
          totalPages: Math.ceil(total / limit),
        },
      };
    } catch (error: any) {
      return {
        success: false,
        error: error.message,
      };
    }
  }
}
