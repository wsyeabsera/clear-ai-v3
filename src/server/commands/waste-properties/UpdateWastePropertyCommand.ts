import { ICommand } from '../ICommand';
import { WasteProperty } from '../../models/WasteProperty';

export class UpdateWastePropertyCommand implements ICommand {
  async execute(params: any): Promise<any> {
    try {
      const { id, ...updateData } = params;

      if (!id) {
        throw new Error('Missing required field: id');
      }

      const wasteProperty = await WasteProperty.findById(id);
      if (!wasteProperty) {
        throw new Error(`Waste property with id ${id} not found`);
      }

      // Prepare update data
      const updateFields: any = {
        updated_at: new Date()
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

      const updatedWasteProperty = await WasteProperty.findByIdAndUpdate(
        id,
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

