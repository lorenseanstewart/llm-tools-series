import { Test, TestingModule } from "@nestjs/testing";
import { ConfigService } from "@nestjs/config";
import { AgentsService } from "./agents.service";
import { ToolsService } from "../tools/tools.service";
import axios from "axios";
import { mockListings } from "../tools/mock.data";

// Mock axios
jest.mock("axios");
const mockedAxios = axios as jest.Mocked<typeof axios>;

describe("AgentsService", () => {
  let service: AgentsService;
  let toolsService: ToolsService;
  let configService: ConfigService;

  const mockConfigService = {
    get: jest.fn((key: string) => {
      switch (key) {
        case "OPENROUTER_API_KEY":
          return "test-api-key";
        case "SITE_URL":
          return "http://localhost:3000";
        default:
          return undefined;
      }
    })
  };

  const mockToolsService = {
    findListings: jest.fn(),
    sendListingReport: jest.fn()
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AgentsService,
        {
          provide: ToolsService,
          useValue: mockToolsService
        },
        {
          provide: ConfigService,
          useValue: mockConfigService
        }
      ]
    }).compile();

    service = module.get<AgentsService>(AgentsService);
    toolsService = module.get<ToolsService>(ToolsService);
    configService = module.get<ConfigService>(ConfigService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it("should be defined", () => {
    expect(service).toBeDefined();
  });

  describe("chat", () => {
    it("should handle tool-based conversation flow", async () => {
      // Mock Kimi K2 response with tool call
      const toolCallResponse = {
        choices: [
          {
            message: {
              tool_calls: [
                {
                  id: "call_123",
                  type: "function",
                  function: {
                    name: "findListings",
                    arguments: '{"city":"Portland","status":"Active","minBedrooms":3,"maxPrice":850000}'
                  }
                }
              ]
            }
          }
        ]
      };

      // Mock Gemini response
      const geminiResponse = {
        choices: [
          {
            message: {
              content: "I found 2 properties matching your criteria:\n\n1. **123 Oak Street** - 3 bedrooms, 2 bathrooms - $825,000\n2. **456 Pine Avenue** - 4 bedrooms, 3 bathrooms - $799,000\n\nWould you like more details about either property?"
            }
          }
        ]
      };

      // Mock tool service response
      const mockListingsResult = [
        mockListings[0], // Should match the criteria
        mockListings[1]
      ];

      mockedAxios.post
        .mockResolvedValueOnce({ data: toolCallResponse }) // Kimi K2 call
        .mockResolvedValueOnce({ data: geminiResponse }); // Gemini call

      mockToolsService.findListings.mockResolvedValue(mockListingsResult);

      const result = await service.chat("Find active listings in Portland, OR with at least 3 bedrooms and under $850,000");

      expect(result).toBe("I found 2 properties matching your criteria:\n\n1. **123 Oak Street** - 3 bedrooms, 2 bathrooms - $825,000\n2. **456 Pine Avenue** - 4 bedrooms, 3 bathrooms - $799,000\n\nWould you like more details about either property?");

      // Verify Kimi K2 was called with correct parameters
      expect(mockedAxios.post).toHaveBeenCalledWith(
        "https://openrouter.ai/api/v1/chat/completions",
        {
          model: "moonshotai/kimi-k2",
          messages: [
            {
              role: "system",
              content: expect.stringContaining("professional real estate assistant")
            },
            {
              role: "user",
              content: "Find active listings in Portland, OR with at least 3 bedrooms and under $850,000"
            }
          ],
          tools: expect.arrayContaining([
            expect.objectContaining({
              type: "function",
              function: expect.objectContaining({
                name: "findListings"
              })
            })
          ]),
          tool_choice: "auto"
        },
        expect.objectContaining({
          headers: expect.objectContaining({
            "Authorization": "Bearer test-api-key",
            "HTTP-Referer": "http://localhost:3000"
          })
        })
      );

      // Verify tool was executed
      expect(mockToolsService.findListings).toHaveBeenCalledWith({
        city: "Portland",
        status: "Active",
        minBedrooms: 3,
        maxPrice: 850000
      });

      // Verify Gemini was called for response generation
      expect(mockedAxios.post).toHaveBeenCalledWith(
        "https://openrouter.ai/api/v1/chat/completions",
        {
          model: "google/gemini-2.0-flash-001",
          messages: [
            {
              role: "system",
              content: expect.stringContaining("professional real estate assistant")
            },
            {
              role: "user",
              content: expect.stringContaining("Find active listings in Portland, OR with at least 3 bedrooms and under $850,000")
            },
            {
              role: "user",
              content: expect.stringContaining("Tool result: I found 2 properties that match your criteria:")
            }
          ]
        },
        expect.objectContaining({
          headers: expect.objectContaining({
            "Authorization": "Bearer test-api-key"
          })
        })
      );
    });

    it("should handle sendListingReport tool calls", async () => {
      const toolCallResponse = {
        choices: [
          {
            message: {
              tool_calls: [
                {
                  id: "call_456",
                  type: "function",
                  function: {
                    name: "sendListingReport",
                    arguments: '{"listingIds":["L001","L002"],"recipientEmail":"test@example.com"}'
                  }
                }
              ]
            }
          }
        ]
      };

      const geminiResponse = {
        choices: [
          {
            message: {
              content: "I've successfully sent a report of both properties to test@example.com."
            }
          }
        ]
      };

      const mockReportResult = {
        success: true,
        message: "Report sent successfully to test@example.com"
      };

      mockedAxios.post
        .mockResolvedValueOnce({ data: toolCallResponse })
        .mockResolvedValueOnce({ data: geminiResponse });

      mockToolsService.sendListingReport.mockResolvedValue(mockReportResult);

      const result = await service.chat("Send a report of listings L001 and L002 to test@example.com");

      expect(result).toBe("I've successfully sent a report of both properties to test@example.com.");
      expect(mockToolsService.sendListingReport).toHaveBeenCalledWith(
        ["L001", "L002"],
        "test@example.com"
      );
    });

    it("should handle conversations without tool calls", async () => {
      const noToolResponse = {
        choices: [
          {
            message: {
              content: "Hello! I'm here to help you with real estate queries. What can I do for you today?"
            }
          }
        ]
      };

      mockedAxios.post.mockResolvedValue({ data: noToolResponse });

      const result = await service.chat("Hello, how are you?");

      expect(result).toBe("Hello! I'm here to help you with real estate queries. What can I do for you today?");
      expect(mockedAxios.post).toHaveBeenCalledTimes(2); // Kimi K2 + Gemini
      expect(mockToolsService.findListings).not.toHaveBeenCalled();
      expect(mockToolsService.sendListingReport).not.toHaveBeenCalled();
    });

    it("should handle unknown tool calls gracefully", async () => {
      const unknownToolResponse = {
        choices: [
          {
            message: {
              tool_calls: [
                {
                  id: "call_789",
                  type: "function",
                  function: {
                    name: "unknownTool",
                    arguments: '{"param":"value"}'
                  }
                }
              ]
            }
          }
        ]
      };

      mockedAxios.post.mockResolvedValueOnce({ data: unknownToolResponse });

      const result = await service.chat("Do something unknown");

      expect(result).toBe("Sorry, I encountered an error. Please try again.");
    });

    it("should handle API errors gracefully", async () => {
      mockedAxios.post.mockRejectedValueOnce(new Error("API Error"));

      const result = await service.chat("Find listings");

      expect(result).toBe("Sorry, I encountered an error. Please try again.");
    });

    it("should handle malformed tool arguments", async () => {
      const malformedToolResponse = {
        choices: [
          {
            message: {
              tool_calls: [
                {
                  id: "call_bad",
                  type: "function",
                  function: {
                    name: "findListings",
                    arguments: 'invalid json'
                  }
                }
              ]
            }
          }
        ]
      };

      mockedAxios.post.mockResolvedValueOnce({ data: malformedToolResponse });

      const result = await service.chat("Find listings");

      expect(result).toBe("Sorry, I encountered an error. Please try again.");
    });
  });

  describe("OpenRouter integration", () => {
    it("should use correct headers for OpenRouter API calls", async () => {
      const mockResponse = {
        choices: [
          {
            message: {
              content: "Test response"
            }
          }
        ]
      };

      mockedAxios.post.mockResolvedValue({ data: mockResponse });

      await service.chat("Test message");

      expect(mockedAxios.post).toHaveBeenCalledWith(
        "https://openrouter.ai/api/v1/chat/completions",
        expect.any(Object),
        {
          headers: {
            "Authorization": "Bearer test-api-key",
            "HTTP-Referer": "http://localhost:3000",
            "X-Title": "Real Estate AI Agent",
            "Content-Type": "application/json"
          }
        }
      );
    });

    it("should use correct models for different purposes", async () => {
      const toolResponse = {
        choices: [
          {
            message: {
              tool_calls: [
                {
                  id: "call_test",
                  type: "function",
                  function: {
                    name: "findListings",
                    arguments: '{"city":"Test"}'
                  }
                }
              ]
            }
          }
        ]
      };

      const geminiResponse = {
        choices: [
          {
            message: {
              content: "Test response"
            }
          }
        ]
      };

      mockedAxios.post
        .mockResolvedValueOnce({ data: toolResponse })
        .mockResolvedValueOnce({ data: geminiResponse });

      mockToolsService.findListings.mockResolvedValue([]);

      await service.chat("Test message");

      // First call should use Kimi K2
      expect(mockedAxios.post).toHaveBeenNthCalledWith(
        1,
        "https://openrouter.ai/api/v1/chat/completions",
        expect.objectContaining({
          model: "moonshotai/kimi-k2"
        }),
        expect.any(Object)
      );

      // Second call should use Gemini
      expect(mockedAxios.post).toHaveBeenNthCalledWith(
        2,
        "https://openrouter.ai/api/v1/chat/completions",
        expect.objectContaining({
          model: "google/gemini-2.0-flash-001"
        }),
        expect.any(Object)
      );
    });
  });

  describe("tool definitions", () => {
    it("should include findListings tool with correct schema", async () => {
      const mockResponse = {
        choices: [
          {
            message: {
              content: "Test response"
            }
          }
        ]
      };

      mockedAxios.post.mockResolvedValue({ data: mockResponse });

      await service.chat("Test message");

      const callArgs = mockedAxios.post.mock.calls[0];
      const requestBody = callArgs[1] as any;

      expect(requestBody.tools).toContainEqual({
        type: "function",
        function: {
          name: "findListings",
          description: "Find property listings based on filters",
          parameters: expect.any(Object)
        }
      });
    });

    it("should include sendListingReport tool with correct schema", async () => {
      const mockResponse = {
        choices: [
          {
            message: {
              content: "Test response"
            }
          }
        ]
      };

      mockedAxios.post.mockResolvedValue({ data: mockResponse });

      await service.chat("Test message");

      const callArgs = mockedAxios.post.mock.calls[0];
      const requestBody = callArgs[1] as any;

      expect(requestBody.tools).toContainEqual({
        type: "function",
        function: {
          name: "sendListingReport",
          description: "Send email report of listings",
          parameters: {
            type: "object",
            properties: {
              listingIds: { type: "array", items: { type: "string" } },
              recipientEmail: { type: "string" }
            },
            required: ["listingIds", "recipientEmail"]
          }
        }
      });
    });
  });
});
