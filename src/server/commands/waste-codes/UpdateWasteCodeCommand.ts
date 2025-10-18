import { ICommand } from '../ICommand';
import { WasteCode } from '../../models/WasteCode';

export class UpdateWasteCodeCommand implements ICommand {
  async execute(params: any): Promise<any> {
    try {
      const { uid, ...updateData } = params;

      if (!uid) {
        throw new Error('Missing required field: uid');
      }

      const wasteCode = await WasteCode.findOne({ uid });
      if (!wasteCode) {
        throw new Error(`Waste code with UID ${uid} not found`);
      }

      // Prepare update data
      const updateFields: any = {
        updated_at: new Date(),
        updated_by_uid: updateData.client_uid || 'system'
      };

      // Add fields that are provided
      if (updateData.code !== undefined) updateFields.code = updateData.code;
      if (updateData.name !== undefined) updateFields.name = updateData.name;
      if (updateData.description !== undefined) updateFields.description = updateData.description;
      if (updateData.color_code !== undefined) updateFields.color_code = updateData.color_code;
      if (updateData.code_with_spaces !== undefined) updateFields.code_with_spaces = updateData.code_with_spaces;
      if (updateData.calorific_value_min !== undefined) updateFields.calorific_value_min = updateData.calorific_value_min;
      if (updateData.calorific_value_max !== undefined) updateFields.calorific_value_max = updateData.calorific_value_max;
      if (updateData.calorific_value_comment !== undefined) updateFields.calorific_value_comment = updateData.calorific_value_comment;
      if (updateData.source !== undefined) updateFields.source = updateData.source;

      // Check if code is being updated and if it already exists
      if (updateData.code && updateData.code !== wasteCode.code) {
        const existingCode = await WasteCode.findOne({ code: updateData.code });
        if (existingCode) {
          throw new Error(`Waste code with code ${updateData.code} already exists`);
        }
      }

      const updatedWasteCode = await WasteCode.findOneAndUpdate(
        { uid },
        updateFields,
        { new: true, runValidators: true }
      );

      return {
        success: true,
        data: {
          uid: updatedWasteCode!.uid,
          code: updatedWasteCode!.code,
          name: updatedWasteCode!.name,
          description: updatedWasteCode!.description,
          color_code: updatedWasteCode!.color_code,
          code_with_spaces: updatedWasteCode!.code_with_spaces,
          calorific_value_min: updatedWasteCode!.calorific_value_min,
          calorific_value_max: updatedWasteCode!.calorific_value_max,
          calorific_value_comment: updatedWasteCode!.calorific_value_comment,
          source: updatedWasteCode!.source,
          created_at: updatedWasteCode!.created_at,
          created_by_uid: updatedWasteCode!.created_by_uid,
          updated_at: updatedWasteCode!.updated_at,
          updated_by_uid: updatedWasteCode!.updated_by_uid
        },
        message: 'Waste code updated successfully'
      };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error occurred',
        message: 'Failed to update waste code'
      };
    }
  }
}
