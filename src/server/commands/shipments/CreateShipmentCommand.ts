import { ICommand, CommandResult } from '../ICommand';
import { Shipment } from '../../models/Shipment';
import { Facility } from '../../models/Facility';

export class CreateShipmentCommand implements ICommand {
  async execute(params: any): Promise<CommandResult> {
    try {
      // Validate required fields
      if (!params.client_id || !params.license_plate) {
        return {
          success: false,
          error: 'Missing required fields: client_id, license_plate',
        };
      }

      // Find facility if facility_id is provided
      let facility = null;
      if (params.facility_id) {
        facility = await Facility.findById(params.facility_id);
        if (!facility) {
          return {
            success: false,
            error: `Facility with id '${params.facility_id}' not found`,
          };
        }
      }

      // Create shipment data
      const shipmentData = {
        client: params.client_id,
        license_plate: params.license_plate,
        entry_timestamp: params.entry_timestamp ? new Date(params.entry_timestamp) : undefined,
        entry_weight: params.entry_weight,
        exit_timestamp: params.exit_timestamp ? new Date(params.exit_timestamp) : undefined,
        exit_weight: params.exit_weight,
        external_reference_id: params.external_reference_id,
        gate_number: params.gate_number,
        shipment_datetime: params.shipment_datetime ? new Date(params.shipment_datetime) : undefined,
        notes: params.notes,
        source: params.source,
        scale_overwrite: params.scale_overwrite || false,
        is_duplicate_check_applied: params.is_duplicate_check_applied || false,
        facility: facility?._id,
      };

      const shipment = new Shipment(shipmentData);
      const savedShipment = await shipment.save();

      return {
        success: true,
        data: savedShipment.toObject(),
        message: 'Shipment created successfully',
      };
    } catch (error: any) {
      return {
        success: false,
        error: error.message,
      };
    }
  }
}
