import { Test, TestingModule } from "@nestjs/testing";
import { ConfigModule } from "@nestjs/config";
import { AgentsController } from "../../agents/agents.controller";
import { AgentsService } from "../../agents/agents.service";
import { ToolsService } from "../../tools/tools.service";
import { ChatRequestDto } from "../../agents/dto/chat-request.dto";
import axios from "axios";
import { testFixtures } from "../fixtures";
import { TestUtils } from "../test-utils";

// Mock axios for OpenRouter API calls
jest.mock("axios");
const mockedAxios = axios as jest.Mocked<typeof axios>;

describe("Chat Flow Integration Tests", () => {
  let app: TestingModule;
  let controller: AgentsController;
  let agentsService: AgentsService;
  let toolsService: ToolsService;

  beforeAll(async () => {
    app = await Test.createTestingModule({
      imports: [
        ConfigModule.forRoot({
          envFilePath: ".env.test",
          isGlobal: true
        })
      ],
      controllers: [AgentsController],
      providers: [AgentsService, ToolsService]
    }).compile();

    controller = app.get<AgentsController>(AgentsController);
    agentsService = app.get<AgentsService>(AgentsService);
    toolsService = app.get<ToolsService>(ToolsService);
  });

  afterAll(async () => {
    await app.close();
  });

  beforeEach(() => {
    // Reset all mocks before each test
    jest.clearAllMocks();
    
    // Set up default environment variables
    process.env.OPENROUTER_API_KEY = "test-api-key";
    process.env.SITE_URL = "http://localhost:3000";
  });

  describe("Complete Property Search Flow", () => {
    it("should handle end-to-end property search successfully", async () => {
      // 1. Mock Kimi K2 response for tool selection
      const toolCallResponse = TestUtils.createMockToolCallResponse(
        "findListings",
        testFixtures.filters.portlandActive
      );

      // 2. Mock Gemini response for conversation
      const conversationResponse = TestUtils.createMockChatResponse(
        "I found 2 properties matching your criteria:\n\n1. **123 Oak Street** - 3 bedrooms, 2 bathrooms - $825,000\n2. **456 Pine Avenue** - 4 bedrooms, 3 bathrooms - $799,000\n\nWould you like more details about either property?"
      );

      // 3. Set up axios mock responses
      mockedAxios.post
        .mockResolvedValueOnce(TestUtils.createMockAxiosResponse(toolCallResponse))
        .mockResolvedValueOnce(TestUtils.createMockAxiosResponse(conversationResponse));

      // 4. Create request
      const chatRequest: ChatRequestDto = {
        userMessage: testFixtures.userMessages.findListings
      };

      // 5. Execute the complete flow
      const result = await controller.chat(chatRequest);

      // 6. Verify the result structure
      expect(result).toEqual({
        success: true,
        message: expect.stringContaining("I found 2 properties matching your criteria"),
        timestamp: expect.any(String)
      });

      // 7. Verify OpenRouter API was called correctly
      expect(mockedAxios.post).toHaveBeenCalledTimes(2);
      
      // First call should be to Kimi K2 with tools
      expect(mockedAxios.post).toHaveBeenNthCalledWith(
        1,
        "https://openrouter.ai/api/v1/chat/completions",
        expect.objectContaining({
          model: testFixtures.models.kimi,
          tools: TestUtils.getExpectedToolDefinitions()
        }),
        expect.objectContaining({
          headers: TestUtils.getExpectedOpenRouterHeaders()
        })
      );

      // Second call should be to Gemini for response generation
      expect(mockedAxios.post).toHaveBeenNthCalledWith(
        2,
        "https://openrouter.ai/api/v1/chat/completions",
        expect.objectContaining({
          model: testFixtures.models.gemini
        }),
        expect.objectContaining({
          headers: TestUtils.getExpectedOpenRouterHeaders()
        })
      );

      // 8. Verify timestamp is valid
      expect(TestUtils.isValidISOTimestamp(result.timestamp)).toBe(true);
    });

    it("should handle property search with no results", async () => {
      // Mock tool call for filters that return no results
      const toolCallResponse = TestUtils.createMockToolCallResponse(
        "findListings",
        testFixtures.filters.noResults
      );

      const conversationResponse = TestUtils.createMockChatResponse(
        "I couldn't find any properties matching your criteria. Try adjusting your search parameters."
      );

      mockedAxios.post
        .mockResolvedValueOnce(TestUtils.createMockAxiosResponse(toolCallResponse))
        .mockResolvedValueOnce(TestUtils.createMockAxiosResponse(conversationResponse));

      const chatRequest: ChatRequestDto = {
        userMessage: "Find properties in NonExistentCity under $1"
      };

      const result = await controller.chat(chatRequest);

      expect(result.success).toBe(true);
      expect(result.message).toContain("couldn't find any properties");
    });
  });

  describe("Complete Report Generation Flow", () => {
    it("should handle end-to-end report generation successfully", async () => {
      // 1. Mock tool call for sending report
      const toolCallResponse = TestUtils.createMockToolCallResponse(
        "sendListingReport",
        {
          listingIds: ["L001", "L002"],
          recipientEmail: "client@example.com"
        }
      );

      // 2. Mock conversation response
      const conversationResponse = TestUtils.createMockChatResponse(
        "I've successfully sent a report to client@example.com with listings:\n- 123 Oak Street Portland OR\n- 456 Pine Avenue Seattle WA"
      );

      mockedAxios.post
        .mockResolvedValueOnce(TestUtils.createMockAxiosResponse(toolCallResponse))
        .mockResolvedValueOnce(TestUtils.createMockAxiosResponse(conversationResponse));

      const chatRequest: ChatRequestDto = {
        userMessage: testFixtures.userMessages.sendReport
      };

      const result = await controller.chat(chatRequest);

      expect(result).toEqual({
        success: true,
        message: expect.stringContaining("successfully sent a report"),
        timestamp: expect.any(String)
      });

      // Verify the tool was called with correct parameters
      const toolCallArgs = mockedAxios.post.mock.calls[0][1] as any;
      expect(toolCallArgs.tools).toContainEqual(
        expect.objectContaining({
          function: expect.objectContaining({
            name: "sendListingReport"
          })
        })
      );
    });

    it("should handle report generation with invalid email", async () => {
      const toolCallResponse = TestUtils.createMockToolCallResponse(
        "sendListingReport",
        {
          listingIds: ["L001"],
          recipientEmail: "invalid-email"
        }
      );

      const conversationResponse = TestUtils.createMockChatResponse(
        "I encountered an error sending the report. Please check that the email address is valid."
      );

      mockedAxios.post
        .mockResolvedValueOnce(TestUtils.createMockAxiosResponse(toolCallResponse))
        .mockResolvedValueOnce(TestUtils.createMockAxiosResponse(conversationResponse));

      const chatRequest: ChatRequestDto = {
        userMessage: "Send a report of listing L001 to invalid-email"
      };

      const result = await controller.chat(chatRequest);

      expect(result.success).toBe(true);
      expect(result.message).toContain("error sending the report");
    });
  });

  describe("Conversational Flow (No Tools)", () => {
    it("should handle general conversation without tools", async () => {
      const noToolResponse = TestUtils.createMockChatResponse(
        "Hello! I'm here to help you with real estate queries. What can I do for you today?"
      );

      const conversationResponse = TestUtils.createMockChatResponse(
        "Hello! I'm here to help you with real estate queries. What can I do for you today?"
      );

      mockedAxios.post
        .mockResolvedValueOnce(TestUtils.createMockAxiosResponse(noToolResponse)) // Kimi K2 call
        .mockResolvedValueOnce(TestUtils.createMockAxiosResponse(conversationResponse)); // Gemini call

      const chatRequest: ChatRequestDto = {
        userMessage: testFixtures.userMessages.greeting
      };

      const result = await controller.chat(chatRequest);

      expect(result.success).toBe(true);
      expect(result.message).toContain("Hello! I'm here to help");

      // Should make two API calls (Kimi K2 + Gemini)
      expect(mockedAxios.post).toHaveBeenCalledTimes(2);
    });
  });

  describe("Error Handling", () => {
    it("should handle OpenRouter API errors gracefully", async () => {
      mockedAxios.post.mockRejectedValueOnce(
        TestUtils.createMockAxiosError("Network Error")
      );

      const chatRequest: ChatRequestDto = {
        userMessage: testFixtures.userMessages.findListings
      };

      const result = await controller.chat(chatRequest);

      expect(result.success).toBe(true);
      expect(result.message).toBe("Sorry, I encountered an error. Please try again.");
    });

    it("should handle malformed tool arguments", async () => {
      const malformedToolResponse = {
        choices: [
          {
            message: {
              tool_calls: [
                {
                  id: "call_malformed",
                  type: "function",
                  function: {
                    name: "findListings",
                    arguments: "invalid json"
                  }
                }
              ]
            }
          }
        ]
      };

      mockedAxios.post.mockResolvedValueOnce(
        TestUtils.createMockAxiosResponse(malformedToolResponse)
      );

      const chatRequest: ChatRequestDto = {
        userMessage: "Find some listings"
      };

      const result = await controller.chat(chatRequest);

      expect(result.success).toBe(true);
      expect(result.message).toBe("Sorry, I encountered an error. Please try again.");
    });

    it("should handle unknown tool calls", async () => {
      const unknownToolResponse = TestUtils.createMockToolCallResponse(
        "unknownTool",
        { param: "value" }
      );

      mockedAxios.post.mockResolvedValueOnce(
        TestUtils.createMockAxiosResponse(unknownToolResponse)
      );

      const chatRequest: ChatRequestDto = {
        userMessage: "Do something unknown"
      };

      const result = await controller.chat(chatRequest);

      expect(result.success).toBe(true);
      expect(result.message).toBe("Sorry, I encountered an error. Please try again.");
    });
  });

  describe("Edge Cases", () => {
    it("should handle very long user messages", async () => {
      const noToolResponse = TestUtils.createMockChatResponse(
        "I received your message. How can I help you with real estate?"
      );

      const conversationResponse = TestUtils.createMockChatResponse(
        "I received your message. How can I help you with real estate?"
      );

      mockedAxios.post
        .mockResolvedValueOnce(TestUtils.createMockAxiosResponse(noToolResponse))
        .mockResolvedValueOnce(TestUtils.createMockAxiosResponse(conversationResponse));

      const chatRequest: ChatRequestDto = {
        userMessage: testFixtures.userMessages.longMessage
      };

      const result = await controller.chat(chatRequest);

      expect(result.success).toBe(true);
      expect(result.message).toBe("I received your message. How can I help you with real estate?");
    });

    it("should handle unicode characters in messages", async () => {
      const noToolResponse = TestUtils.createMockChatResponse(
        "I can help you find properties in San José, California! Let me search for available listings."
      );

      const conversationResponse = TestUtils.createMockChatResponse(
        "I can help you find properties in San José, California! Let me search for available listings."
      );

      mockedAxios.post
        .mockResolvedValueOnce(TestUtils.createMockAxiosResponse(noToolResponse))
        .mockResolvedValueOnce(TestUtils.createMockAxiosResponse(conversationResponse));

      const chatRequest: ChatRequestDto = {
        userMessage: testFixtures.userMessages.unicodeMessage
      };

      const result = await controller.chat(chatRequest);

      expect(result.success).toBe(true);
      expect(result.message).toContain("San José");
    });

    it("should handle concurrent requests", async () => {
      const response = TestUtils.createMockChatResponse("Test response");

      // Use mockResolvedValue to always return the same response
      mockedAxios.post.mockResolvedValue(TestUtils.createMockAxiosResponse(response));

      const request1: ChatRequestDto = { userMessage: "First message" };
      const request2: ChatRequestDto = { userMessage: "Second message" };

      const [result1, result2] = await Promise.all([
        controller.chat(request1),
        controller.chat(request2)
      ]);

      expect(result1.message).toBe("Test response");
      expect(result2.message).toBe("Test response");
      expect(result1.success).toBe(true);
      expect(result2.success).toBe(true);
      expect(mockedAxios.post).toHaveBeenCalledTimes(4); // 2 calls per request
    });
  });

  describe("Performance and Reliability", () => {
    it("should complete requests within reasonable time", async () => {
      const timer = TestUtils.createMockTimer();
      
      const noToolResponse = TestUtils.createMockChatResponse("Quick response");
      const conversationResponse = TestUtils.createMockChatResponse("Quick response");
      
      mockedAxios.post
        .mockResolvedValueOnce(TestUtils.createMockAxiosResponse(noToolResponse))
        .mockResolvedValueOnce(TestUtils.createMockAxiosResponse(conversationResponse));

      const chatRequest: ChatRequestDto = {
        userMessage: "Quick test message"
      };

      await controller.chat(chatRequest);

      // Should complete within 100ms in test environment
      expect(timer.elapsed()).toBeLessThan(100);
    });

    it("should maintain consistent response format", async () => {
      const conversationResponse = TestUtils.createMockChatResponse("Test response");
      mockedAxios.post.mockResolvedValue(
        TestUtils.createMockAxiosResponse(conversationResponse)
      );

      const chatRequest: ChatRequestDto = {
        userMessage: "Test message"
      };

      // Test multiple requests for consistency
      for (let i = 0; i < 5; i++) {
        const result = await controller.chat(chatRequest);
        
        expect(result).toHaveProperty("success");
        expect(result).toHaveProperty("message");
        expect(result).toHaveProperty("timestamp");
        expect(result.success).toBe(true);
        expect(typeof result.message).toBe("string");
        expect(TestUtils.isValidISOTimestamp(result.timestamp)).toBe(true);
      }
    });
  });
});