import { ICommand } from '../ICommand';
import { WasteProperty } from '../../models/WasteProperty';

export class DeleteWastePropertyCommand implements ICommand {
  async execute(params: any): Promise<any> {
    try {
      const { id } = params;

      if (!id) {
        throw new Error('Missing required field: id');
      }

      const wasteProperty = await WasteProperty.findById(id);
      if (!wasteProperty) {
        throw new Error(`Waste property with id ${id} not found`);
      }

      // Soft delete
      const deletedWasteProperty = await WasteProperty.findByIdAndUpdate(
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
          id: deletedWasteProperty!._id,
          deleted_at: deletedWasteProperty!.deleted_at
        },
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

