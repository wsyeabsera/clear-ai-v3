import { MCPTool } from '../../types/mcp';
import clientTools from './tool-schemas/client';
import bunkerTools from './tool-schemas/bunker';
import shipmentTools from './tool-schemas/shipment';
import facilityTools from './tool-schemas/facility';
import contaminantTools from './tool-schemas/contaminant';
import inspectionTools from './tool-schemas/inspection';
import contractTools from './tool-schemas/contract';
import wasteCodeTools from './tool-schemas/waste-code';
import wasteGeneratorTools from './tool-schemas/waste-generator';
import shipmentWasteCompositionTools from './tool-schemas/shipment-waste-composition';
import wastePropertyTools from './tool-schemas/waste-property';
export class ToolRegistry {
  private static tools: MCPTool[] = [
    ...clientTools,
    ...bunkerTools,
    ...shipmentTools,
    ...facilityTools,
    ...contaminantTools,
    ...inspectionTools,
    ...contractTools,
    ...wasteCodeTools,
    ...wasteGeneratorTools,
    ...shipmentWasteCompositionTools,
    ...wastePropertyTools,
  ];

  static getAllTools(): MCPTool[] {
    return this.tools;
  }

  static getTool(name: string): MCPTool | undefined {
    return this.tools.find(tool => tool.name === name);
  }
}
