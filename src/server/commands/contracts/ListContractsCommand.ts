import { ICommand } from '../ICommand';
import { Contract } from '../../models/Contract';

export class ListContractsCommand implements ICommand {
  async execute(params: any): Promise<any> {
    try {
      const {
        facility_id,
        client_id,
        title,
        date_from,
        date_to,
        page = 1,
        limit = 50
      } = params;

      // Build filter query
      const filter: any = {
        deleted_at: { $exists: false } // Only non-deleted contracts
      };

      if (facility_id) {
        filter.facility = facility_id;
      }

      if (client_id) {
        filter.client = client_id;
      }

      if (title) {
        filter.title = { $regex: title, $options: 'i' }; // Case-insensitive search
      }

      if (date_from || date_to) {
        filter.created_at = {};
        if (date_from) {
          filter.created_at.$gte = new Date(date_from);
        }
        if (date_to) {
          filter.created_at.$lte = new Date(date_to);
        }
      }

      // Calculate pagination
      const skip = (page - 1) * limit;

      // Execute query with pagination
      const [contracts, totalCount] = await Promise.all([
        Contract.find(filter)
          .populate('facility', 'name address city country')
          .populate('client', 'name')
          .sort({ created_at: -1 })
          .skip(skip)
          .limit(limit)
          .lean(),
        Contract.countDocuments(filter)
      ]);

      // Calculate pagination info
      const totalPages = Math.ceil(totalCount / limit);
      const hasNextPage = page < totalPages;
      const hasPrevPage = page > 1;

      return {
        success: true,
        data: {
          contracts: contracts.map(contract => contract),
          pagination: {
            currentPage: page,
            totalPages,
            totalCount,
            hasNextPage,
            hasPrevPage,
            limit
          }
        },
        message: `Retrieved ${contracts.length} contracts successfully`
      };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error occurred',
        message: 'Failed to list contracts'
      };
    }
  }
}
