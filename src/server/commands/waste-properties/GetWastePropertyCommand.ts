import { ICommand } from '../ICommand';
import { WasteProperty } from '../../models/WasteProperty';

export class GetWastePropertyCommand implements ICommand {
  async execute(params: any): Promise<any> {
    try {
      const { uid } = params;

      if (!uid) {
        throw new Error('Missing required field: uid');
      }

      const wasteProperty = await WasteProperty.findOne({ uid, deleted_at: { $exists: false } })
        .populate('contract', 'uid title external_reference_id')
        .lean();

      if (!wasteProperty) {
        throw new Error(`Waste property with UID ${uid} not found`);
      }

      return {
        success: true,
        data: wasteProperty,
        message: 'Waste property retrieved successfully'
      };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error occurred',
        message: 'Failed to retrieve waste property'
      };
    }
  }
}

