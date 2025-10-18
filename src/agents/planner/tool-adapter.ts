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
}
