import { ICommand } from '../ICommand';
import { WasteCode } from '../../models/WasteCode';

export class CreateWasteCodeCommand implements ICommand {
  async execute(params: any): Promise<any> {
    try {
      const {
        uid,
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
      if (!uid || !code || !name) {
        throw new Error('Missing required fields: uid, code, name');
      }

      // Check if waste code already exists by UID or code
      const existingByUid = await WasteCode.findOne({ uid });
      if (existingByUid) {
        throw new Error(`Waste code with UID ${uid} already exists`);
      }

      const existingByCode = await WasteCode.findOne({ code });
      if (existingByCode) {
        throw new Error(`Waste code with code ${code} already exists`);
      }

      // Create new waste code
      const wasteCodeData: any = {
        uid,
        code,
        name,
        created_at: new Date(),
        created_by_uid: params.client_uid || 'system'
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
        data: {
          uid: savedWasteCode.uid,
          code: savedWasteCode.code,
          name: savedWasteCode.name,
          description: savedWasteCode.description,
          color_code: savedWasteCode.color_code,
          code_with_spaces: savedWasteCode.code_with_spaces,
          calorific_value_min: savedWasteCode.calorific_value_min,
          calorific_value_max: savedWasteCode.calorific_value_max,
          calorific_value_comment: savedWasteCode.calorific_value_comment,
          source: savedWasteCode.source,
          created_at: savedWasteCode.created_at,
          created_by_uid: savedWasteCode.created_by_uid
        },
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
