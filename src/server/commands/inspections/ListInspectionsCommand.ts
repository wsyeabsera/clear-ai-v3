import { ICommand, CommandResult } from '../ICommand';
import { Inspection } from '../../models/Inspection';
import { Facility } from '../../models/Facility';
import { Shipment } from '../../models/Shipment';

export class ListInspectionsCommand implements ICommand {
  async execute(params: any): Promise<CommandResult> {
    try {
      // Build query filter
      const filter: any = {};
      
      if (params.client_uid) {
        filter.client_uid = params.client_uid;
      }
      
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
      
      if (params.delivery_accepted !== undefined) {
        filter.delivery_accepted = params.delivery_accepted;
      }
      
      if (params.delivery_rejected !== undefined) {
        filter.delivery_rejected = params.delivery_rejected;
      }
      
      if (params.date_from || params.date_to) {
        filter.custom_datetime = {};
        if (params.date_from) {
          filter.custom_datetime.$gte = new Date(params.date_from);
        }
        if (params.date_to) {
          filter.custom_datetime.$lte = new Date(params.date_to);
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
      const inspections = await Inspection.find(filter)
        .populate('facility')
        .populate('shipment')
        .sort({ custom_datetime: -1 })
        .skip(skip)
        .limit(limit);

      const total = await Inspection.countDocuments(filter);

      return {
        success: true,
        data: inspections.map(inspection => inspection.toObject()),
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
