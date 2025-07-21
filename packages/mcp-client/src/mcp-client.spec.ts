import { MCPClient } from './mcp-client';
import type { MCPTool, MCPToolCallRequest, MCPToolCallResponse } from '@llm-tools/shared-types';

// Mock axios
const mockAxiosInstance = {
  get: jest.fn(),
  post: jest.fn()
};

jest.mock('axios', () => ({
  create: jest.fn(() => mockAxiosInstance),
  get: jest.fn(),
  post: jest.fn()
}));

// Mock setTimeout globally to avoid delays in tests
global.setTimeout = jest.fn((callback) => {
  callback();
}) as any;

describe('MCPClient', () => {
  let client: MCPClient;
  const baseURL = 'http://localhost:3001';

  beforeEach(() => {
    client = new MCPClient({ baseURL, timeout: 5000, retries: 3 });
    jest.clearAllMocks();
  });

  afterEach(() => {
    jest.clearAllTimers();
  });

  describe('discoverTools', () => {
    it('should fetch and return tools from the MCP server', async () => {
      const mockTools: MCPTool[] = [
        {
          name: 'findListings',
          description: 'Find property listings',
          inputSchema: {
            type: 'object',
            properties: {
              city: { type: 'string' }
            }
          }
        }
      ];

      mockAxiosInstance.get.mockResolvedValueOnce({ data: mockTools });

      const tools = await client.discoverTools();

      expect(mockAxiosInstance.get).toHaveBeenCalledWith('/tools');
      expect(tools).toEqual(mockTools);
    });

    it('should handle discovery errors gracefully', async () => {
      mockAxiosInstance.get.mockRejectedValueOnce(new Error('Network error'));

      await expect(client.discoverTools()).rejects.toThrow('Failed to discover tools');
      expect(mockAxiosInstance.get).toHaveBeenCalledTimes(1);
    });
  });

  describe('callTool', () => {
    it('should execute a tool call successfully', async () => {
      const request: MCPToolCallRequest = {
        name: 'findListings',
        arguments: { city: 'Portland' }
      };

      const mockResponse: MCPToolCallResponse = {
        result: [
          {
            listingId: '123',
            address: {
              street: '123 Main St',
              city: 'Portland',
              state: 'OR',
              zip: '97201'
            },
            price: 500000,
            bedrooms: 3,
            bathrooms: 2,
            status: 'Active'
          }
        ]
      };

      mockAxiosInstance.post.mockResolvedValueOnce({ data: mockResponse });

      const result = await client.callTool(request);

      expect(mockAxiosInstance.post).toHaveBeenCalledWith('/tools/call', request);
      expect(result).toEqual(mockResponse);
    });

    it('should retry on failure', async () => {
      const request: MCPToolCallRequest = {
        name: 'findListings',
        arguments: { city: 'Portland' }
      };

      // Fail twice, then succeed
      mockAxiosInstance.post
        .mockRejectedValueOnce(new Error('Temporary failure'))
        .mockRejectedValueOnce(new Error('Another temporary failure'))
        .mockResolvedValueOnce({ data: { result: [] } });

      const result = await client.callTool(request);

      expect(mockAxiosInstance.post).toHaveBeenCalledTimes(3);
      expect(result).toEqual({ result: [] });
    });

    it('should fail after max retries', async () => {
      const request: MCPToolCallRequest = {
        name: 'findListings',
        arguments: { city: 'Portland' }
      };

      mockAxiosInstance.post.mockRejectedValue(new Error('Persistent failure'));

      await expect(client.callTool(request)).rejects.toThrow('Failed to call tool after 3 attempts');
      expect(mockAxiosInstance.post).toHaveBeenCalledTimes(3);
    });
  });

  describe('healthCheck', () => {
    it('should return true when server is healthy', async () => {
      mockAxiosInstance.get.mockResolvedValueOnce({ 
        status: 200,
        data: { status: 'ok', timestamp: new Date().toISOString() } 
      });

      const isHealthy = await client.healthCheck();

      expect(mockAxiosInstance.get).toHaveBeenCalledWith('/health');
      expect(isHealthy).toBe(true);
    });

    it('should return false when server is unhealthy', async () => {
      mockAxiosInstance.get.mockRejectedValueOnce(new Error('Server down'));

      const isHealthy = await client.healthCheck();

      expect(isHealthy).toBe(false);
    });
  });
});