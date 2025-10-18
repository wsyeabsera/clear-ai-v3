import { ICommand } from '../ICommand';
import { WasteProperty } from '../../models/WasteProperty';

export class UpdateWastePropertyCommand implements ICommand {
  async execute(params: any): Promise<any> {
    try {
      const { uid, ...updateData } = params;

      if (!uid) {
        throw new Error('Missing required field: uid');
      }

      const wasteProperty = await WasteProperty.findOne({ uid });
      if (!wasteProperty) {
        throw new Error(`Waste property with UID ${uid} not found`);
      }

      // Prepare update data
      const updateFields: any = {
        updated_at: new Date(),
        updated_by_uid: updateData.client_uid || wasteProperty.created_by_uid
      };

      // Add all updatable fields
      const updatableFields = [
        'waste_description', 'waste_amount', 'waste_designation',
        'consistency', 'type_of_waste', 'processing_steps',
        'min_calorific_value', 'calorific_value', 'biogenic_part', 'plastic_content', 'edge_length',
        'water', 'ash', 'fluorine', 'sulfur', 'chlorine', 'flue_gas',
        'mercury', 'cadmium', 'lead', 'copper', 'zinc', 'phosphate',
        'comments'
      ];

      updatableFields.forEach(field => {
        if (updateData[field] !== undefined) {
          updateFields[field] = updateData[field];
        }
      });

      const updatedWasteProperty = await WasteProperty.findOneAndUpdate(
        { uid },
        updateFields,
        { new: true, runValidators: true }
      );

      return {
        success: true,
        data: updatedWasteProperty!.toObject(),
        message: 'Waste property updated successfully'
      };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error occurred',
        message: 'Failed to update waste property'
      };
    }
  }
}

