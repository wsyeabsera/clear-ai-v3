import { ICommand, CommandResult } from '../ICommand';
import { Shipment } from '../../models/Shipment';

export class GetShipmentCommand implements ICommand {
  async execute(params: any): Promise<CommandResult> {
    try {
      if (!params.uid) {
        return {
          success: false,
          error: 'Missing required field: uid',
        };
      }

      const shipment = await Shipment.findOne({ uid: params.uid }).populate('facility');
      
      if (!shipment) {
        return {
          success: false,
          error: `Shipment with uid '${params.uid}' not found`,
        };
      }

      return {
        success: true,
        data: shipment.toObject(),
      };
    } catch (error: any) {
      return {
        success: false,
        error: error.message,
      };
    }
  }
}
