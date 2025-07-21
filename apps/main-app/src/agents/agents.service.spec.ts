import { Test, TestingModule } from "@nestjs/testing";
import { ConfigService } from "@nestjs/config";
import { Logger } from "@nestjs/common";
import { AgentsService } from "./agents.service";
import { ChatHistoryService } from "./chat-history.service";
import { StreamingService } from "./streaming.service";
import { MCPClient } from "@llm-tools/mcp-client";
import axios from "axios";

// Mock dependencies
jest.mock("axios");
jest.mock("@llm-tools/mcp-client");

const mockedAxios = axios as jest.Mocked<typeof axios>;

describe("AgentsService", () => {
  let service: AgentsService;
  let chatHistoryService: ChatHistoryService;
  let streamingService: StreamingService;
  let mockMCPClient: jest.Mocked<MCPClient>;

  const mockTools = [
    {
      type: 'function' as const,
      function: {
        name: 'findListings',
        description: 'Find property listings',
        parameters: {
          type: 'object',
          properties: {
            city: { type: 'string' }
          }
        }
      }
    }
  ];

  beforeEach(async () => {
    // Disable logging during tests
    jest.spyOn(Logger.prototype, 'log').mockImplementation();
    jest.spyOn(Logger.prototype, 'error').mockImplementation();
    jest.spyOn(Logger.prototype, 'warn').mockImplementation();
    
    // Create mock MCP client
    mockMCPClient = {
      discoverTools: jest.fn().mockResolvedValue([
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
      ]),
      callTool: jest.fn(),
      healthCheck: jest.fn().mockResolvedValue(true),
      setAuthToken: jest.fn()
    } as any;

    // Mock the MCPClient constructor
    (MCPClient as jest.MockedClass<typeof MCPClient>).mockImplementation(() => mockMCPClient);

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AgentsService,
        ChatHistoryService,
        {
          provide: StreamingService,
          useValue: {
            streamResponse: jest.fn().mockResolvedValue('Mocked response'),
            sendStatusEvent: jest.fn(),
            sendHeartbeat: jest.fn(),
            sendToolExecutionEvent: jest.fn()
          }
        },
        {
          provide: ConfigService,
          useValue: {
            get: jest.fn((key: string) => {
              const config = {
                'OPENROUTER_API_KEY': 'test-api-key',
                'YOUR_SITE_URL': 'http://localhost:3000',
                'MCP_LISTINGS_URL': 'http://localhost:3001',
                'MCP_ANALYTICS_URL': 'http://localhost:3002',
                'JWT_SECRET': 'test-jwt-secret'
              };
              return config[key];
            })
          }
        }
      ]
    }).compile();

    service = module.get<AgentsService>(AgentsService);
    chatHistoryService = module.get<ChatHistoryService>(ChatHistoryService);
    streamingService = module.get<StreamingService>(StreamingService);

    // Initialize the service (normally done by NestJS lifecycle)
    await service.onModuleInit();
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe("onModuleInit", () => {
    it("should discover tools from all MCP servers", async () => {
      expect(mockMCPClient.discoverTools).toHaveBeenCalledTimes(2); // Called for each MCP server
      // Note: We don't test private properties. The presence of tools is verified through functional tests.
    });

    it("should handle MCP server failures gracefully", async () => {
      // Create a fresh service instance to test initialization
      const freshModule: TestingModule = await Test.createTestingModule({
        providers: [
          AgentsService,
          ChatHistoryService,
          {
            provide: StreamingService,
            useValue: {
              streamResponse: jest.fn().mockResolvedValue('Mocked response'),
              sendStatusEvent: jest.fn(),
              sendHeartbeat: jest.fn(),
              sendToolExecutionEvent: jest.fn()
            }
          },
          {
            provide: ConfigService,
            useValue: {
              get: jest.fn((key: string) => {
                const config = {
                  'OPENROUTER_API_KEY': 'test-api-key',
                  'YOUR_SITE_URL': 'http://localhost:3000',
                  'MCP_LISTINGS_URL': 'http://localhost:3001',
                  'MCP_ANALYTICS_URL': 'http://localhost:3002',
                  'JWT_SECRET': 'test-jwt-secret'
                };
                return config[key];
              })
            }
          }
        ]
      }).compile();

      const freshService = freshModule.get<AgentsService>(AgentsService);
      
      // Mock one server to fail
      mockMCPClient.discoverTools
        .mockResolvedValueOnce([])
        .mockRejectedValueOnce(new Error('Server down'));

      await freshService.onModuleInit();

      // Should have tried both servers (at least 2 calls total)
      expect(mockMCPClient.discoverTools).toHaveBeenCalledTimes(4); // 2 from beforeEach + 2 from fresh service
    });
  });

  describe("chat", () => {
    beforeEach(() => {
      // Mock OpenRouter API responses
      mockedAxios.post.mockImplementation((url: string) => {
        if (url.includes('chat/completions')) {
          // First call: Kimi K2 for tool selection
          if (mockedAxios.post.mock.calls.length === 1) {
            return Promise.resolve({
              data: {
                choices: [{
                  message: {
                    role: 'assistant',
                    content: null,
                    tool_calls: [{
                      id: 'call_123',
                      type: 'function',
                      function: {
                        name: 'findListings',
                        arguments: JSON.stringify({ city: 'Portland' })
                      }
                    }]
                  }
                }]
              }
            });
          }
          // Second call: Gemini for response generation
          return Promise.resolve({
            data: {
              choices: [{
                message: {
                  role: 'assistant',
                  content: 'I found 3 listings in Portland for you.'
                }
              }]
            }
          });
        }
        return Promise.reject(new Error('Unexpected URL'));
      });

      // Mock MCP tool execution
      mockMCPClient.callTool.mockResolvedValue({
        result: [
          {
            listingId: '123',
            address: { street: '123 Main St', city: 'Portland', state: 'OR', zip: '97201' },
            price: 500000,
            bedrooms: 3,
            bathrooms: 2,
            status: 'Active'
          }
        ]
      });
    });

    it("should handle a complete chat interaction with tool calls", async () => {
      const userId = 'test-user-123';
      const userMessage = 'Find me homes in Portland';

      const response = await service.chat(userId, userMessage);

      // Verify chat history was saved
      expect(await chatHistoryService.getChatHistory(userId)).toHaveLength(2); // User + Assistant

      // Verify tool was called via MCP
      expect(mockMCPClient.callTool).toHaveBeenCalledWith({
        name: 'findListings',
        arguments: { city: 'Portland' }
      });

      // Verify response
      expect(response).toBe('I found 3 listings in Portland for you.');

      // Verify OpenRouter was called twice
      expect(mockedAxios.post).toHaveBeenCalledTimes(2);
    });

    it("should include chat history in context", async () => {
      const userId = 'test-user-123';
      
      // Add some history
      await chatHistoryService.saveChatMessage(userId, {
        role: 'user',
        content: 'My budget is $500k'
      });
      await chatHistoryService.saveChatMessage(userId, {
        role: 'assistant',
        content: 'I understand your budget is $500,000.'
      });

      await service.chat(userId, 'Find homes in Portland');

      // Verify first OpenRouter call included history
      const firstCall = mockedAxios.post.mock.calls[0];
      expect(firstCall[1].messages).toContainEqual({
        role: 'user',
        content: 'My budget is $500k'
      });
      expect(firstCall[1].messages).toContainEqual({
        role: 'assistant',
        content: 'I understand your budget is $500,000.'
      });
    });

    it("should handle tool execution failures gracefully", async () => {
      mockMCPClient.callTool.mockRejectedValueOnce(new Error('MCP server error'));

      const response = await service.chat('test-user', 'Find homes');

      // Should still generate a response even if tool fails
      expect(response).toBe('I found 3 listings in Portland for you.');
      expect(mockMCPClient.callTool).toHaveBeenCalled();
    });

    it("should handle messages without tool calls", async () => {
      // Override mock to return no tool calls
      mockedAxios.post.mockReset();
      mockedAxios.post.mockResolvedValue({
        data: {
          choices: [{
            message: {
              role: 'assistant',
              content: 'I can help you find homes. What city are you interested in?'
            }
          }]
        }
      });

      const response = await service.chat('test-user', 'Can you help me?');

      expect(response).toBe('I can help you find homes. What city are you interested in?');
      expect(mockMCPClient.callTool).not.toHaveBeenCalled();
    });
  });

  describe("error handling", () => {
    it("should handle OpenRouter API failures", async () => {
      mockedAxios.post.mockRejectedValueOnce(new Error('API rate limit exceeded'));

      const response = await service.chat('test-user', 'Find homes');
      expect(response).toBe('Sorry, I encountered an error. Please try again.');
    });

    it("should handle malformed tool call responses", async () => {
      mockedAxios.post.mockResolvedValueOnce({
        data: {
          choices: [{
            message: {
              role: 'assistant',
              content: null,
              tool_calls: [{
                id: 'call_123',
                type: 'function',
                function: {
                  name: 'findListings',
                  arguments: 'invalid-json'
                }
              }]
            }
          }]
        }
      });

      const response = await service.chat('test-user', 'Find homes');
      
      // Should handle gracefully
      expect(response).toContain('error');
    });
  });

  describe("MCP Client Integration", () => {
    it("should execute tools through MCP client", async () => {
      const toolCall = {
        name: 'findListings',
        arguments: { city: 'Seattle', maxPrice: 1000000 }
      };

      mockMCPClient.callTool.mockResolvedValueOnce({ result: 'success' });

      const result = await service['executeTool']({ 
        id: 'call_123',
        type: 'function',
        function: {
          name: 'findListings',
          arguments: JSON.stringify(toolCall.arguments)
        }
      });

      expect(mockMCPClient.callTool).toHaveBeenCalledWith(toolCall);
      expect(result).toBe('success');
    });

    it("should try multiple MCP servers on failure", async () => {
      // First server fails, second succeeds
      mockMCPClient.callTool
        .mockRejectedValueOnce(new Error('Server 1 down'))
        .mockResolvedValueOnce({ result: 'Success from server 2' });

      const result = await service['executeTool']({
        id: 'call_123',
        type: 'function',
        function: {
          name: 'findListings',
          arguments: '{}'
        }
      });

      expect(mockMCPClient.callTool).toHaveBeenCalledTimes(2);
      expect(result).toEqual('Success from server 2');
    });
  });

  describe("SSE Streaming", () => {
    it("should call streaming service for chat stream", async () => {
      const userId = 'test-user';
      const userMessage = 'Find me homes in Portland';
      const mockResponse = {
        raw: {
          write: jest.fn(),
          end: jest.fn(),
          on: jest.fn()
        }
      } as any;

      mockMCPClient.callTool.mockResolvedValue({ result: [] });

      await service.chatStream(userId, userMessage, mockResponse);

      // Verify streaming service methods were called
      expect(streamingService.sendStatusEvent).toHaveBeenCalled();
      expect(streamingService.sendHeartbeat).toHaveBeenCalled();
    });

    it("should handle tool execution with streaming events", async () => {
      const userId = 'test-user';
      const userMessage = 'Find homes in Seattle';
      const mockResponse = {
        raw: {
          write: jest.fn(),
          end: jest.fn(),
          on: jest.fn()
        }
      } as any;

      // Mock OpenRouter to return tool calls
      mockedAxios.post.mockResolvedValueOnce({
        data: {
          choices: [{
            message: {
              role: 'assistant',
              content: null,
              tool_calls: [{
                id: 'call_123',
                type: 'function',
                function: {
                  name: 'findListings',
                  arguments: JSON.stringify({ city: 'Seattle' })
                }
              }]
            }
          }]
        }
      });

      mockMCPClient.callTool.mockResolvedValue({ 
        result: [{ listingId: 'L001', address: { city: 'Seattle' } }] 
      });

      await service.chatStream(userId, userMessage, mockResponse);

      // Verify tool execution events were sent
      expect(streamingService.sendToolExecutionEvent).toHaveBeenCalledWith(
        expect.anything(),
        'findListings',
        'starting'
      );
      expect(streamingService.sendToolExecutionEvent).toHaveBeenCalledWith(
        expect.anything(),
        'findListings',
        'completed',
        [{ listingId: 'L001', address: { city: 'Seattle' } }]
      );
    });

    it("should handle streaming errors gracefully", async () => {
      const userId = 'test-user';
      const userMessage = 'Test message';
      const mockResponse = {
        raw: {
          write: jest.fn(),
          end: jest.fn(),
          on: jest.fn()
        }
      } as any;

      // Mock a streaming error
      mockedAxios.post.mockRejectedValue(new Error('Streaming failed'));

      await service.chatStream(userId, userMessage, mockResponse);

      // Verify error was handled gracefully (no exception thrown)
      expect(mockResponse.raw.write).toHaveBeenCalledWith(
        expect.stringContaining('error')
      );
    });
  });
});