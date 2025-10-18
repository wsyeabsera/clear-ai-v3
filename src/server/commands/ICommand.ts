// Command Pattern Interface for MCP Tool Execution

export interface ICommand {
  execute(params: any): Promise<any>;
}

export interface CommandResult {
  success: boolean;
  data?: any;
  error?: string;
  message?: string;
  meta?: {
    total?: number;
    page?: number;
    limit?: number;
    totalPages?: number;
  };
}
