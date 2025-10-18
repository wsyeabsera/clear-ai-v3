import { ICommand } from '../ICommand';
import { Contract } from '../../models/Contract';

export class ListContractsCommand implements ICommand {
  async execute(params: any): Promise<any> {
    try {
      const {
        facility_uid,
        client_uid,
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

      if (facility_uid) {
        filter.facility_uid = facility_uid;
      }

      if (client_uid) {
        filter.client_uid = client_uid;
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
          .populate('facility', 'uid name address city country')
          .populate('client', 'uid name')
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
          contracts: contracts.map(contract => ({
            uid: contract.uid,
            facility_uid: contract.facility_uid,
            client_uid: contract.client_uid,
            title: contract.title,
            external_reference_id: contract.external_reference_id,
            external_waste_code_id: contract.external_waste_code_id,
            start_date: contract.start_date,
            end_date: contract.end_date,
            tonnage_min: contract.tonnage_min,
            tonnage_max: contract.tonnage_max,
            tonnage_actual: contract.tonnage_actual,
            source: contract.source,
            facility: contract.facility,
            client: contract.client,
            created_at: contract.created_at,
            created_by_uid: contract.created_by_uid,
            updated_at: contract.updated_at,
            updated_by_uid: contract.updated_by_uid
          })),
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
