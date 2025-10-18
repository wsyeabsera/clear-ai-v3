import { ICommand } from './ICommand';
import { CreateClientCommand } from './clients/CreateClientCommand';
import { GetClientCommand } from './clients/GetClientCommand';
import { UpdateClientCommand } from './clients/UpdateClientCommand';
import { DeleteClientCommand } from './clients/DeleteClientCommand';
import { ListClientCommand } from './clients/ListClientCommand';
import { CreateBunkerCommand } from './bunkers/CreateBunkerCommand';
import { GetBunkerCommand } from './bunkers/GetBunkerCommand';
import { UpdateBunkerCommand } from './bunkers/UpdateBunkerCommand';
import { DeleteBunkerCommand } from './bunkers/DeleteBunkerCommand';
import { ListBunkerCommand } from './bunkers/ListBunkerCommand';
import { CreateShipmentCommand } from './shipments/CreateShipmentCommand';
import { GetShipmentCommand } from './shipments/GetShipmentCommand';
import { UpdateShipmentCommand } from './shipments/UpdateShipmentCommand';
import { DeleteShipmentCommand } from './shipments/DeleteShipmentCommand';
import { ListShipmentsCommand } from './shipments/ListShipmentsCommand';
import { CreateFacilityCommand } from './facilities/CreateFacilityCommand';
import { GetFacilityCommand } from './facilities/GetFacilityCommand';
import { UpdateFacilityCommand } from './facilities/UpdateFacilityCommand';
import { DeleteFacilityCommand } from './facilities/DeleteFacilityCommand';
import { ListFacilitiesCommand } from './facilities/ListFacilitiesCommand';
import { CreateContaminantCommand } from './contaminants/CreateContaminantCommand';
import { GetContaminantCommand } from './contaminants/GetContaminantCommand';
import { UpdateContaminantCommand } from './contaminants/UpdateContaminantCommand';
import { DeleteContaminantCommand } from './contaminants/DeleteContaminantCommand';
import { ListContaminantsCommand } from './contaminants/ListContaminantsCommand';
import { CreateInspectionCommand } from './inspections/CreateInspectionCommand';
import { GetInspectionCommand } from './inspections/GetInspectionCommand';
import { UpdateInspectionCommand } from './inspections/UpdateInspectionCommand';
import { DeleteInspectionCommand } from './inspections/DeleteInspectionCommand';
import { ListInspectionsCommand } from './inspections/ListInspectionsCommand';
import { CreateContractCommand } from './contracts/CreateContractCommand';
import { GetContractCommand } from './contracts/GetContractCommand';
import { UpdateContractCommand } from './contracts/UpdateContractCommand';
import { DeleteContractCommand } from './contracts/DeleteContractCommand';
import { ListContractsCommand } from './contracts/ListContractsCommand';
import { CreateWasteCodeCommand } from './waste-codes/CreateWasteCodeCommand';
import { GetWasteCodeCommand } from './waste-codes/GetWasteCodeCommand';
import { UpdateWasteCodeCommand } from './waste-codes/UpdateWasteCodeCommand';
import { DeleteWasteCodeCommand } from './waste-codes/DeleteWasteCodeCommand';
import { ListWasteCodesCommand } from './waste-codes/ListWasteCodesCommand';
import { CreateWasteGeneratorCommand } from './waste-generators/CreateWasteGeneratorCommand';
import { GetWasteGeneratorCommand } from './waste-generators/GetWasteGeneratorCommand';
import { UpdateWasteGeneratorCommand } from './waste-generators/UpdateWasteGeneratorCommand';
import { DeleteWasteGeneratorCommand } from './waste-generators/DeleteWasteGeneratorCommand';
import { ListWasteGeneratorsCommand } from './waste-generators/ListWasteGeneratorsCommand';
import { CreateShipmentWasteCompositionCommand } from './shipment-waste-compositions/CreateShipmentWasteCompositionCommand';
import { GetShipmentWasteCompositionCommand } from './shipment-waste-compositions/GetShipmentWasteCompositionCommand';
import { UpdateShipmentWasteCompositionCommand } from './shipment-waste-compositions/UpdateShipmentWasteCompositionCommand';
import { DeleteShipmentWasteCompositionCommand } from './shipment-waste-compositions/DeleteShipmentWasteCompositionCommand';
import { ListShipmentWasteCompositionsCommand } from './shipment-waste-compositions/ListShipmentWasteCompositionsCommand';
import { CreateWastePropertyCommand } from './waste-properties/CreateWastePropertyCommand';
import { GetWastePropertyCommand } from './waste-properties/GetWastePropertyCommand';
import { UpdateWastePropertyCommand } from './waste-properties/UpdateWastePropertyCommand';
import { DeleteWastePropertyCommand } from './waste-properties/DeleteWastePropertyCommand';
import { ListWastePropertiesCommand } from './waste-properties/ListWastePropertiesCommand';

export class CommandFactory {
  private static commands: Map<string, ICommand> = new Map([
    // Client commands
    ['clients_create', new CreateClientCommand()],
    ['clients_get', new GetClientCommand()],
    ['clients_update', new UpdateClientCommand()],
    ['clients_delete', new DeleteClientCommand()],
    ['clients_list', new ListClientCommand()],
    
    // Bunker commands
    ['bunkers_create', new CreateBunkerCommand()],
    ['bunkers_get', new GetBunkerCommand()],
    ['bunkers_update', new UpdateBunkerCommand()],
    ['bunkers_delete', new DeleteBunkerCommand()],
    ['bunkers_list', new ListBunkerCommand()],
    
    // Shipment commands
    ['shipments_create', new CreateShipmentCommand()],
    ['shipments_get', new GetShipmentCommand()],
    ['shipments_update', new UpdateShipmentCommand()],
    ['shipments_delete', new DeleteShipmentCommand()],
    ['shipments_list', new ListShipmentsCommand()],
    
    // Facility commands
    ['facilities_create', new CreateFacilityCommand()],
    ['facilities_get', new GetFacilityCommand()],
    ['facilities_update', new UpdateFacilityCommand()],
    ['facilities_delete', new DeleteFacilityCommand()],
    ['facilities_list', new ListFacilitiesCommand()],
    
    // Contaminant commands
    ['contaminants_create', new CreateContaminantCommand()],
    ['contaminants_get', new GetContaminantCommand()],
    ['contaminants_update', new UpdateContaminantCommand()],
    ['contaminants_delete', new DeleteContaminantCommand()],
    ['contaminants_list', new ListContaminantsCommand()],
    
    // Inspection commands
    ['inspections_create', new CreateInspectionCommand()],
    ['inspections_get', new GetInspectionCommand()],
    ['inspections_update', new UpdateInspectionCommand()],
    ['inspections_delete', new DeleteInspectionCommand()],
    ['inspections_list', new ListInspectionsCommand()],
    
    // Contract commands
    ['contracts_create', new CreateContractCommand()],
    ['contracts_get', new GetContractCommand()],
    ['contracts_update', new UpdateContractCommand()],
    ['contracts_delete', new DeleteContractCommand()],
    ['contracts_list', new ListContractsCommand()],
    
    // Waste Code commands
    ['waste_codes_create', new CreateWasteCodeCommand()],
    ['waste_codes_get', new GetWasteCodeCommand()],
    ['waste_codes_update', new UpdateWasteCodeCommand()],
    ['waste_codes_delete', new DeleteWasteCodeCommand()],
    ['waste_codes_list', new ListWasteCodesCommand()],
    
    // Waste Generator commands
    ['waste_generators_create', new CreateWasteGeneratorCommand()],
    ['waste_generators_get', new GetWasteGeneratorCommand()],
    ['waste_generators_update', new UpdateWasteGeneratorCommand()],
    ['waste_generators_delete', new DeleteWasteGeneratorCommand()],
    ['waste_generators_list', new ListWasteGeneratorsCommand()],
    
    // Shipment Waste Composition commands
    ['shipment_waste_compositions_create', new CreateShipmentWasteCompositionCommand()],
    ['shipment_waste_compositions_get', new GetShipmentWasteCompositionCommand()],
    ['shipment_waste_compositions_update', new UpdateShipmentWasteCompositionCommand()],
    ['shipment_waste_compositions_delete', new DeleteShipmentWasteCompositionCommand()],
    ['shipment_waste_compositions_list', new ListShipmentWasteCompositionsCommand()],
    
    // Waste Property commands
    ['waste_properties_create', new CreateWastePropertyCommand()],
    ['waste_properties_get', new GetWastePropertyCommand()],
    ['waste_properties_update', new UpdateWastePropertyCommand()],
    ['waste_properties_delete', new DeleteWastePropertyCommand()],
    ['waste_properties_list', new ListWastePropertiesCommand()],
  ]);

  static getCommand(commandName: string): ICommand | undefined {
    return this.commands.get(commandName);
  }

  static getAllCommandNames(): string[] {
    return Array.from(this.commands.keys());
  }

  static executeCommand(commandName: string, params: any): Promise<any> {
    const command = this.getCommand(commandName);
    if (!command) {
      throw new Error(`Command '${commandName}' not found`);
    }
    return command.execute(params);
  }
}
