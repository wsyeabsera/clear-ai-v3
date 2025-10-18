import { ICommand } from '../ICommand';
import { WasteCode } from '../../models/WasteCode';

export class DeleteWasteCodeCommand implements ICommand {
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

      // Soft delete by setting deleted_at timestamp
      await WasteCode.findOneAndUpdate(
        { uid },
        {
          deleted_at: new Date(),
          deleted_by_uid: params.client_uid || 'system',
          updated_at: new Date()
        }
      );

      return {
        success: true,
        data: {
          uid: wasteCode.uid,
          deleted_at: new Date()
        },
        message: 'Waste code deleted successfully'
      };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error occurred',
        message: 'Failed to delete waste code'
      };
    }
  }
}
