// MCP (Model Context Protocol) types

export interface MCPTool {
  name: string;
  description: string;
  inputSchema: Record<string, any>;
}

export interface MCPToolCallRequest {
  name: string;
  arguments: any;
}

export interface MCPToolCallResponse {
  result?: any;
  error?: string;
}

export interface MCPServerInfo {
  name: string;
  version: string;
  tools: MCPTool[];
}