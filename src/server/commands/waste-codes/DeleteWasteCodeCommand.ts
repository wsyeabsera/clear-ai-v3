import { ICommand } from '../ICommand';
import { WasteCode } from '../../models/WasteCode';

export class DeleteWasteCodeCommand implements ICommand {
  async execute(params: any): Promise<any> {
    try {
      const { id } = params;

      if (!id) {
        throw new Error('Missing required field: id');
      }

      const wasteCode = await WasteCode.findById(id);
      if (!wasteCode) {
        throw new Error(`Waste code with id ${id} not found`);
      }

      // Soft delete by setting deleted_at timestamp
      const deletedWasteCode = await WasteCode.findByIdAndUpdate(
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
          id: deletedWasteCode!._id,
          deleted_at: deletedWasteCode!.deleted_at
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
