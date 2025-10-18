import { ICommand } from '../ICommand';
import { ShipmentWasteComposition } from '../../models/ShipmentWasteComposition';

export class DeleteShipmentWasteCompositionCommand implements ICommand {
  async execute(params: any): Promise<any> {
    try {
      const { uid } = params;

      if (!uid) {
        throw new Error('Missing required field: uid');
      }

      const composition = await ShipmentWasteComposition.findOne({ uid });
      if (!composition) {
        throw new Error(`Shipment waste composition with UID ${uid} not found`);
      }

      // Soft delete by setting deleted_at timestamp
      await ShipmentWasteComposition.findOneAndUpdate(
        { uid },
        {
          deleted_at: new Date(),
          deleted_by_uid: params.client_uid || composition.created_by_uid,
          updated_at: new Date()
        }
      );

      return {
        success: true,
        data: {
          uid: composition.uid,
          deleted_at: new Date()
        },
        message: 'Shipment waste composition deleted successfully'
      };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error occurred',
        message: 'Failed to delete shipment waste composition'
      };
    }
  }
}
