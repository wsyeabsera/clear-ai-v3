import { ICommand } from '../ICommand';
import { WasteGenerator } from '../../models/WasteGenerator';

export class GetWasteGeneratorCommand implements ICommand {
  async execute(params: any): Promise<any> {
    try {
      const { id } = params;

      if (!id) {
        throw new Error('Missing required field: id');
      }

      const wasteGenerator = await WasteGenerator.findById(id).populate('client', 'name');

      if (!wasteGenerator) {
        throw new Error(`Waste generator with id ${id} not found`);
      }

      return {
        success: true,
        data: wasteGenerator.toObject(),
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
