import { ICommand, CommandResult } from '../ICommand';
import { Contaminant } from '../../models/Contaminant';
import { Facility } from '../../models/Facility';
import { Shipment } from '../../models/Shipment';

export class ListContaminantsCommand implements ICommand {
  async execute(params: any): Promise<CommandResult> {
    try {
      // Build query filter
      const filter: any = {};
      
      if (params.facility_uid) {
        const facility = await Facility.findOne({ uid: params.facility_uid });
        if (facility) {
          filter.facility = facility._id;
        }
      }
      
      if (params.shipment_uid) {
        const shipment = await Shipment.findOne({ uid: params.shipment_uid });
        if (shipment) {
          filter.shipment = shipment._id;
        }
      }
      
      if (params.is_verified !== undefined) {
        filter.is_verified = params.is_verified;
      }
      
      if (params.material) {
        filter.material = { $regex: params.material, $options: 'i' };
      }
      
      if (params.date_from || params.date_to) {
        filter.captured_datetime = {};
        if (params.date_from) {
          filter.captured_datetime.$gte = new Date(params.date_from);
        }
        if (params.date_to) {
          filter.captured_datetime.$lte = new Date(params.date_to);
        }
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
      const contaminants = await Contaminant.find(filter)
        .populate('facility')
        .populate('shipment')
        .sort({ captured_datetime: -1 })
        .skip(skip)
        .limit(limit);

      const total = await Contaminant.countDocuments(filter);

      return {
        success: true,
        data: contaminants.map(contaminant => contaminant.toObject()),
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
