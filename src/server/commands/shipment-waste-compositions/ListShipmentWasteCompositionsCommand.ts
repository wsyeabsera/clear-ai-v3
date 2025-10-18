import { ICommand } from '../ICommand';
import { ShipmentWasteComposition, SEVERITY_ENUM } from '../../models/ShipmentWasteComposition';

export class ListShipmentWasteCompositionsCommand implements ICommand {
  async execute(params: any): Promise<any> {
    try {
      const {
        client_uid,
        shipment_uid,
        facility_uid,
        bunker_uid,
        moisture_level,
        sulfur_dioxide_risk,
        date_from,
        date_to,
        // Material composition filters
        has_glass,
        has_plastics,
        has_metals,
        has_organic,
        min_calorific_value,
        max_calorific_value,
        page = 1,
        limit = 50
      } = params;

      // Build filter query
      const filter: any = {
        deleted_at: { $exists: false } // Only non-deleted compositions
      };

      if (client_uid) {
        filter.client_uid = client_uid;
      }

      if (shipment_uid) {
        // Find shipment by UID and use its ObjectId
        const { Shipment } = await import('../../models/Shipment');
        const shipment = await Shipment.findOne({ uid: shipment_uid });
        if (shipment) {
          filter.shipment = shipment._id;
        } else {
          // If shipment not found, return empty result
          filter.shipment = { $exists: false };
        }
      }

      if (facility_uid) {
        // Find facility by UID and use its ObjectId
        const { Facility } = await import('../../models/Facility');
        const facility = await Facility.findOne({ uid: facility_uid });
        if (facility) {
          filter.facility = facility._id;
        } else {
          // If facility not found, return empty result
          filter.facility = { $exists: false };
        }
      }

      if (bunker_uid) {
        // Find bunker by UID and use its ObjectId
        const { Bunker } = await import('../../models/Bunker');
        const bunker = await Bunker.findOne({ uid: bunker_uid });
        if (bunker) {
          filter.bunker = bunker._id;
        } else {
          // If bunker not found, return empty result
          filter.bunker = { $exists: false };
        }
      }

      if (moisture_level && Object.values(SEVERITY_ENUM).includes(moisture_level)) {
        filter.moisture_level = moisture_level;
      }

      if (sulfur_dioxide_risk && Object.values(SEVERITY_ENUM).includes(sulfur_dioxide_risk)) {
        filter.sulfur_dioxide_risk = sulfur_dioxide_risk;
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

      // Material composition filters
      if (has_glass === true) {
        filter.glass = { $gt: 0 };
      }
      if (has_plastics === true) {
        filter.$or = [
          { hard_plastics: { $gt: 0 } },
          { lightweight_packaging_lwp: { $gt: 0 } },
          { composite_packaging: { $gt: 0 } },
          { pvc_items: { $gt: 0 } },
          { films_dirty_pe_pp: { $gt: 0 } }
        ];
      }
      if (has_metals === true) {
        filter.$or = [
          { iron_fe: { $gt: 0 } },
          { aluminium_shavings_comb: { $gt: 0 } },
          { copper_cu: { $gt: 0 } }
        ];
      }
      if (has_organic === true) {
        filter.$or = [
          { paper_moist: { $gt: 0 } },
          { msw_wet: { $gt: 0 } },
          { msw_mixed: { $gt: 0 } },
          { garden_household_furniture: { $gt: 0 } }
        ];
      }
      if (min_calorific_value !== undefined) {
        filter.calorific_value_min = { $gte: min_calorific_value };
      }
      if (max_calorific_value !== undefined) {
        filter.calorific_value_max = { $lte: max_calorific_value };
      }

      // Calculate pagination
      const skip = (page - 1) * limit;

      // Execute query with pagination
      const [compositions, totalCount] = await Promise.all([
        ShipmentWasteComposition.find(filter)
          .populate('shipment', 'uid license_plate entry_weight exit_weight')
          .populate('facility', 'uid name address city country')
          .populate('bunker', 'uid name capacity current_load')
          .sort({ created_at: -1 })
          .skip(skip)
          .limit(limit)
          .lean(),
        ShipmentWasteComposition.countDocuments(filter)
      ]);

      // Calculate pagination info
      const totalPages = Math.ceil(totalCount / limit);
      const hasNextPage = page < totalPages;
      const hasPrevPage = page > 1;

      return {
        success: true,
        data: {
          compositions: compositions,
          pagination: {
            currentPage: page,
            totalPages,
            totalCount,
            hasNextPage,
            hasPrevPage,
            limit
          }
        },
        message: `Retrieved ${compositions.length} shipment waste compositions successfully`
      };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error occurred',
        message: 'Failed to list shipment waste compositions'
      };
    }
  }
}
