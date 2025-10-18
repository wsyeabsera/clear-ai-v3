import { ICommand } from '../ICommand';
import { WasteProperty } from '../../models/WasteProperty';

export class DeleteWastePropertyCommand implements ICommand {
  async execute(params: any): Promise<any> {
    try {
      const { uid } = params;

      if (!uid) {
        throw new Error('Missing required field: uid');
      }

      const wasteProperty = await WasteProperty.findOne({ uid });
      if (!wasteProperty) {
        throw new Error(`Waste property with UID ${uid} not found`);
      }

      // Soft delete
      wasteProperty.deleted_at = new Date();
      wasteProperty.deleted_by_uid = params.client_uid || wasteProperty.created_by_uid;
      await wasteProperty.save();

      return {
        success: true,
        data: { uid },
        message: 'Waste property deleted successfully'
      };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error occurred',
        message: 'Failed to delete waste property'
      };
    }
  }
}

