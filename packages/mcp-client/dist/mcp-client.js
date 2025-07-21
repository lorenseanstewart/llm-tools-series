"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.MCPClient = void 0;
const axios_1 = __importDefault(require("axios"));
class MCPClient {
    constructor(options) {
        this.retries = options.retries || 3;
        this.http = axios_1.default.create({
            baseURL: options.baseURL,
            timeout: options.timeout || 10000,
            headers: {
                'Content-Type': 'application/json',
            },
        });
    }
    /**
     * Discover available tools from the MCP server
     */
    async discoverTools() {
        try {
            const response = await this.http.get('/tools');
            return response.data;
        }
        catch (error) {
            throw new Error(`Failed to discover tools: ${error instanceof Error ? error.message : String(error)}`);
        }
    }
    /**
     * Get server information
     */
    async getServerInfo() {
        try {
            const response = await this.http.get('/info');
            return response.data;
        }
        catch (error) {
            throw new Error(`Failed to get server info: ${error instanceof Error ? error.message : String(error)}`);
        }
    }
    /**
     * Execute a tool call on the MCP server
     */
    async callTool(request) {
        let lastError = null;
        for (let attempt = 1; attempt <= this.retries; attempt++) {
            try {
                const response = await this.http.post('/tools/call', request);
                return response.data;
            }
            catch (error) {
                lastError = error instanceof Error ? error : new Error(String(error));
                if (attempt === this.retries) {
                    break;
                }
                // Exponential backoff
                const delay = Math.pow(2, attempt - 1) * 1000;
                await new Promise(resolve => setTimeout(resolve, delay));
            }
        }
        throw new Error(`Failed to call tool after ${this.retries} attempts: ${lastError?.message || 'Unknown error'}`);
    }
    /**
     * Check if the MCP server is healthy
     */
    async healthCheck() {
        try {
            const response = await this.http.get('/health');
            return response.status === 200;
        }
        catch (error) {
            return false;
        }
    }
}
exports.MCPClient = MCPClient;
