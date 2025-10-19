import { ICommand } from '../ICommand';
import { WasteGenerator } from '../../models/WasteGenerator';

export class CreateWasteGeneratorCommand implements ICommand {
  async execute(params: any): Promise<any> {
    try {
      const {
        client_id,
        name,
        external_reference_id,
        region,
        // Contact information
        phone,
        telephone,
        email,
        // Address information
        address,
        street_address,
        city,
        postal_code,
        zip_code,
        country,
        address_notes,
        // Other fields
        source,
        notes
      } = params;

      // Validate required fields
      if (!name || !client_id) {
        throw new Error('Missing required fields: name, client_id');
      }

      // Create new waste generator
      const wasteGeneratorData: any = {
        name,
        client: client_id,
        created_at: new Date()
      };

      // Add optional fields if provided
      if (external_reference_id) wasteGeneratorData.external_reference_id = external_reference_id;
      if (region) wasteGeneratorData.region = region;
      // Contact information
      if (phone) wasteGeneratorData.phone = phone;
      if (telephone) wasteGeneratorData.telephone = telephone;
      if (email) wasteGeneratorData.email = email;
      // Address information
      if (address) wasteGeneratorData.address = address;
      if (street_address) wasteGeneratorData.street_address = street_address;
      if (city) wasteGeneratorData.city = city;
      if (postal_code) wasteGeneratorData.postal_code = postal_code;
      if (zip_code) wasteGeneratorData.zip_code = zip_code;
      if (country) wasteGeneratorData.country = country;
      if (address_notes) wasteGeneratorData.address_notes = address_notes;
      // Other fields
      if (source) wasteGeneratorData.source = source;
      if (notes) wasteGeneratorData.notes = notes;

      const wasteGenerator = new WasteGenerator(wasteGeneratorData);
      const savedWasteGenerator = await wasteGenerator.save();

      return {
        success: true,
        data: savedWasteGenerator.toObject(),
        message: 'Waste generator created successfully'
      };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error occurred',
        message: 'Failed to create waste generator'
      };
    }
  }
}
