import { ICommand, CommandResult } from '../ICommand';
import { Shipment } from '../../models/Shipment';
import { Client } from '../../models/Client';

export class GetShipmentCommand implements ICommand {
  async execute(params: any): Promise<CommandResult> {
    try {
      if (!params.id) {
        return {
          success: false,
          error: 'Missing required field: id',
        };
      }

      const shipment = await Shipment.findById(params.id).populate('facility');
      
      if (!shipment) {
        return {
          success: false,
          error: `Shipment with id '${params.id}' not found`,
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
