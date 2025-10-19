import { ICommand } from '../ICommand';
import { ShipmentWasteComposition } from '../../models/ShipmentWasteComposition';

export class DeleteShipmentWasteCompositionCommand implements ICommand {
  async execute(params: any): Promise<any> {
    try {
      const { id } = params;

      if (!id) {
        throw new Error('Missing required field: id');
      }

      const composition = await ShipmentWasteComposition.findById(id);
      if (!composition) {
        throw new Error(`Shipment waste composition with id ${id} not found`);
      }

      // Soft delete by setting deleted_at timestamp
      const deletedComposition = await ShipmentWasteComposition.findByIdAndUpdate(
        id,
        {
          deleted_at: new Date(),
          updated_at: new Date()
        },
        { new: true }
      );

      return {
        success: true,
        data: {
          id: deletedComposition!._id,
          deleted_at: deletedComposition!.deleted_at
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
