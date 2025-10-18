import { ICommand } from '../ICommand';
import { Contract } from '../../models/Contract';

export class DeleteContractCommand implements ICommand {
  async execute(params: any): Promise<any> {
    try {
      const { uid } = params;

      if (!uid) {
        throw new Error('Missing required field: uid');
      }

      const contract = await Contract.findOne({ uid });
      if (!contract) {
        throw new Error(`Contract with UID ${uid} not found`);
      }

      // Soft delete by setting deleted_at timestamp
      await Contract.findOneAndUpdate(
        { uid },
        {
          deleted_at: new Date(),
          deleted_by_uid: params.client_uid || contract.client_uid,
          updated_at: new Date()
        }
      );

      return {
        success: true,
        data: {
          uid: contract.uid,
          deleted_at: new Date()
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
