import { ICommand } from './ICommand';
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

export class CommandFactory {
  private static commands: Map<string, ICommand> = new Map([
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
