import { ICommand, CommandResult } from '../ICommand';
import { Shipment } from '../../models/Shipment';
import { Facility } from '../../models/Facility';

export class UpdateShipmentCommand implements ICommand {
  async execute(params: any): Promise<CommandResult> {
    try {
      if (!params.uid) {
        return {
          success: false,
          error: 'Missing required field: uid',
        };
      }

      const shipment = await Shipment.findOne({ uid: params.uid });
      
      if (!shipment) {
        return {
          success: false,
          error: `Shipment with uid '${params.uid}' not found`,
        };
      }

      // Handle facility update if facility_uid is provided
      if (params.facility_uid) {
        const facility = await Facility.findOne({ uid: params.facility_uid });
        if (!facility) {
          return {
            success: false,
            error: `Facility with uid '${params.facility_uid}' not found`,
          };
        }
        params.facility = facility._id;
        delete params.facility_uid;
      }

      // Convert date strings to Date objects
      if (params.entry_timestamp) {
        params.entry_timestamp = new Date(params.entry_timestamp);
      }
      if (params.exit_timestamp) {
        params.exit_timestamp = new Date(params.exit_timestamp);
      }
      if (params.shipment_datetime) {
        params.shipment_datetime = new Date(params.shipment_datetime);
      }

      // Update the shipment
      const updatedShipment = await Shipment.findOneAndUpdate(
        { uid: params.uid },
        { $set: params },
        { new: true, runValidators: true }
      ).populate('facility');

      return {
        success: true,
        data: updatedShipment?.toObject(),
        message: 'Shipment updated successfully',
      };
    } catch (error: any) {
      return {
        success: false,
        error: error.message,
      };
    }
  }
}
