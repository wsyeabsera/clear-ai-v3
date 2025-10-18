import { ICommand } from '../ICommand';
import { WasteProperty } from '../../models/WasteProperty';

export class ListWastePropertiesCommand implements ICommand {
  async execute(params: any): Promise<any> {
    try {
      const {
        client_uid,
        contract_uid,
        min_calorific_value,
        max_calorific_value,
        page = 1,
        limit = 50
      } = params;

      // Build filter query
      const filter: any = {
        deleted_at: { $exists: false } // Only non-deleted waste properties
      };

      if (client_uid) {
        filter.client_uid = client_uid;
      }

      if (contract_uid) {
        filter.contract_uid = contract_uid;
      }

      if (min_calorific_value !== undefined) {
        filter.calorific_value = { $gte: min_calorific_value };
      }

      if (max_calorific_value !== undefined) {
        if (filter.calorific_value) {
          filter.calorific_value.$lte = max_calorific_value;
        } else {
          filter.calorific_value = { $lte: max_calorific_value };
        }
      }

      // Calculate pagination
      const skip = (page - 1) * limit;

      // Execute query with pagination
      const [wasteProperties, totalCount] = await Promise.all([
        WasteProperty.find(filter)
          .populate('contract', 'uid title external_reference_id')
          .sort({ created_at: -1 })
          .skip(skip)
          .limit(limit)
          .lean(),
        WasteProperty.countDocuments(filter)
      ]);

      // Calculate pagination info
      const totalPages = Math.ceil(totalCount / limit);
      const hasNextPage = page < totalPages;
      const hasPrevPage = page > 1;

      return {
        success: true,
        data: {
          wasteProperties: wasteProperties,
          pagination: {
            currentPage: page,
            totalPages,
            totalCount,
            hasNextPage,
            hasPrevPage,
            limit
          }
        },
        message: `Retrieved ${wasteProperties.length} waste properties successfully`
      };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error occurred',
        message: 'Failed to list waste properties'
      };
    }
  }
}

