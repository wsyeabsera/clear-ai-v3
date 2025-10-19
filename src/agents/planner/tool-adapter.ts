// Tool adapter to format CommandFactory tools for LLM consumption

import { MCPTool } from './types';
import { CommandFactory } from '../../server/commands/CommandFactory';
import { ToolRegistry } from '../../server/tools/ToolRegistry';

export class ToolAdapter {
  /**
   * Convert MCP tool schemas to LLM-friendly format
   */
  static formatToolsForLLM(tools: MCPTool[]): string {
    const formattedTools = tools.map(tool => {
      const params = Object.entries(tool.inputSchema.properties)
        .map(([key, schema]: [string, any]) => {
          const required = tool.inputSchema.required?.includes(key) ? ' (required)' : ' (optional)';
          const type = schema.type || 'unknown';
          const description = schema.description ? ` - ${schema.description}` : '';
          return `    "${key}": "${type}${required}${description}"`;
        })
        .join(',\n');
      
      return `  "${tool.name}": {
    "description": "${tool.description}",
    "parameters": {
${params}
    }
  }`;
    }).join(',\n');
    
    return `Available Tools:
{
${formattedTools}
}`;
  }
  
  /**
   * Get available tools from CommandFactory (using MCP schemas)
   */
  static getAvailableTools(): MCPTool[] {
    // Use the existing MCP tool schemas from ToolRegistry
    // These already have the correct parameter schemas
    return ToolRegistry.getAllTools();
  }
  
  /**
   * Execute a tool using CommandFactory
   */
  static async executeTool(toolName: string, params: any): Promise<any> {
    try {
      return await CommandFactory.executeCommand(toolName, params);
    } catch (error) {
      throw new Error(`Failed to execute tool ${toolName}: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }
  
  /**
   * Extract tool names and descriptions for quick reference
   */
  static getToolSummary(tools: MCPTool[]): string {
    return tools.map(tool => 
      `- ${tool.name}: ${tool.description}`
    ).join('\n');
  }
  
  /**
   * Get tools by category (based on naming convention)
   */
  static getToolsByCategory(tools: MCPTool[]): Record<string, MCPTool[]> {
    const categories: Record<string, MCPTool[]> = {};
    
    tools.forEach(tool => {
      const category = tool.name.split('_')[0]; // e.g., 'shipments' from 'shipments_list'
      if (!categories[category]) {
        categories[category] = [];
      }
      categories[category].push(tool);
    });
    
    return categories;
  }
  
  /**
   * Find tools that match a specific pattern or keyword
   */
  static findToolsByKeyword(tools: MCPTool[], keyword: string): MCPTool[] {
    const lowerKeyword = keyword.toLowerCase();
    return tools.filter(tool => 
      tool.name.toLowerCase().includes(lowerKeyword) ||
      tool.description.toLowerCase().includes(lowerKeyword)
    );
  }
  
  /**
   * Get CRUD operations for a specific entity
   */
  static getCRUDOperations(tools: MCPTool[], entity: string): MCPTool[] {
    const crudPatterns = ['create', 'get', 'update', 'delete', 'list'];
    const entityPattern = entity.toLowerCase();
    
    return tools.filter(tool => {
      const toolName = tool.name.toLowerCase();
      return toolName.includes(entityPattern) && 
             crudPatterns.some(pattern => toolName.includes(pattern));
    });
  }

  /**
   * Get tools with enhanced context for LLM planning
   */
  static getToolsWithContext(tools: MCPTool[]): string {
    const categories = this.getToolsByCategory(tools);
    let context = 'Available Tools with Context:\n\n';
    
    for (const [category, categoryTools] of Object.entries(categories)) {
      context += `${category.toUpperCase()}:\n`;
      context += `  Description: ${this.getCategoryDescription(category)}\n`;
      context += `  Common Usage: ${this.getCategoryUsagePattern(category)}\n`;
      context += `  Tools:\n`;
      
      categoryTools.forEach(tool => {
        context += `    - ${tool.name}: ${tool.description}\n`;
        context += `      Required: ${tool.inputSchema.required?.join(', ') || 'none'}\n`;
        context += `      Optional: ${Object.keys(tool.inputSchema.properties).filter(p => !tool.inputSchema.required?.includes(p)).join(', ') || 'none'}\n`;
      });
      
      context += '\n';
    }
    
    return context;
  }

  /**
   * Get category description
   */
  private static getCategoryDescription(category: string): string {
    const descriptions: Record<string, string> = {
      'clients': 'Client management - are groups of facilities under a name',
      'facilities': 'Facility management - physical locations for waste processing',
      'shipments': 'Shipment tracking - onsite waste processing records',
      'contaminants': 'Contaminant tracking - harmful substances found in shipments',
      'inspections': 'Inspection records - quality control and compliance checks on shipments',
      'contracts': 'Contract management - declared waste types and quantities for a waste generator',
      'waste_codes': 'Waste code classifications - standardized waste categorization',
      'waste_generators': 'Waste generator records - entities producing waste',
      'waste_properties': 'Waste property details - physical and chemical properties related to waste codes',
      'bunkers': 'Bunker management - pictures taken of bunkers during shipments'
    };
    
    return descriptions[category] || 'Entity management operations';
  }

  /**
   * Get category usage patterns
   */
  private static getCategoryUsagePattern(category: string): string {
    const patterns: Record<string, string> = {
      'clients': 'list → get → create/update/delete',
      'facilities': 'list → get → create/update/delete',
      'shipments': 'list → get → create/update/delete (often filtered by facility_id, client_id)',
      'contaminants': 'list → get → create/update/delete (often linked to shipments)',
      'inspections': 'list → get → create/update/delete (requires shipment_id, facility_id)',
      'contracts': 'list → get → create/update/delete (linked to clients)',
      'waste_codes': 'list → get → create/update/delete (reference data)',
      'waste_generators': 'list → get → create/update/delete (linked to clients and contracts)',
      'waste_properties': 'list → get → create/update/delete (linked to waste_codes)',
      'bunkers': 'list → get → create/update/delete (requires facility_id)'
    };
    
    return patterns[category] || 'Standard CRUD operations';
  }

  /**
   * Get data flow relationships between tools
   */
  static getDataFlowRelationships(tools: MCPTool[]): Record<string, string[]> {
    const relationships: Record<string, string[]> = {};
    
    tools.forEach(tool => {
      const toolName = tool.name;
      const dependencies: string[] = [];
      
      // Analyze required parameters to find dependencies
      if (tool.inputSchema.required) {
        tool.inputSchema.required.forEach(param => {
          if (param.endsWith('_id')) {
            const entity = param.replace('_id', '');
            const sourceTool = `${entity}s_list`;
            if (tools.some(t => t.name === sourceTool)) {
              dependencies.push(sourceTool);
            }
          }
        });
      }
      
      relationships[toolName] = dependencies;
    });
    
    return relationships;
  }

  /**
   * Get tools formatted for LLM with enhanced context
   */
  static formatToolsForLLMWithContext(tools: MCPTool[]): string {
    const context = this.getToolsWithContext(tools);
    const relationships = this.getDataFlowRelationships(tools);
    
    let result = context + '\nData Flow Relationships:\n';
    for (const [tool, deps] of Object.entries(relationships)) {
      if (deps.length > 0) {
        result += `  ${tool} depends on: ${deps.join(', ')}\n`;
      }
    }
    
    return result;
  }

  /**
   * Find tools that can provide data for a given parameter
   */
  static findToolsForParameter(tools: MCPTool[], parameter: string): MCPTool[] {
    const entity = parameter.replace('_id', '');
    const listTool = `${entity}s_list`;
    const getTool = `${entity}s_get`;
    
    return tools.filter(tool => 
      tool.name === listTool || tool.name === getTool
    );
  }

  /**
   * Get parameter examples for a tool
   */
  static getParameterExamples(tool: MCPTool): Record<string, any> {
    const examples: Record<string, any> = {};
    
    if (tool.inputSchema.properties) {
      for (const [param, schema] of Object.entries(tool.inputSchema.properties)) {
        if (param === 'page') {
          examples[param] = 1;
        } else if (param === 'limit') {
          examples[param] = 50;
        } else if (param.endsWith('_id')) {
          examples[param] = '${step_0.result.items[0].id}';
        } else if (param.includes('date')) {
          examples[param] = '2024-01-01T00:00:00.000Z';
        } else if (param === 'status') {
          examples[param] = 'active';
        } else if (param === 'name') {
          examples[param] = 'Example Name';
        } else if (typeof schema === 'object' && 'type' in schema) {
          switch (schema.type) {
            case 'string':
              examples[param] = 'example_value';
              break;
            case 'number':
              examples[param] = 1;
              break;
            case 'boolean':
              examples[param] = true;
              break;
            case 'array':
              examples[param] = [];
              break;
            case 'object':
              examples[param] = {};
              break;
          }
        }
      }
    }
    
    return examples;
  }

  /**
   * Get lightweight category metadata with dependencies for Stage 1
   */
  static getCategoryMetadata(): string {
    const categories = [
      { name: 'clients', desc: 'Client management - are groups of facilities under a name', deps: [] },
      { name: 'facilities', desc: 'Facility management - physical locations for waste processing', deps: [] },
      { name: 'shipments', desc: 'Shipment tracking - onsite waste processing records', deps: ['facilities', 'clients'] },
      { name: 'contaminants', desc: 'Contaminant tracking - harmful substances found in shipments', deps: ['shipments', 'facilities'] },
      { name: 'inspections', desc: 'Inspection records - quality control and compliance checks on shipments', deps: ['facilities', 'shipments'] },
      { name: 'contracts', desc: 'Contract management - declared waste types and quantities for a waste generator', deps: ['clients'] },
      { name: 'waste_codes', desc: 'Waste code classifications - standardized waste categorization for waste properties', deps: [] },
      { name: 'waste_generators', desc: 'Waste generator records - entities producing waste and contracts', deps: ['clients', 'contracts'] },
      { name: 'shipment_waste_compositions', desc: 'Waste composition data for shipments - detailed analysis of waste types and quantities', deps: ['shipments', 'waste_codes'] },
      { name: 'waste_properties', desc: 'Waste property details - physical and chemical properties related to waste codes', deps: ['waste_codes'] },
      { name: 'bunkers', desc: 'Bunker management - pictures taken of bunkers during shipments', deps: ['facilities'] }
    ];

    let result = 'Available Categories:\n';
    categories.forEach(cat => {
      result += `- ${cat.name}: ${cat.desc}`;
      if (cat.deps.length > 0) {
        result += ` (depends on: ${cat.deps.join(', ')})`;
      }
      result += '\n';
    });

    return result;
  }

  /**
   * Get tools filtered by specific categories
   */
  static getToolsByCategories(tools: MCPTool[], categories: string[]): MCPTool[] {
    return tools.filter(tool => {
      const toolCategory = tool.name.split('_')[0];
      return categories.includes(toolCategory);
    });
  }

  /**
   * Expand categories with their dependencies recursively
   */
  static expandCategoriesWithDependencies(selectedCategories: string[]): string[] {
    const categoryDeps: Record<string, string[]> = {
      'clients': [],
      'facilities': [],
      'shipments': ['facilities', 'clients'],
      'contaminants': ['shipments'],
      'inspections': ['shipments', 'facilities'],
      'contracts': ['clients'],
      'waste_codes': [],
      'waste_generators': ['clients'],
      'shipment_waste_compositions': ['shipments', 'waste_codes'],
      'waste_properties': ['waste_codes'],
      'bunkers': ['facilities']
    };

    const expanded = new Set<string>();
    const toProcess = [...selectedCategories];

    while (toProcess.length > 0) {
      const category = toProcess.pop()!;
      if (expanded.has(category)) continue;

      expanded.add(category);
      const deps = categoryDeps[category] || [];
      deps.forEach(dep => {
        if (!expanded.has(dep)) {
          toProcess.push(dep);
        }
      });
    }

    return Array.from(expanded);
  }

  /**
   * Format tools in compact JSON format for Groq (Stage 2)
   */
  static formatToolsCompact(tools: MCPTool[]): string {
    const relationships = this.getDataFlowRelationships(tools);
    const compactTools: Record<string, any> = {};

    tools.forEach(tool => {
      const required = tool.inputSchema.required || [];
      const optional = Object.keys(tool.inputSchema.properties).filter(p => !required.includes(p));
      const deps = relationships[tool.name] || [];

      compactTools[tool.name] = {
        desc: tool.description,
        req: required,
        opt: optional,
        deps: deps
      };
    });

    return JSON.stringify(compactTools, null, 0);
  }
}
