import { ICommand } from '../ICommand';
import { WasteCode } from '../../models/WasteCode';

export class ListWasteCodesCommand implements ICommand {
  async execute(params: any): Promise<any> {
    try {
      const {
        code,
        name,
        page = 1,
        limit = 50
      } = params;

      // Build filter query
      const filter: any = {
        deleted_at: { $exists: false } // Only non-deleted waste codes
      };

      if (code) {
        filter.code = { $regex: code, $options: 'i' }; // Case-insensitive search
      }

      if (name) {
        filter.name = { $regex: name, $options: 'i' }; // Case-insensitive search
      }

      // Calculate pagination
      const skip = (page - 1) * limit;

      // Execute query with pagination
      const [wasteCodes, totalCount] = await Promise.all([
        WasteCode.find(filter)
          .sort({ code: 1 }) // Sort by code alphabetically
          .skip(skip)
          .limit(limit)
          .lean(),
        WasteCode.countDocuments(filter)
      ]);

      // Calculate pagination info
      const totalPages = Math.ceil(totalCount / limit);
      const hasNextPage = page < totalPages;
      const hasPrevPage = page > 1;

      return {
        success: true,
        data: wasteCodes.map(wasteCode => wasteCode.toObject()),
        pagination: {
          currentPage: page,
          totalPages,
          totalCount,
          hasNextPage,
          hasPrevPage,
          limit
        },
        message: `Retrieved ${wasteCodes.length} waste codes successfully`
      };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error occurred',
        message: 'Failed to list waste codes'
      };
    }
  }
}
