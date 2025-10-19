import { ICommand } from '../ICommand';
import { Contract } from '../../models/Contract';
import { Facility } from '../../models/Facility';

export class CreateContractCommand implements ICommand {
  async execute(params: any): Promise<any> {
    try {
      const {
        facility_id,
        client_id,
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
      if (!facility_id || !client_id) {
        throw new Error('Missing required fields: facility_id, client_id');
      }

      // Find facility to get ObjectId
      const facility = await Facility.findById(facility_id);
      if (!facility) {
        throw new Error(`Facility with id ${facility_id} not found`);
      }

      // Create new contract
      const contractData: any = {
        facility: facility._id,
        client: client_id,
        created_at: new Date()
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
        data: savedContract.toObject(),
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
