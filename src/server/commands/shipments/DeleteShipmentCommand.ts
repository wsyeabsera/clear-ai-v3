import { ICommand, CommandResult } from '../ICommand';
import { Shipment } from '../../models/Shipment';

export class DeleteShipmentCommand implements ICommand {
  async execute(params: any): Promise<CommandResult> {
    try {
      if (!params.uid) {
        return {
          success: false,
          error: 'Missing required field: uid',
        };
      }

      const shipment = await Shipment.findOne({ uid: params.uid });
      
      if (!shipment) {
        return {
          success: false,
          error: `Shipment with uid '${params.uid}' not found`,
        };
      }

      await Shipment.deleteOne({ uid: params.uid });

      return {
        success: true,
        message: `Shipment '${params.uid}' deleted successfully`,
      };
    } catch (error: any) {
      return {
        success: false,
        error: error.message,
      };
    }
  }
}
