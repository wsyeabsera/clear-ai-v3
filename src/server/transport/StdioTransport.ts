import { MCPRequest, MCPResponse, MCP_METHODS } from '../../types/mcp';
import { ToolRegistry } from '../tools/ToolRegistry';
import { CommandFactory } from '../commands/CommandFactory';

export class StdioTransport {
  private requestId = 0;

  start() {
    console.error('[MCP Server] Starting stdio transport...');
    
    // Listen to stdin for JSON-RPC requests
    process.stdin.setEncoding('utf8');
    
    let buffer = '';
    
    process.stdin.on('data', (chunk: string) => {
      buffer += chunk;
      
      // Process complete JSON objects
      const lines = buffer.split('\n');
      buffer = lines.pop() || '';
      
      for (const line of lines) {
        if (line.trim()) {
          try {
            const request: MCPRequest = JSON.parse(line);
            this.handleRequest(request);
          } catch (error) {
            console.error('[MCP Server] Error parsing request:', error);
          }
        }
      }
    });

    process.stdin.on('end', () => {
      console.error('[MCP Server] Stdin closed, exiting...');
      process.exit(0);
    });

    console.error('[MCP Server] Listening for requests on stdin');
  }

  private async handleRequest(request: MCPRequest) {
    console.error(`[MCP Server] Received request: ${request.method}`);
    
    try {
      let result: any;

      switch (request.method) {
        case MCP_METHODS.LIST_TOOLS:
          result = await this.handleListTools();
          break;
        
        case MCP_METHODS.CALL_TOOL:
          result = await this.handleCallTool(request.params);
          break;
        
        default:
          this.sendError(request.id, -32601, `Method not found: ${request.method}`);
          return;
      }

      this.sendResponse(request.id, result);
    } catch (error: any) {
      console.error('[MCP Server] Error handling request:', error);
      this.sendError(request.id, -32603, error.message);
    }
  }

  private async handleListTools() {
    const tools = ToolRegistry.getAllTools();
    return {
      tools: tools.map(tool => ({
        name: tool.name,
        description: tool.description,
        inputSchema: tool.inputSchema,
      })),
    };
  }

  private async handleCallTool(params: any) {
    if (!params || !params.name) {
      throw new Error('Tool name is required');
    }

    const toolName = params.name;
    const toolArgs = params.arguments || {};

    console.error(`[MCP Server] Calling tool: ${toolName}`);

    // Execute the command
    const result = await CommandFactory.executeCommand(toolName, toolArgs);

    // Format response according to MCP protocol
    return {
      content: [
        {
          type: 'text',
          text: JSON.stringify(result, null, 2),
        },
      ],
      isError: !result.success,
    };
  }

  private sendResponse(id: string | number, result: any) {
    const response: MCPResponse = {
      jsonrpc: '2.0',
      id,
      result,
    };
    
    process.stdout.write(JSON.stringify(response) + '\n');
    console.error(`[MCP Server] Sent response for request ${id}`);
  }

  private sendError(id: string | number, code: number, message: string) {
    const response: MCPResponse = {
      jsonrpc: '2.0',
      id,
      error: {
        code,
        message,
      },
    };
    
    process.stdout.write(JSON.stringify(response) + '\n');
    console.error(`[MCP Server] Sent error response for request ${id}: ${message}`);
  }
}
