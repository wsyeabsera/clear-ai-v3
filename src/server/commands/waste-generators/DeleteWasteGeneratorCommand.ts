import { ICommand } from '../ICommand';
import { WasteGenerator } from '../../models/WasteGenerator';

export class DeleteWasteGeneratorCommand implements ICommand {
  async execute(params: any): Promise<any> {
    try {
      const { uid } = params;

      if (!uid) {
        throw new Error('Missing required field: uid');
      }

      const wasteGenerator = await WasteGenerator.findOne({ uid });
      if (!wasteGenerator) {
        throw new Error(`Waste generator with UID ${uid} not found`);
      }

      // Soft delete by setting deleted_at timestamp
      await WasteGenerator.findOneAndUpdate(
        { uid },
        {
          deleted_at: new Date(),
          deleted_by_uid: params.client_uid || wasteGenerator.created_by_uid,
          updated_at: new Date()
        }
      );

      return {
        success: true,
        data: {
          uid: wasteGenerator.uid,
          deleted_at: new Date()
        },
        message: 'Waste generator deleted successfully'
      };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error occurred',
        message: 'Failed to delete waste generator'
      };
    }
  }
}
