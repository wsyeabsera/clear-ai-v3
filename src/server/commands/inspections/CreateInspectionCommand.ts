import { ICommand, CommandResult } from '../ICommand';
import { Inspection } from '../../models/Inspection';
import { Facility } from '../../models/Facility';
import { Shipment } from '../../models/Shipment';

export class CreateInspectionCommand implements ICommand {
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

      // Create inspection data
      const inspectionData = {
        uid: params.uid,
        client_uid: params.client_uid,
        additional_categories: params.additional_categories,
        akb_reasons: params.akb_reasons,
        calorific_value: params.calorific_value,
        category_values: params.category_values,
        comments: params.comments,
        consistency: params.consistency,
        custom_datetime: params.custom_datetime ? new Date(params.custom_datetime) : undefined,
        delivery_accepted: params.delivery_accepted,
        delivery_matches_conditions: params.delivery_matches_conditions,
        delivery_rejected: params.delivery_rejected,
        edge_length: params.edge_length,
        external_reference_id: params.external_reference_id,
        fecal_smell: params.fecal_smell,
        incorrectly_declared: params.incorrectly_declared,
        license_plate: params.license_plate,
        moisture: params.moisture,
        partial_unloading: params.partial_unloading,
        pungent_smell: params.pungent_smell,
        salvage: params.salvage,
        sample_incineration: params.sample_incineration,
        solvent_like_smell: params.solvent_like_smell,
        facility: facility._id,
        shipment: shipment._id,
      };

      const inspection = new Inspection(inspectionData);
      const savedInspection = await inspection.save();

      return {
        success: true,
        data: savedInspection.toObject(),
        message: 'Inspection created successfully',
      };
    } catch (error: any) {
      return {
        success: false,
        error: error.message,
      };
    }
  }
}
