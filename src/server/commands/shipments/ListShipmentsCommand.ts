import { ICommand, CommandResult } from '../ICommand';
import { Shipment } from '../../models/Shipment';

export class ListShipmentsCommand implements ICommand {
  async execute(params: any): Promise<CommandResult> {
    try {
      // Build query filter
      const filter: any = {};
      
      if (params.client_uid) {
        filter.client_uid = params.client_uid;
      }
      
      if (params.facility_uid) {
        // Find facility and use its ObjectId
        const { Facility } = await import('../../models/Facility');
        const facility = await Facility.findOne({ uid: params.facility_uid });
        if (facility) {
          filter.facility = facility._id;
        }
      }
      
      if (params.license_plate) {
        filter.license_plate = { $regex: params.license_plate, $options: 'i' };
      }
      
      if (params.date_from || params.date_to) {
        filter.shipment_datetime = {};
        if (params.date_from) {
          filter.shipment_datetime.$gte = new Date(params.date_from);
        }
        if (params.date_to) {
          filter.shipment_datetime.$lte = new Date(params.date_to);
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
      const shipments = await Shipment.find(filter)
        .populate('facility')
        .sort({ shipment_datetime: -1 })
        .skip(skip)
        .limit(limit);

      const total = await Shipment.countDocuments(filter);

      return {
        success: true,
        data: shipments.map(shipment => shipment.toObject()),
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
