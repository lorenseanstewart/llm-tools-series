import { MCPTool, MCPToolCallRequest, MCPToolCallResponse, MCPServerInfo } from '@llm-tools/shared-types';
export interface MCPClientOptions {
    baseURL: string;
    timeout?: number;
    retries?: number;
    authToken?: string;
}
export declare class MCPClient {
    private readonly http;
    private readonly retries;
    private authToken?;
    constructor(options: MCPClientOptions);
    /**
     * Set or update the authentication token
     */
    setAuthToken(token: string): void;
    /**
     * Discover available tools from the MCP server
     */
    discoverTools(): Promise<MCPTool[]>;
    /**
     * Get server information
     */
    getServerInfo(): Promise<MCPServerInfo>;
    /**
     * Execute a tool call on the MCP server
     */
    callTool(request: MCPToolCallRequest): Promise<MCPToolCallResponse>;
    /**
     * Check if the MCP server is healthy
     */
    healthCheck(): Promise<boolean>;
}
