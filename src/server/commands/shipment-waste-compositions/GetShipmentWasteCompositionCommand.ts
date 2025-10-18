import { ICommand } from '../ICommand';
import { ShipmentWasteComposition } from '../../models/ShipmentWasteComposition';

export class GetShipmentWasteCompositionCommand implements ICommand {
  async execute(params: any): Promise<any> {
    try {
      const { uid } = params;

      if (!uid) {
        throw new Error('Missing required field: uid');
      }

      const composition = await ShipmentWasteComposition.findOne({ uid })
        .populate('shipment', 'uid license_plate entry_weight exit_weight')
        .populate('facility', 'uid name address city country')
        .populate('bunker', 'uid name capacity current_load');

      if (!composition) {
        throw new Error(`Shipment waste composition with UID ${uid} not found`);
      }

      return {
        success: true,
        data: {
          uid: composition.uid,
          client_uid: composition.client_uid,
          shipment: composition.shipment,
          facility: composition.facility,
          bunker: composition.bunker,
          moisture_level: composition.moisture_level,
          moisture_comment: composition.moisture_comment,
          dust_load_level: composition.dust_load_level,
          dust_load_comment: composition.dust_load_comment,
          calorific_value_min: composition.calorific_value_min,
          calorific_value_max: composition.calorific_value_max,
          calorific_value_comment: composition.calorific_value_comment,
          biogenic_content_percentage: composition.biogenic_content_percentage,
          biogenic_content_comment: composition.biogenic_content_comment,
          sulfur_dioxide_risk: composition.sulfur_dioxide_risk,
          sulfur_dioxide_comment: composition.sulfur_dioxide_comment,
          hydrochloric_acid_risk: composition.hydrochloric_acid_risk,
          hydrochloric_acid_comment: composition.hydrochloric_acid_comment,
          mono_charge_detected: composition.mono_charge_detected,
          mono_charge_comment: composition.mono_charge_comment,
          likely_ewc_code: composition.likely_ewc_code,
          likely_ewc_description: composition.likely_ewc_description,
          likely_ewc_comment: composition.likely_ewc_comment,
          created_at: composition.created_at,
          created_by_uid: composition.created_by_uid,
          updated_at: composition.updated_at,
          updated_by_uid: composition.updated_by_uid
        },
        message: 'Shipment waste composition retrieved successfully'
      };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error occurred',
        message: 'Failed to retrieve shipment waste composition'
      };
    }
  }
}
