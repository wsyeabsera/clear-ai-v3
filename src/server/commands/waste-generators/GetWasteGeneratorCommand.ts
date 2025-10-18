import { ICommand } from '../ICommand';
import { WasteGenerator } from '../../models/WasteGenerator';

export class GetWasteGeneratorCommand implements ICommand {
  async execute(params: any): Promise<any> {
    try {
      const { uid } = params;

      if (!uid) {
        throw new Error('Missing required field: uid');
      }

      const wasteGenerator = await WasteGenerator.findOne({ uid }).populate('client', 'uid name');

      if (!wasteGenerator) {
        throw new Error(`Waste generator with UID ${uid} not found`);
      }

      return {
        success: true,
        data: {
          uid: wasteGenerator.uid,
          name: wasteGenerator.name,
          external_reference_id: wasteGenerator.external_reference_id,
          region: wasteGenerator.region,
          client: wasteGenerator.client,
          created_at: wasteGenerator.created_at,
          created_by_uid: wasteGenerator.created_by_uid,
          updated_at: wasteGenerator.updated_at,
          updated_by_uid: wasteGenerator.updated_by_uid
        },
        message: 'Waste generator retrieved successfully'
      };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error occurred',
        message: 'Failed to retrieve waste generator'
      };
    }
  }
}
