import { ICommand } from '../ICommand';
import { Contract } from '../../models/Contract';
import { Facility } from '../../models/Facility';

export class CreateContractCommand implements ICommand {
  async execute(params: any): Promise<any> {
    try {
      const {
        uid,
        facility_uid,
        client_uid,
        title,
        external_reference_id,
        external_waste_code_id,
        start_date,
        end_date,
        tonnage_min,
        tonnage_max,
        tonnage_actual,
        source
      } = params;

      // Validate required fields
      if (!uid || !facility_uid || !client_uid) {
        throw new Error('Missing required fields: uid, facility_uid, client_uid');
      }

      // Check if contract already exists
      const existingContract = await Contract.findOne({ uid });
      if (existingContract) {
        throw new Error(`Contract with UID ${uid} already exists`);
      }

      // Find facility to get ObjectId
      const facility = await Facility.findOne({ uid: facility_uid });
      if (!facility) {
        throw new Error(`Facility with UID ${facility_uid} not found`);
      }

      // Create new contract
      const contractData: any = {
        uid,
        facility_uid,
        client_uid,
        facility: facility._id,
        client: facility._id, // Assuming client is same as facility for now
        created_at: new Date(),
        created_by_uid: client_uid
      };

      // Add optional fields if provided
      if (title) contractData.title = title;
      if (external_reference_id) contractData.external_reference_id = external_reference_id;
      if (external_waste_code_id) contractData.external_waste_code_id = external_waste_code_id;
      if (start_date) contractData.start_date = new Date(start_date);
      if (end_date) contractData.end_date = new Date(end_date);
      if (tonnage_min !== undefined) contractData.tonnage_min = tonnage_min;
      if (tonnage_max !== undefined) contractData.tonnage_max = tonnage_max;
      if (tonnage_actual !== undefined) contractData.tonnage_actual = tonnage_actual;
      if (source) contractData.source = source;

      const contract = new Contract(contractData);
      const savedContract = await contract.save();

      return {
        success: true,
        data: {
          uid: savedContract.uid,
          facility_uid: savedContract.facility_uid,
          client_uid: savedContract.client_uid,
          title: savedContract.title,
          external_reference_id: savedContract.external_reference_id,
          external_waste_code_id: savedContract.external_waste_code_id,
          start_date: savedContract.start_date,
          end_date: savedContract.end_date,
          tonnage_min: savedContract.tonnage_min,
          tonnage_max: savedContract.tonnage_max,
          tonnage_actual: savedContract.tonnage_actual,
          source: savedContract.source,
          created_at: savedContract.created_at,
          created_by_uid: savedContract.created_by_uid
        },
        message: 'Contract created successfully'
      };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error occurred',
        message: 'Failed to create contract'
      };
    }
  }
}
