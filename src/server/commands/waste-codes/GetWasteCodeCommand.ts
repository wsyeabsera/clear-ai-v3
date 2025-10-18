import { ICommand } from '../ICommand';
import { WasteCode } from '../../models/WasteCode';

export class GetWasteCodeCommand implements ICommand {
  async execute(params: any): Promise<any> {
    try {
      const { uid } = params;

      if (!uid) {
        throw new Error('Missing required field: uid');
      }

      const wasteCode = await WasteCode.findOne({ uid });

      if (!wasteCode) {
        throw new Error(`Waste code with UID ${uid} not found`);
      }

      return {
        success: true,
        data: {
          uid: wasteCode.uid,
          code: wasteCode.code,
          name: wasteCode.name,
          description: wasteCode.description,
          color_code: wasteCode.color_code,
          code_with_spaces: wasteCode.code_with_spaces,
          calorific_value_min: wasteCode.calorific_value_min,
          calorific_value_max: wasteCode.calorific_value_max,
          calorific_value_comment: wasteCode.calorific_value_comment,
          source: wasteCode.source,
          created_at: wasteCode.created_at,
          created_by_uid: wasteCode.created_by_uid,
          updated_at: wasteCode.updated_at,
          updated_by_uid: wasteCode.updated_by_uid
        },
        message: 'Waste code retrieved successfully'
      };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error occurred',
        message: 'Failed to retrieve waste code'
      };
    }
  }
}
