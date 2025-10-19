import { ICommand } from '../ICommand';
import { Contract } from '../../models/Contract';

export class DeleteContractCommand implements ICommand {
  async execute(params: any): Promise<any> {
    try {
      const { id } = params;

      if (!id) {
        throw new Error('Missing required field: id');
      }

      const contract = await Contract.findById(id);
      if (!contract) {
        throw new Error(`Contract with id ${id} not found`);
      }

      // Soft delete by setting deleted_at timestamp
      const deletedContract = await Contract.findByIdAndUpdate(
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
          id: deletedContract!._id,
          deleted_at: deletedContract!.deleted_at
        },
        message: 'Contract deleted successfully'
      };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error occurred',
        message: 'Failed to delete contract'
      };
    }
  }
}
