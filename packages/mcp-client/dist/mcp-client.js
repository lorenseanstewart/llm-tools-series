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
        this.authToken = options.authToken;
        this.http = axios_1.default.create({
            baseURL: options.baseURL,
            timeout: options.timeout || 10000,
            headers: {
                'Content-Type': 'application/json',
            },
        });
        // Add request interceptor to add auth header
        this.http.interceptors.request.use((config) => {
            if (this.authToken) {
                config.headers.Authorization = `Bearer ${this.authToken}`;
            }
            return config;
        });
    }
    /**
     * Set or update the authentication token
     */
    setAuthToken(token) {
        this.authToken = token;
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
            if (error.response) {
                // The request was made and the server responded with a status code
                // that falls out of the range of 2xx
                throw new Error(`Failed to discover tools: ${error.response.status} ${error.response.statusText} - ${error.response.data?.error || 'Unknown error'}`);
            }
            else if (error.request) {
                // The request was made but no response was received
                throw new Error(`Failed to discover tools: No response from server`);
            }
            else {
                // Something happened in setting up the request that triggered an Error
                throw new Error(`Failed to discover tools: ${error.message}`);
            }
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
            if (error.response) {
                throw new Error(`Failed to get server info: ${error.response.status} ${error.response.statusText}`);
            }
            else if (error.request) {
                throw new Error(`Failed to get server info: No response from server`);
            }
            else {
                throw new Error(`Failed to get server info: ${error.message}`);
            }
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
                if (error.response) {
                    lastError = new Error(`${error.response.status} ${error.response.statusText}`);
                }
                else if (error.request) {
                    lastError = new Error('No response from server');
                }
                else {
                    lastError = error instanceof Error ? error : new Error(String(error));
                }
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
