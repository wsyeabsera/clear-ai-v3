import { ICommand } from '../ICommand';
import { WasteCode } from '../../models/WasteCode';

export class UpdateWasteCodeCommand implements ICommand {
  async execute(params: any): Promise<any> {
    try {
      const { id, ...updateData } = params;

      if (!id) {
        throw new Error('Missing required field: id');
      }

      const wasteCode = await WasteCode.findById(id);
      if (!wasteCode) {
        throw new Error(`Waste code with id ${id} not found`);
      }

      // Prepare update data
      const updateFields: any = {
        updated_at: new Date()
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

      const updatedWasteCode = await WasteCode.findByIdAndUpdate(
        id,
        updateFields,
        { new: true, runValidators: true }
      );

      return {
        success: true,
        data: updatedWasteCode!.toObject(),
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
