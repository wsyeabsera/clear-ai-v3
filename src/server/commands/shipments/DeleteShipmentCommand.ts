import { ICommand, CommandResult } from '../ICommand';
import { Shipment } from '../../models/Shipment';

export class DeleteShipmentCommand implements ICommand {
  async execute(params: any): Promise<CommandResult> {
    try {
      if (!params.id) {
        return {
          success: false,
          error: 'Missing required field: id',
        };
      }

      const deletedShipment = await Shipment.findByIdAndDelete(params.id);
      
      if (!deletedShipment) {
        return {
          success: false,
          error: `Shipment with id '${params.id}' not found`,
        };
      }

      return {
        success: true,
        message: `Shipment '${params.id}' deleted successfully`,
      };
    } catch (error: any) {
      return {
        success: false,
        error: error.message,
      };
    }
  }
}
