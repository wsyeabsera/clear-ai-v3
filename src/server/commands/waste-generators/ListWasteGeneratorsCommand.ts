import { ICommand } from '../ICommand';
import { WasteGenerator } from '../../models/WasteGenerator';

export class ListWasteGeneratorsCommand implements ICommand {
  async execute(params: any): Promise<any> {
    try {
      const {
        client_uid,
        name,
        region,
        city,
        country,
        email,
        page = 1,
        limit = 50
      } = params;

      // Build filter query
      const filter: any = {
        deleted_at: { $exists: false } // Only non-deleted waste generators
      };

      if (client_uid) {
        filter.client_uid = client_uid;
      }

      if (name) {
        filter.name = { $regex: name, $options: 'i' }; // Case-insensitive search
      }

      if (region) {
        filter.region = { $regex: region, $options: 'i' }; // Case-insensitive search
      }

      if (city) {
        filter.city = { $regex: city, $options: 'i' }; // Case-insensitive search
      }

      if (country) {
        filter.country = { $regex: country, $options: 'i' }; // Case-insensitive search
      }

      if (email) {
        filter.email = { $regex: email, $options: 'i' }; // Case-insensitive search
      }

      // Calculate pagination
      const skip = (page - 1) * limit;

      // Execute query with pagination
      const [wasteGenerators, totalCount] = await Promise.all([
        WasteGenerator.find(filter)
          .populate('client', 'uid name')
          .sort({ name: 1 }) // Sort by name alphabetically
          .skip(skip)
          .limit(limit)
          .lean(),
        WasteGenerator.countDocuments(filter)
      ]);

      // Calculate pagination info
      const totalPages = Math.ceil(totalCount / limit);
      const hasNextPage = page < totalPages;
      const hasPrevPage = page > 1;

      return {
        success: true,
        data: {
          wasteGenerators: wasteGenerators,
          pagination: {
            currentPage: page,
            totalPages,
            totalCount,
            hasNextPage,
            hasPrevPage,
            limit
          }
        },
        message: `Retrieved ${wasteGenerators.length} waste generators successfully`
      };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error occurred',
        message: 'Failed to list waste generators'
      };
    }
  }
}
