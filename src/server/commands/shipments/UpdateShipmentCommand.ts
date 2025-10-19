import { ICommand, CommandResult } from '../ICommand';
import { Shipment } from '../../models/Shipment';
import { Facility } from '../../models/Facility';
import { Client } from '../../models/Client';

export class UpdateShipmentCommand implements ICommand {
  async execute(params: any): Promise<CommandResult> {
    try {
      if (!params.id) {
        return {
          success: false,
          error: 'Missing required field: id',
        };
      }

      // Handle facility update if facility_id is provided
      if (params.facility_id) {
        const facility = await Facility.findById(params.facility_id);
        if (!facility) {
          return {
            success: false,
            error: `Facility with id '${params.facility_id}' not found`,
          };
        }
        params.facility = facility._id;
        delete params.facility_id;
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
      const updatedShipment = await Shipment.findByIdAndUpdate(
        params.id,
        { $set: params },
        { new: true, runValidators: true }
      ).populate('facility');

      if (!updatedShipment) {
        return {
          success: false,
          error: `Shipment with id '${params.id}' not found`,
        };
      }

      return {
        success: true,
        data: updatedShipment.toObject(),
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
