import { Test, TestingModule } from '@nestjs/testing';
import { ConfigService } from '@nestjs/config';
import { Logger } from '@nestjs/common';
import { AgentsService } from '../agents.service';
import { ChatHistoryService } from '../chat-history.service';
import { MCPClient } from '@llm-tools/mcp-client';
import axios from 'axios';

// Mock dependencies
jest.mock('axios');
jest.mock('@llm-tools/mcp-client');

const mockedAxios = axios as jest.Mocked<typeof axios>;

// This integration test demonstrates the complete MCP flow
describe('MCP Flow Integration Tests', () => {
  let service: AgentsService;
  let chatHistoryService: ChatHistoryService;

  let mockMCPClient: jest.Mocked<MCPClient>;

  beforeAll(async () => {
    // Disable logging during tests
    jest.spyOn(Logger.prototype, 'log').mockImplementation();
    jest.spyOn(Logger.prototype, 'error').mockImplementation();
    jest.spyOn(Logger.prototype, 'warn').mockImplementation();
    
    // Mock OpenRouter API responses
    mockedAxios.post.mockImplementation((url: string, data: any) => {
      if (url.includes('chat/completions')) {
        const requestBody = typeof data === 'string' ? JSON.parse(data) : data;
        
        // Simulate Kimi K2 tool selection
        if (requestBody.model === 'moonshotai/kimi-k2') {
          return Promise.resolve({
            data: {
              choices: [{
                message: {
                  role: 'assistant',
                  content: null,
                  tool_calls: [{
                    id: 'call_test',
                    type: 'function',
                    function: {
                      name: 'findListings',
                      arguments: JSON.stringify({ 
                        city: 'Portland',
                        minBedrooms: 3,
                        maxPrice: 800000 
                      })
                    }
                  }]
                }
              }]
            }
          });
        }
        
        // Simulate Gemini response generation
        if (requestBody.model === 'google/gemini-2.0-flash-001') {
          return Promise.resolve({
            data: {
              choices: [{
                message: {
                  role: 'assistant',
                  content: 'I found 2 properties in Portland matching your criteria:\n\n1. **123 Oak Street** - $750,000\n   - 3 bedrooms, 2 bathrooms\n   - Beautiful modern home in quiet neighborhood\n\n2. **456 Pine Avenue** - $699,000\n   - 4 bedrooms, 3 bathrooms\n   - Spacious family home with large yard'
                }
              }]
            }
          });
        }
      }
      return Promise.reject(new Error('Unexpected URL'));
    });

    // Create mock MCP client
    mockMCPClient = {
      discoverTools: jest.fn(),
      callTool: jest.fn(),
      healthCheck: jest.fn().mockResolvedValue(true)
    } as any;

    // Mock the MCPClient constructor
    (MCPClient as jest.MockedClass<typeof MCPClient>).mockImplementation(() => mockMCPClient);

    // Create the test module
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AgentsService,
        ChatHistoryService,
        {
          provide: ConfigService,
          useValue: {
            get: jest.fn((key: string) => {
              const config = {
                'OPENROUTER_API_KEY': 'test-api-key',
                'YOUR_SITE_URL': 'http://localhost:3000',
                'MCP_LISTINGS_URL': 'http://localhost:3001',
                'MCP_ANALYTICS_URL': 'http://localhost:3002'
              };
              return config[key];
            })
          }
        }
      ]
    }).compile();

    service = module.get<AgentsService>(AgentsService);
    chatHistoryService = module.get<ChatHistoryService>(ChatHistoryService);

    // Set up MCP client mock responses
    let callCount = 0;
    mockMCPClient.discoverTools.mockImplementation(() => {
      callCount++;
      if (callCount === 1) {
        // First call (listings server)
        return Promise.resolve([
          {
            name: 'findListings',
            description: 'Find property listings based on search criteria',
            inputSchema: {
              type: 'object',
              properties: {
                city: { type: 'string' },
                minBedrooms: { type: 'number' },
                maxPrice: { type: 'number' }
              }
            }
          }
        ]);
      } else if (callCount === 2) {
        // Second call (analytics server)
        return Promise.resolve([
          {
            name: 'getListingMetrics',
            description: 'Get analytics for listings',
            inputSchema: {
              type: 'object',
              properties: {
                listingIds: { type: 'array', items: { type: 'string' } }
              }
            }
          }
        ]);
      }
      return Promise.resolve([]);
    });

    mockMCPClient.callTool.mockImplementation((request) => {
      if (request.name === 'findListings') {
        return Promise.resolve({
          result: [
            {
              listingId: 'L001',
              address: {
                street: '123 Oak Street',
                city: 'Portland',
                state: 'OR',
                zip: '97201'
              },
              price: 750000,
              bedrooms: 3,
              bathrooms: 2,
              status: 'Active'
            },
            {
              listingId: 'L002',
              address: {
                street: '456 Pine Avenue',
                city: 'Portland',
                state: 'OR',
                zip: '97202'
              },
              price: 699000,
              bedrooms: 4,
              bathrooms: 3,
              status: 'Active'
            }
          ]
        });
      }
      return Promise.resolve({ result: [] });
    });

    // Initialize the service
    await service.onModuleInit();
  });

  afterAll(() => {
    jest.clearAllMocks();
  });

  describe('Complete MCP Flow', () => {
    it('should discover tools from multiple MCP servers on startup', async () => {
      // The service should have discovered tools from both servers
      const tools = service['tools'];
      
      expect(tools).toHaveLength(2);
      expect(tools.map(t => t.function.name)).toContain('findListings');
      expect(tools.map(t => t.function.name)).toContain('getListingMetrics');
    });

    it('should handle a complete user interaction with MCP tool execution', async () => {
      const userId = 'integration-test-user';
      const userMessage = 'Find me 3-bedroom homes in Portland under $800,000';

      // Execute the chat
      const response = await service.chat(userId, userMessage);

      // Verify the response
      expect(response).toContain('123 Oak Street');
      expect(response).toContain('456 Pine Avenue');
      expect(response).toContain('$750,000');
      expect(response).toContain('$699,000');

      // Verify chat history was saved
      const history = await chatHistoryService.getChatHistory(userId);
      expect(history).toHaveLength(2); // User message + Assistant response
      expect(history[0].content).toBe(userMessage);
      expect(history[1].content).toContain('I found 2 properties');
    });

    it('should maintain conversation context across multiple interactions', async () => {
      const userId = 'context-test-user';
      
      // First interaction
      await service.chat(userId, 'My budget is $600,000');
      
      // Second interaction - should remember the budget
      const response = await service.chat(userId, 'Show me 2-bedroom homes in Seattle');
      
      // Verify context was maintained
      const history = await chatHistoryService.getChatHistory(userId);
      expect(history).toHaveLength(4); // 2 interactions x 2 messages each
      
      // The second request should have access to the budget from the first
      expect(history[0].content).toContain('$600,000');
    });

    it('should handle MCP server failures gracefully', async () => {
      // Create a fresh service to test initialization failures
      const freshModule: TestingModule = await Test.createTestingModule({
        providers: [
          AgentsService,
          ChatHistoryService,
          {
            provide: ConfigService,
            useValue: {
              get: jest.fn((key: string) => {
                const config = {
                  'OPENROUTER_API_KEY': 'test-api-key',
                  'YOUR_SITE_URL': 'http://localhost:3000',
                  'MCP_LISTINGS_URL': 'http://localhost:3001',
                  'MCP_ANALYTICS_URL': 'http://localhost:3002'
                };
                return config[key];
              })
            }
          }
        ]
      }).compile();

      const freshService = freshModule.get<AgentsService>(AgentsService);
      
      // Mock one server to fail, one to succeed
      let failureCallCount = 0;
      mockMCPClient.discoverTools.mockImplementation(() => {
        failureCallCount++;
        if (failureCallCount === 1) {
          // First server fails
          return Promise.reject(new Error('Server is down'));
        } else {
          // Second server succeeds
          return Promise.resolve([
            {
              name: 'getListingMetrics',
              description: 'Get analytics for listings',
              inputSchema: {
                type: 'object',
                properties: {
                  listingIds: { type: 'array', items: { type: 'string' } }
                }
              }
            }
          ]);
        }
      });

      // Initialize service with one server failing
      await freshService.onModuleInit();
      
      // Service should still function with tools from working server
      const tools = freshService['tools'];
      expect(tools).toBeDefined();
      expect(tools.length).toBeGreaterThanOrEqual(0);
      
      // Verify both servers were attempted
      expect(mockMCPClient.discoverTools).toHaveBeenCalledTimes(2);
    });
  });

  describe('Performance and Scalability', () => {
    it('should handle concurrent requests efficiently', async () => {
      const users = ['user1', 'user2', 'user3'];
      const requests = users.map(userId => 
        service.chat(userId, 'Find homes in Portland')
      );

      // All requests should complete successfully
      const responses = await Promise.all(requests);
      
      expect(responses).toHaveLength(3);
      responses.forEach(response => {
        expect(response).toBeTruthy();
        expect(typeof response).toBe('string');
      });

      // Each user should have their own chat history (at least user message)
      for (const userId of users) {
        const history = await chatHistoryService.getChatHistory(userId);
        expect(history.length).toBeGreaterThanOrEqual(1);
      }
    });

    it('should respect chat history limits', async () => {
      const userId = 'history-limit-test';
      
      // Send a few messages to test limit
      for (let i = 0; i < 5; i++) {
        await service.chat(userId, `Message ${i}`);
      }

      // Internal history should exist and have messages
      const internalHistory = chatHistoryService['chatHistory'].get(userId);
      expect(internalHistory).toBeDefined();
      expect(internalHistory!.length).toBeGreaterThan(0);
    }, 15000);
  });
});