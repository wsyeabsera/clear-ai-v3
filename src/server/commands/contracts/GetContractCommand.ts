import { ICommand } from '../ICommand';
import { Contract } from '../../models/Contract';

export class GetContractCommand implements ICommand {
  async execute(params: any): Promise<any> {
    try {
      const { uid } = params;

      if (!uid) {
        throw new Error('Missing required field: uid');
      }

      const contract = await Contract.findOne({ uid }).populate('facility', 'uid name address city country').populate('client', 'uid name');

      if (!contract) {
        throw new Error(`Contract with UID ${uid} not found`);
      }

      return {
        success: true,
        data: {
          uid: contract.uid,
          facility_uid: contract.facility_uid,
          client_uid: contract.client_uid,
          title: contract.title,
          external_reference_id: contract.external_reference_id,
          external_waste_code_id: contract.external_waste_code_id,
          start_date: contract.start_date,
          end_date: contract.end_date,
          tonnage_min: contract.tonnage_min,
          tonnage_max: contract.tonnage_max,
          tonnage_actual: contract.tonnage_actual,
          source: contract.source,
          facility: contract.facility,
          client: contract.client,
          created_at: contract.created_at,
          created_by_uid: contract.created_by_uid,
          updated_at: contract.updated_at,
          updated_by_uid: contract.updated_by_uid
        },
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
