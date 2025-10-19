import { ICommand } from '../ICommand';
import { ShipmentWasteComposition } from '../../models/ShipmentWasteComposition';

export class GetShipmentWasteCompositionCommand implements ICommand {
  async execute(params: any): Promise<any> {
    try {
      const { id } = params;

      if (!id) {
        throw new Error('Missing required field: id');
      }

      const composition = await ShipmentWasteComposition.findById(id)
        .populate('shipment', 'license_plate entry_weight exit_weight')
        .populate('facility', 'name address city country')
        .populate('bunker', 'name capacity current_load');

      if (!composition) {
        throw new Error(`Shipment waste composition with id ${id} not found`);
      }

      return {
        success: true,
        data: composition.toObject(),
        message: 'Shipment waste composition retrieved successfully'
      };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error occurred',
        message: 'Failed to retrieve shipment waste composition'
      };
    }
  }
}
