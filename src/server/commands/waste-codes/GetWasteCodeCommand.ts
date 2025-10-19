import { ICommand } from '../ICommand';
import { WasteCode } from '../../models/WasteCode';

export class GetWasteCodeCommand implements ICommand {
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

      return {
        success: true,
        data: wasteCode.toObject(),
        message: 'Waste code retrieved successfully'
      };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error occurred',
        message: 'Failed to retrieve waste code'
      };
    }
  }
}
