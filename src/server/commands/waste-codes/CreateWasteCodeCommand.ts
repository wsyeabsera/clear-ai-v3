import { ICommand } from '../ICommand';
import { WasteCode } from '../../models/WasteCode';

export class CreateWasteCodeCommand implements ICommand {
  async execute(params: any): Promise<any> {
    try {
      const {
        code,
        name,
        description,
        color_code,
        code_with_spaces,
        calorific_value_min,
        calorific_value_max,
        calorific_value_comment,
        source
      } = params;

      // Validate required fields
      if (!code || !name) {
        throw new Error('Missing required fields: code, name');
      }

      // Check if waste code already exists by code
      const existingByCode = await WasteCode.findOne({ code });
      if (existingByCode) {
        throw new Error(`Waste code with code ${code} already exists`);
      }

      // Create new waste code
      const wasteCodeData: any = {
        code,
        name,
        created_at: new Date()
      };

      // Add optional fields if provided
      if (description) wasteCodeData.description = description;
      if (color_code) wasteCodeData.color_code = color_code;
      if (code_with_spaces) wasteCodeData.code_with_spaces = code_with_spaces;
      if (calorific_value_min !== undefined) wasteCodeData.calorific_value_min = calorific_value_min;
      if (calorific_value_max !== undefined) wasteCodeData.calorific_value_max = calorific_value_max;
      if (calorific_value_comment) wasteCodeData.calorific_value_comment = calorific_value_comment;
      if (source) wasteCodeData.source = source;

      const wasteCode = new WasteCode(wasteCodeData);
      const savedWasteCode = await wasteCode.save();

      return {
        success: true,
        data: savedWasteCode.toObject(),
        message: 'Waste code created successfully'
      };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error occurred',
        message: 'Failed to create waste code'
      };
    }
  }
}
