import { ICommand } from '../ICommand';
import { WasteGenerator } from '../../models/WasteGenerator';

export class DeleteWasteGeneratorCommand implements ICommand {
  async execute(params: any): Promise<any> {
    try {
      const { id } = params;

      if (!id) {
        throw new Error('Missing required field: id');
      }

      const wasteGenerator = await WasteGenerator.findById(id);
      if (!wasteGenerator) {
        throw new Error(`Waste generator with id ${id} not found`);
      }

      // Soft delete by setting deleted_at timestamp
      const deletedWasteGenerator = await WasteGenerator.findByIdAndUpdate(
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
          id: deletedWasteGenerator!._id,
          deleted_at: deletedWasteGenerator!.deleted_at
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
