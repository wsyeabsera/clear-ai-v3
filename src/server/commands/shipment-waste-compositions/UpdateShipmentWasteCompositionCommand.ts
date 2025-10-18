import { ICommand } from '../ICommand';
import { ShipmentWasteComposition, SEVERITY_ENUM } from '../../models/ShipmentWasteComposition';

export class UpdateShipmentWasteCompositionCommand implements ICommand {
  async execute(params: any): Promise<any> {
    try {
      const { uid, ...updateData } = params;

      if (!uid) {
        throw new Error('Missing required field: uid');
      }

      const composition = await ShipmentWasteComposition.findOne({ uid });
      if (!composition) {
        throw new Error(`Shipment waste composition with UID ${uid} not found`);
      }

      // Prepare update data
      const updateFields: any = {
        updated_at: new Date(),
        updated_by_uid: updateData.client_uid || composition.created_by_uid
      };

      // Add basic composition fields that are provided
      if (updateData.moisture_level !== undefined && Object.values(SEVERITY_ENUM).includes(updateData.moisture_level)) {
        updateFields.moisture_level = updateData.moisture_level;
      }
      if (updateData.moisture_comment !== undefined) updateFields.moisture_comment = updateData.moisture_comment;
      if (updateData.dust_load_level !== undefined && Object.values(SEVERITY_ENUM).includes(updateData.dust_load_level)) {
        updateFields.dust_load_level = updateData.dust_load_level;
      }
      if (updateData.dust_load_comment !== undefined) updateFields.dust_load_comment = updateData.dust_load_comment;
      if (updateData.calorific_value_min !== undefined) updateFields.calorific_value_min = updateData.calorific_value_min;
      if (updateData.calorific_value_max !== undefined) updateFields.calorific_value_max = updateData.calorific_value_max;
      if (updateData.calorific_value_comment !== undefined) updateFields.calorific_value_comment = updateData.calorific_value_comment;
      if (updateData.biogenic_content_percentage !== undefined) updateFields.biogenic_content_percentage = updateData.biogenic_content_percentage;
      if (updateData.biogenic_content_comment !== undefined) updateFields.biogenic_content_comment = updateData.biogenic_content_comment;
      if (updateData.sulfur_dioxide_risk !== undefined && Object.values(SEVERITY_ENUM).includes(updateData.sulfur_dioxide_risk)) {
        updateFields.sulfur_dioxide_risk = updateData.sulfur_dioxide_risk;
      }
      if (updateData.sulfur_dioxide_comment !== undefined) updateFields.sulfur_dioxide_comment = updateData.sulfur_dioxide_comment;
      if (updateData.hydrochloric_acid_risk !== undefined && Object.values(SEVERITY_ENUM).includes(updateData.hydrochloric_acid_risk)) {
        updateFields.hydrochloric_acid_risk = updateData.hydrochloric_acid_risk;
      }
      if (updateData.hydrochloric_acid_comment !== undefined) updateFields.hydrochloric_acid_comment = updateData.hydrochloric_acid_comment;
      if (updateData.mono_charge_detected !== undefined) updateFields.mono_charge_detected = updateData.mono_charge_detected;
      if (updateData.mono_charge_comment !== undefined) updateFields.mono_charge_comment = updateData.mono_charge_comment;
      if (updateData.likely_ewc_code !== undefined) updateFields.likely_ewc_code = updateData.likely_ewc_code;
      if (updateData.likely_ewc_description !== undefined) updateFields.likely_ewc_description = updateData.likely_ewc_description;
      if (updateData.likely_ewc_comment !== undefined) updateFields.likely_ewc_comment = updateData.likely_ewc_comment;

      // Add material composition fields if provided
      const materialFields = [
        'concrete_stones', 'glass', 'gypsum_board', 'mineral_fibres', 'bitumen_roofing_felt',
        'insulation_foams', 'hbcd_materials', 'paper_moist', 'msw_wet', 'msw_mixed',
        'garden_household_furniture', 'mattresses', 'carpets', 'wallpaper',
        'wood_ai_aii', 'wood_aiii', 'wood_aiv', 'hard_plastics', 'vehicle_parts_pipes',
        'films_dirty_pe_pp', 'big_bags_pp_fabric', 'canisters_barrels', 'lightweight_packaging_lwp',
        'composite_packaging', 'pvc_items', 'textiles_clothing', 'aluminium_shavings_comb',
        'iron_fe', 'copper_cu', 'gfrp_cfrp', 'rubber_mixed', 'sludges_fines'
      ];

      materialFields.forEach(field => {
        const value = updateData[field];
        const commentField = `${field}_comment`;
        const commentValue = updateData[commentField];
        
        if (value !== undefined && value !== null) {
          updateFields[field] = value;
        }
        if (commentValue !== undefined && commentValue !== null) {
          updateFields[commentField] = commentValue;
        }
      });

      // Add additional fields if provided
      if (updateData.gcp_image_path !== undefined) updateFields.gcp_image_path = updateData.gcp_image_path;
      if (updateData.merged_at !== undefined) updateFields.merged_at = updateData.merged_at;
      if (updateData.merged_by_uid !== undefined) updateFields.merged_by_uid = updateData.merged_by_uid;
      if (updateData.merged_from_shipment_uid !== undefined) updateFields.merged_from_shipment_uid = updateData.merged_from_shipment_uid;

      const updatedComposition = await ShipmentWasteComposition.findOneAndUpdate(
        { uid },
        updateFields,
        { new: true, runValidators: true }
      );

      return {
        success: true,
        data: updatedComposition!.toObject(),
        message: 'Shipment waste composition updated successfully'
      };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error occurred',
        message: 'Failed to update shipment waste composition'
      };
    }
  }
}
