import { MCPClient } from './MCPClient';

export class DynamicToolExecutor {
  private mcpClient: MCPClient;

  constructor(mcpClient: MCPClient) {
    this.mcpClient = mcpClient;
  }

  async executeTool(toolName: string, params: any): Promise<any> {
    try {
      console.log(`[DynamicToolExecutor] Executing tool: ${toolName}`);
      console.log(`[DynamicToolExecutor] Parameters:`, JSON.stringify(params, null, 2));

      // Call the tool via MCP client
      const result = await this.mcpClient.callTool(toolName, params);

      console.log(`[DynamicToolExecutor] Tool result:`, JSON.stringify(result, null, 2));

      // Parse the text content from MCP response
      if (result.content && result.content[0] && result.content[0].text) {
        const parsedResult = JSON.parse(result.content[0].text);
        return {
          success: parsedResult.success,
          data: parsedResult.data,
          error: parsedResult.error,
          message: parsedResult.message,
          meta: parsedResult.meta,
        };
      }

      return result;
    } catch (error: any) {
      console.error(`[DynamicToolExecutor] Error executing tool:`, error);
      return {
        success: false,
        error: error.message,
      };
    }
  }

  async listAvailableTools(): Promise<any> {
    try {
      console.log(`[DynamicToolExecutor] Requesting tools list...`);
      const result = await this.mcpClient.listTools();
      console.log(`[DynamicToolExecutor] Raw MCP response:`, JSON.stringify(result, null, 2));
      
      // The MCP response structure is { tools: [...] }
      if (result && result.tools) {
        return result.tools;
      }
      
      // If tools is not in the expected location, try to find it
      if (result && Array.isArray(result)) {
        return result;
      }
      
      console.log(`[DynamicToolExecutor] Unexpected response structure:`, result);
      return [];
    } catch (error: any) {
      console.error(`[DynamicToolExecutor] Error listing tools:`, error);
      return [];
    }
  }
}
