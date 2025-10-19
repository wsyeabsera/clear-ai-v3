import { ICommand } from '../ICommand';
import { Contract } from '../../models/Contract';

export class GetContractCommand implements ICommand {
  async execute(params: any): Promise<any> {
    try {
      const { id } = params;

      if (!id) {
        throw new Error('Missing required field: id');
      }

      const contract = await Contract.findById(id).populate('facility', 'name address city country').populate('client', 'name');

      if (!contract) {
        throw new Error(`Contract with id ${id} not found`);
      }

      return {
        success: true,
        data: contract.toObject(),
        message: 'Contract retrieved successfully'
      };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error occurred',
        message: 'Failed to retrieve contract'
      };
    }
  }
}
