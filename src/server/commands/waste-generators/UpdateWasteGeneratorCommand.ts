import { ICommand } from '../ICommand';
import { WasteGenerator } from '../../models/WasteGenerator';

export class UpdateWasteGeneratorCommand implements ICommand {
  async execute(params: any): Promise<any> {
    try {
      const { id, ...updateData } = params;

      if (!id) {
        throw new Error('Missing required field: id');
      }

      const wasteGenerator = await WasteGenerator.findById(id);
      if (!wasteGenerator) {
        throw new Error(`Waste generator with id ${id} not found`);
      }

      // Prepare update data
      const updateFields: any = {
        updated_at: new Date()
      };

      // Add fields that are provided
      if (updateData.name !== undefined) updateFields.name = updateData.name;
      if (updateData.external_reference_id !== undefined) updateFields.external_reference_id = updateData.external_reference_id;
      if (updateData.region !== undefined) updateFields.region = updateData.region;
      // Contact information
      if (updateData.phone !== undefined) updateFields.phone = updateData.phone;
      if (updateData.telephone !== undefined) updateFields.telephone = updateData.telephone;
      if (updateData.email !== undefined) updateFields.email = updateData.email;
      // Address information
      if (updateData.address !== undefined) updateFields.address = updateData.address;
      if (updateData.street_address !== undefined) updateFields.street_address = updateData.street_address;
      if (updateData.city !== undefined) updateFields.city = updateData.city;
      if (updateData.postal_code !== undefined) updateFields.postal_code = updateData.postal_code;
      if (updateData.zip_code !== undefined) updateFields.zip_code = updateData.zip_code;
      if (updateData.country !== undefined) updateFields.country = updateData.country;
      if (updateData.address_notes !== undefined) updateFields.address_notes = updateData.address_notes;
      // Other fields
      if (updateData.source !== undefined) updateFields.source = updateData.source;
      if (updateData.notes !== undefined) updateFields.notes = updateData.notes;

      const updatedWasteGenerator = await WasteGenerator.findByIdAndUpdate(
        id,
        updateFields,
        { new: true, runValidators: true }
      );

      return {
        success: true,
        data: updatedWasteGenerator!.toObject(),
        message: 'Waste generator updated successfully'
      };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error occurred',
        message: 'Failed to update waste generator'
      };
    }
  }
}
