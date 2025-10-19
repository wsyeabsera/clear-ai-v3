import { ICommand } from '../ICommand';
import { Contract } from '../../models/Contract';

export class UpdateContractCommand implements ICommand {
  async execute(params: any): Promise<any> {
    try {
      const { id, ...updateData } = params;

      if (!id) {
        throw new Error('Missing required field: id');
      }

      // Prepare update data
      const updateFields: any = {};

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

      const updatedContract = await Contract.findByIdAndUpdate(
        id,
        updateFields,
        { new: true, runValidators: true }
      ).populate('facility').populate('client');

      if (!updatedContract) {
        throw new Error(`Contract with id ${id} not found`);
      }

      return {
        success: true,
        data: updatedContract.toObject(),
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
