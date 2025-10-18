import { ICommand, CommandResult } from '../ICommand';
import { Contaminant } from '../../models/Contaminant';
import { Facility } from '../../models/Facility';
import { Shipment } from '../../models/Shipment';
import mongoose from 'mongoose';

export class CreateContaminantCommand implements ICommand {
  async execute(params: any): Promise<CommandResult> {
    try {
      // Validate required fields
      if (!params.uid || !params.client_uid || !params.facility_uid || !params.shipment_uid) {
        return {
          success: false,
          error: 'Missing required fields: uid, client_uid, facility_uid, shipment_uid',
        };
      }

      // Find facility and shipment
      const facility = await Facility.findOne({ uid: params.facility_uid });
      if (!facility) {
        return {
          success: false,
          error: `Facility with uid '${params.facility_uid}' not found`,
        };
      }

      const shipment = await Shipment.findOne({ uid: params.shipment_uid });
      if (!shipment) {
        return {
          success: false,
          error: `Shipment with uid '${params.shipment_uid}' not found`,
        };
      }

      // Create contaminant data
      const contaminantData = {
        uid: params.uid,
        is_verified: params.is_verified,
        is_correct: params.is_correct,
        reason: params.reason,
        notes: params.notes,
        local_notes: params.local_notes,
        analysis_notes: params.analysis_notes,
        gcp_image_path: params.gcp_image_path,
        gcp_highlight_path: params.gcp_highlight_path,
        waste_item_uid: params.waste_item_uid,
        friendly_name: params.friendly_name,
        local_friendly_name: params.local_friendly_name,
        estimated_size: params.estimated_size,
        material: params.material,
        local_material: params.local_material,
        hydrochloric_acid_risk_level: params.hydrochloric_acid_risk_level,
        sulfur_dioxide_risk_level: params.sulfur_dioxide_risk_level,
        explosive_risk_level: params.explosive_risk_level,
        gate_number: params.gate_number,
        entry_timestamp: params.entry_timestamp ? new Date(params.entry_timestamp) : undefined,
        license_plate: params.license_plate,
        captured_datetime: params.captured_datetime ? new Date(params.captured_datetime) : undefined,
        client: new mongoose.Types.ObjectId(params.client_uid),
        facility: facility._id,
        shipment: shipment._id,
      };

      const contaminant = new Contaminant(contaminantData);
      const savedContaminant = await contaminant.save();

      return {
        success: true,
        data: savedContaminant.toObject(),
        message: 'Contaminant created successfully',
      };
    } catch (error: any) {
      return {
        success: false,
        error: error.message,
      };
    }
  }
}
