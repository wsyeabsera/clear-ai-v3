import { spawn, ChildProcess } from 'child_process';
import { MCPRequest, MCPResponse } from '../types/mcp';

export class MCPClient {
  private process: ChildProcess | null = null;
  private requestId = 0;
  private pendingRequests: Map<number, {
    resolve: (value: any) => void;
    reject: (error: any) => void;
  }> = new Map();
  private buffer = '';

  async connect(serverPath: string): Promise<void> {
    return new Promise((resolve, reject) => {
      try {
        // Spawn the MCP server process - use ts-node for TypeScript files
        const isTypeScript = serverPath.endsWith('.ts');
        const command = isTypeScript ? 'ts-node' : 'node';
        const args = isTypeScript ? [serverPath] : [serverPath];
        
        this.process = spawn(command, args, {
          stdio: ['pipe', 'pipe', 'pipe'],
        });

        if (!this.process.stdout || !this.process.stdin) {
          reject(new Error('Failed to create process stdio streams'));
          return;
        }

        // Handle stdout (responses from server)
        this.process.stdout.setEncoding('utf8');
        this.process.stdout.on('data', (chunk: string) => {
          this.handleResponse(chunk);
        });

        // Handle stderr (logs from server) - but filter out non-JSON content
        this.process.stderr?.setEncoding('utf8');
        this.process.stderr?.on('data', (chunk: string) => {
          // Only log if it looks like a log message, not JSON
          if (!chunk.trim().startsWith('{') && !chunk.trim().startsWith('[')) {
            console.error('[MCP Client] Server log:', chunk.trim());
          }
        });

        // Handle process errors
        this.process.on('error', (error) => {
          console.error('[MCP Client] Process error:', error);
          reject(error);
        });

        // Handle process exit
        this.process.on('exit', (code) => {
          console.log(`[MCP Client] Server process exited with code ${code}`);
        });

        // Wait a bit for the server to start
        setTimeout(() => resolve(), 1000);
      } catch (error) {
        reject(error);
      }
    });
  }

  private handleResponse(chunk: string) {
    this.buffer += chunk;
    
    // Process complete JSON objects
    const lines = this.buffer.split('\n');
    this.buffer = lines.pop() || '';
    
    for (const line of lines) {
      if (line.trim()) {
        try {
          const response: MCPResponse = JSON.parse(line);
          this.processResponse(response);
        } catch (error) {
          console.error('[MCP Client] Error parsing response:', error);
        }
      }
    }
  }

  private processResponse(response: MCPResponse) {
    const pending = this.pendingRequests.get(response.id as number);
    
    if (pending) {
      this.pendingRequests.delete(response.id as number);
      
      if (response.error) {
        pending.reject(new Error(response.error.message));
      } else {
        pending.resolve(response.result);
      }
    }
  }

  async sendRequest(method: string, params?: any): Promise<any> {
    if (!this.process || !this.process.stdin) {
      throw new Error('MCP client not connected');
    }

    return new Promise((resolve, reject) => {
      const id = ++this.requestId;
      
      const request: MCPRequest = {
        jsonrpc: '2.0',
        id,
        method,
        params,
      };

      this.pendingRequests.set(id, { resolve, reject });

      // Send request to server
      this.process!.stdin!.write(JSON.stringify(request) + '\n');

      // Timeout after 30 seconds
      setTimeout(() => {
        if (this.pendingRequests.has(id)) {
          this.pendingRequests.delete(id);
          reject(new Error('Request timeout'));
        }
      }, 30000);
    });
  }

  async listTools(): Promise<any> {
    return this.sendRequest('tools/list');
  }

  async callTool(name: string, args: any): Promise<any> {
    return this.sendRequest('tools/call', {
      name,
      arguments: args,
    });
  }

  async disconnect(): Promise<void> {
    if (this.process) {
      this.process.kill();
      this.process = null;
    }
  }
}
