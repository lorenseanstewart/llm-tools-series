import { mockListings } from "../tools/mock.data";
import { Listing } from "../tools/listings.types";
import { OpenRouterResponse, ToolCall } from "../types/openrouter.types";

/**
 * Test utilities for creating mock data and responses
 */
export class TestUtils {
  /**
   * Creates a mock OpenRouter response with tool calls
   */
  static createMockToolCallResponse(
    toolName: string,
    toolArguments: Record<string, any>
  ): OpenRouterResponse {
    return {
      choices: [
        {
          message: {
            tool_calls: [
              {
                id: `call_${Date.now()}`,
                type: "function",
                function: {
                  name: toolName,
                  arguments: JSON.stringify(toolArguments)
                }
              }
            ]
          }
        }
      ]
    };
  }

  /**
   * Creates a mock OpenRouter response without tool calls
   */
  static createMockChatResponse(content: string): OpenRouterResponse {
    return {
      choices: [
        {
          message: {
            content
          }
        }
      ]
    };
  }

  /**
   * Creates a mock tool call object
   */
  static createMockToolCall(
    toolName: string,
    toolArguments: Record<string, any>
  ): ToolCall {
    return {
      id: `call_${Date.now()}`,
      type: "function",
      function: {
        name: toolName,
        arguments: JSON.stringify(toolArguments)
      }
    };
  }

  /**
   * Gets a subset of mock listings for testing
   */
  static getMockListings(count: number = 5): Listing[] {
    return mockListings.slice(0, count);
  }

  /**
   * Gets mock listings filtered by city
   */
  static getMockListingsByCity(city: string): Listing[] {
    return mockListings.filter(
      listing => listing.address.city.toLowerCase() === city.toLowerCase()
    );
  }

  /**
   * Gets mock listings filtered by status
   */
  static getMockListingsByStatus(status: "Active" | "Pending" | "Sold"): Listing[] {
    return mockListings.filter(listing => listing.status === status);
  }

  /**
   * Creates a mock successful email report response
   */
  static createMockEmailReportResponse(recipientEmail: string) {
    return {
      success: true,
      message: `Report sent successfully to ${recipientEmail}.`
    };
  }

  /**
   * Creates a mock failed email report response
   */
  static createMockEmailReportError(message: string) {
    return {
      success: false,
      message
    };
  }

  /**
   * Creates mock environment variables for testing
   */
  static getMockEnvVars() {
    return {
      OPENROUTER_API_KEY: "test-api-key",
      SITE_URL: "http://localhost:3000",
      PORT: "3000"
    };
  }

  /**
   * Creates mock ConfigService for testing
   */
  static createMockConfigService() {
    const envVars = TestUtils.getMockEnvVars();
    return {
      get: jest.fn((key: string) => envVars[key as keyof typeof envVars])
    };
  }

  /**
   * Creates mock ToolsService for testing
   */
  static createMockToolsService() {
    return {
      findListings: jest.fn(),
      sendListingReport: jest.fn()
    };
  }

  /**
   * Creates mock AgentsService for testing
   */
  static createMockAgentsService() {
    return {
      chat: jest.fn()
    };
  }

  /**
   * Generates a random listing ID for testing
   */
  static generateRandomListingId(): string {
    return `L${Math.floor(Math.random() * 1000).toString().padStart(3, '0')}`;
  }

  /**
   * Creates a valid email address for testing
   */
  static createTestEmail(prefix: string = "test"): string {
    return `${prefix}@example.com`;
  }

  /**
   * Creates an invalid email address for testing
   */
  static createInvalidEmail(): string {
    return "invalid-email";
  }

  /**
   * Creates a mock axios response for testing
   */
  static createMockAxiosResponse<T>(data: T) {
    return {
      data,
      status: 200,
      statusText: "OK",
      headers: {},
      config: {}
    };
  }

  /**
   * Creates a mock axios error for testing
   */
  static createMockAxiosError(message: string = "Network Error") {
    const error = new Error(message);
    (error as any).isAxiosError = true;
    return error;
  }

  /**
   * Validates that a timestamp is a valid ISO string
   */
  static isValidISOTimestamp(timestamp: string): boolean {
    try {
      const date = new Date(timestamp);
      return date.toISOString() === timestamp;
    } catch {
      return false;
    }
  }

  /**
   * Creates a mock real estate query for testing
   */
  static createRealEstateQuery(
    city: string = "Portland",
    bedrooms: number = 3,
    maxPrice: number = 800000
  ): string {
    return `Find active ${bedrooms}-bedroom houses in ${city} under $${maxPrice.toLocaleString()}`;
  }

  /**
   * Creates a mock report request for testing
   */
  static createReportRequest(
    listingIds: string[] = ["L001", "L002"],
    email: string = "client@example.com"
  ): string {
    return `Send a report of listings ${listingIds.join(" and ")} to ${email}`;
  }

  /**
   * Creates a mock conversation starter for testing
   */
  static createConversationStarter(): string {
    const starters = [
      "Hello, how can you help me?",
      "What services do you offer?",
      "I'm looking for a house",
      "Can you help me find properties?"
    ];
    return starters[Math.floor(Math.random() * starters.length)];
  }

  /**
   * Creates expected headers for OpenRouter API calls
   */
  static getExpectedOpenRouterHeaders() {
    return {
      "Authorization": "Bearer test-api-key",
      "HTTP-Referer": "http://localhost:3000",
      "X-Title": "Real Estate AI Agent",
      "Content-Type": "application/json"
    };
  }

  /**
   * Creates expected tool definitions for testing
   */
  static getExpectedToolDefinitions() {
    return [
      {
        type: "function",
        function: {
          name: "findListings",
          description: "Find property listings based on filters",
          parameters: expect.objectContaining({
            type: "object",
            properties: expect.objectContaining({
              status: expect.any(Object),
              city: expect.any(Object),
              state: expect.any(Object),
              minBedrooms: expect.any(Object),
              maxPrice: expect.any(Object)
            })
          })
        }
      },
      {
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
      }
    ];
  }

  /**
   * Delays execution for testing async operations
   */
  static delay(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  /**
   * Creates a mock performance timer for testing
   */
  static createMockTimer() {
    const start = Date.now();
    return {
      start,
      elapsed: () => Date.now() - start
    };
  }
}