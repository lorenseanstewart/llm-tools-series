import { Test, TestingModule } from '@nestjs/testing';
import { ConfigService } from '@nestjs/config';
import type { OpenRouterMessage, MCPTool } from '@llm-tools/shared-types';

/**
 * Test helpers and utilities for consistent testing across the application
 */

/**
 * Creates a mock ConfigService with default test values
 */
export function createMockConfigService(overrides: Record<string, any> = {}) {
  const defaults = {
    'openrouter.apiKey': 'test-api-key',
    'openrouter.siteUrl': 'http://localhost:3000',
    'mcp.listingsUrl': 'http://localhost:3001',
    'mcp.analyticsUrl': 'http://localhost:3002',
    'app.port': 3000,
    'app.environment': 'test'
  };

  return {
    get: jest.fn((key: string) => overrides[key] || defaults[key])
  };
}

/**
 * Creates mock OpenRouter responses for testing
 */
export function createMockOpenRouterResponse(options: {
  model: 'kimi' | 'gemini';
  content?: string;
  toolCalls?: Array<{
    name: string;
    arguments: any;
  }>;
}) {
  const { model, content, toolCalls } = options;

  if (toolCalls && toolCalls.length > 0) {
    return {
      data: {
        choices: [{
          message: {
            role: 'assistant',
            content: null,
            tool_calls: toolCalls.map((tc, index) => ({
              id: `call_${index}`,
              type: 'function',
              function: {
                name: tc.name,
                arguments: JSON.stringify(tc.arguments)
              }
            }))
          }
        }]
      }
    };
  }

  return {
    data: {
      choices: [{
        message: {
          role: 'assistant',
          content: content || 'Test response'
        }
      }]
    }
  };
}

/**
 * Creates a mock MCP tool for testing
 */
export function createMockMCPTool(overrides: Partial<MCPTool> = {}): MCPTool {
  return {
    name: 'testTool',
    description: 'A test tool',
    inputSchema: {
      type: 'object',
      properties: {
        testParam: { type: 'string' }
      },
      required: ['testParam']
    },
    ...overrides
  };
}

/**
 * Creates mock chat messages for testing conversation history
 */
export function createMockChatHistory(messageCount: number = 5): OpenRouterMessage[] {
  const messages: OpenRouterMessage[] = [];
  
  for (let i = 0; i < messageCount; i++) {
    messages.push({
      role: i % 2 === 0 ? 'user' : 'assistant',
      content: `Test message ${i}`
    });
  }
  
  return messages;
}

/**
 * Waits for all pending promises to resolve
 * Useful for testing async operations
 */
export function flushPromises(): Promise<void> {
  return new Promise(resolve => setImmediate(resolve));
}

/**
 * Creates a test module with common providers
 */
export async function createTestModule(metadata: {
  providers: any[];
  imports?: any[];
}): Promise<TestingModule> {
  return Test.createTestingModule({
    imports: metadata.imports || [],
    providers: [
      {
        provide: ConfigService,
        useValue: createMockConfigService()
      },
      ...metadata.providers
    ]
  }).compile();
}

/**
 * Mock implementation of setTimeout for testing time-based operations
 */
export function mockTimers() {
  jest.useFakeTimers();
  
  return {
    advance: (ms: number) => jest.advanceTimersByTime(ms),
    runAll: () => jest.runAllTimers(),
    restore: () => jest.useRealTimers()
  };
}

/**
 * Asserts that an async function throws with a specific error message
 */
export async function expectAsyncError(
  asyncFn: () => Promise<any>,
  errorMessage: string | RegExp
) {
  let error: Error | undefined;
  
  try {
    await asyncFn();
  } catch (e) {
    error = e as Error;
  }
  
  expect(error).toBeDefined();
  
  if (typeof errorMessage === 'string') {
    expect(error!.message).toBe(errorMessage);
  } else {
    expect(error!.message).toMatch(errorMessage);
  }
}

/**
 * Creates a mock listing for testing
 */
export function createMockListing(overrides: any = {}) {
  return {
    listingId: 'L001',
    address: {
      street: '123 Test St',
      city: 'Portland',
      state: 'OR',
      zip: '97201'
    },
    price: 500000,
    bedrooms: 3,
    bathrooms: 2,
    squareFeet: 2000,
    yearBuilt: 2020,
    propertyType: 'Single Family',
    status: 'Active',
    listingAgent: {
      name: 'Test Agent',
      email: 'agent@test.com',
      phone: '555-0123'
    },
    ...overrides
  };
}

/**
 * Validates that a response matches expected MCP tool response format
 */
export function validateMCPToolResponse(response: any) {
  expect(response).toBeDefined();
  expect(response).toHaveProperty('result');
  expect(response).not.toHaveProperty('error');
}

/**
 * Creates a spy that tracks calls but passes through to original implementation
 */
export function createPassthroughSpy<T extends (...args: any[]) => any>(
  fn: T
): jest.SpyInstance {
  return jest.fn(fn) as any;
}