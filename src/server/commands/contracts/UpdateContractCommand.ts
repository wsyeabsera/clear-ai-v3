import { ICommand } from '../ICommand';
import { Contract } from '../../models/Contract';

export class UpdateContractCommand implements ICommand {
  async execute(params: any): Promise<any> {
    try {
      const { uid, ...updateData } = params;

      if (!uid) {
        throw new Error('Missing required field: uid');
      }

      const contract = await Contract.findOne({ uid });
      if (!contract) {
        throw new Error(`Contract with UID ${uid} not found`);
      }

      // Prepare update data
      const updateFields: any = {
        updated_at: new Date(),
        updated_by_uid: updateData.client_uid || contract.client_uid
      };

      // Add fields that are provided
      if (updateData.title !== undefined) updateFields.title = updateData.title;
      if (updateData.external_reference_id !== undefined) updateFields.external_reference_id = updateData.external_reference_id;
      if (updateData.external_waste_code_id !== undefined) updateFields.external_waste_code_id = updateData.external_waste_code_id;
      if (updateData.start_date !== undefined) updateFields.start_date = new Date(updateData.start_date);
      if (updateData.end_date !== undefined) updateFields.end_date = new Date(updateData.end_date);
      if (updateData.tonnage_min !== undefined) updateFields.tonnage_min = updateData.tonnage_min;
      if (updateData.tonnage_max !== undefined) updateFields.tonnage_max = updateData.tonnage_max;
      if (updateData.tonnage_actual !== undefined) updateFields.tonnage_actual = updateData.tonnage_actual;
      if (updateData.source !== undefined) updateFields.source = updateData.source;

      const updatedContract = await Contract.findOneAndUpdate(
        { uid },
        updateFields,
        { new: true, runValidators: true }
      );

      return {
        success: true,
        data: {
          uid: updatedContract!.uid,
          facility_uid: updatedContract!.facility_uid,
          client_uid: updatedContract!.client_uid,
          title: updatedContract!.title,
          external_reference_id: updatedContract!.external_reference_id,
          external_waste_code_id: updatedContract!.external_waste_code_id,
          start_date: updatedContract!.start_date,
          end_date: updatedContract!.end_date,
          tonnage_min: updatedContract!.tonnage_min,
          tonnage_max: updatedContract!.tonnage_max,
          tonnage_actual: updatedContract!.tonnage_actual,
          source: updatedContract!.source,
          created_at: updatedContract!.created_at,
          created_by_uid: updatedContract!.created_by_uid,
          updated_at: updatedContract!.updated_at,
          updated_by_uid: updatedContract!.updated_by_uid
        },
        message: 'Contract updated successfully'
      };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error occurred',
        message: 'Failed to update contract'
      };
    }
  }
}
