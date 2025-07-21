---
title: "LLM Tools: Production-Ready Patterns (Part 3)"
date: "2025-07-05"
description: "Apply the 12 Factor Agents methodology to build reliable, maintainable AI applications that work consistently in production environments"
excerpt: "Move beyond prototypes to production-ready AI agents using proven software engineering principles adapted for LLM applications"
tags:
  ["AI", "LLM", "Architecture", "Production", "Best Practices", "TypeScript"]
published: false
---

# LLM Tools: Production-Ready Patterns (Part 3)

_This is Part 3 of a 3-part series on LLM tool integration. [Part 1](/blog/llm-tools-chatbot-to-agent-part-1) covers direct tool integration, and [Part 2](/blog/llm-tools-scaling-with-mcp-part-2) covers scaling with MCP architecture._

You've built your AI agent using direct tools (Part 1) or scaled it with MCP (Part 2). It works great in development. Your demo impressed everyone. But now you need to ship it to real users, and suddenly you're facing new challenges:

- Your agent sometimes gives different answers to the same question
- Error handling is inconsistent across different scenarios
- Context window limits cause failures with complex conversations
- Debugging agent behavior is nearly impossible
- The system feels fragile and unpredictable

Moving from prototype to production requires more than just hosting your code. You need proven patterns for building reliable AI systems.

That's where the [**12 Factor Agents methodology**](https://github.com/humanlayer/12-factor-agents) comes in. Created by the team at HumanLayer, it adapts the classic [12 Factor App](https://12factor.net/) principles specifically for AI agent development. Instead of treating agents as magic black boxes, it gives you concrete patterns for building predictable, maintainable AI systems.

Let's apply the most impactful factors to transform our real estate assistant from a working prototype into a production-ready application.

## Factor 2: Own Your Prompts

The biggest difference between toy demos and production AI? **Explicit prompt management**. Instead of hardcoding prompts or leaving them implicit, treat them as first-class configuration.

![Natural Language to Tool Calls](https://raw.githubusercontent.com/humanlayer/12-factor-agents/main/img/110-natural-language-tool-calls.png)
_Source: [12 Factor Agents - Natural Language to Tool Calls](https://github.com/humanlayer/12-factor-agents)_

Here's how we upgrade our real estate assistant:

```typescript
// src/prompts/system.ts
export const SYSTEM_PROMPTS = {
  realEstateAgent: `You are a professional real estate assistant helping clients find properties.

CORE BEHAVIOR:
- Always use available tools to get current, accurate data
- Never make up property information or prices
- If a search returns no results, suggest alternative criteria
- Be conversational but professional

TOOL USAGE GUIDELINES:
- Use findListings() for all property searches
- Always include relevant filters based on user requirements
- For email requests, use sendListingReport() with exact listing IDs from search results

ERROR HANDLING:
- If tools fail, explain what went wrong and suggest alternatives
- Never claim to have data you don't actually have`,

  toolDescriptions: {
    findListings: `Search for property listings using specific criteria. 
    
USAGE: When users ask about properties (buy, rent, find, search), extract their requirements into the filter parameters.

EXAMPLES:
- "3-bedroom houses in Portland under $800k" → {city: "Portland", minBedrooms: 3, maxPrice: 800000}
- "active listings in Seattle" → {city: "Seattle", status: "Active"}`,

    sendListingReport: `Send an email report containing specific property listings.

USAGE: Only when user explicitly requests email/report functionality. Always use listing IDs from findListings() results.

REQUIRED: User must provide or confirm recipient email address.`,
  },
} as const;
```

Instead of relying on the LLM to figure out how to use tools, we explicitly define the behavior we want. This follows [Factor 2](https://github.com/humanlayer/12-factor-agents#2-own-your-prompts) by taking full control of our prompt strategy.

## Factor 4: Tools are Structured Outputs

We already touched on this in Part 1 with TypeScript schemas, but [Factor 4](https://github.com/humanlayer/12-factor-agents#4-tools-are-structured-outputs) goes deeper: **treat every tool interaction as a structured data contract**.

Let's enhance our tool responses with consistent structure:

```typescript
// src/tools/structured-responses.ts
interface ToolResponse<T> {
  success: boolean;
  data?: T;
  error?: {
    code: string;
    message: string;
    suggestions?: string[];
  };
  metadata: {
    timestamp: string;
    executionTime: number;
    toolVersion: string;
  };
}

export function findListings(filters: ListingFilters): ToolResponse<Listing[]> {
  const startTime = Date.now();

  try {
    // Validate inputs first
    if (filters.maxPrice && filters.maxPrice < 0) {
      return {
        success: false,
        error: {
          code: "INVALID_PRICE",
          message: "Maximum price cannot be negative",
          suggestions: [
            "Try a positive price value",
            "Remove price filter for all listings",
          ],
        },
        metadata: {
          timestamp: new Date().toISOString(),
          executionTime: Date.now() - startTime,
          toolVersion: "1.0.0",
        },
      };
    }

    const results = mockListings.filter((listing) => {
      return (
        (!filters.status || listing.status === filters.status) &&
        (!filters.city ||
          listing.address.city.toLowerCase() === filters.city.toLowerCase()) &&
        (!filters.state ||
          listing.address.state.toLowerCase() ===
            filters.state.toLowerCase()) &&
        (!filters.minBedrooms || listing.bedrooms >= filters.minBedrooms) &&
        (!filters.maxPrice || listing.price <= filters.maxPrice)
      );
    });

    return {
      success: true,
      data: results,
      metadata: {
        timestamp: new Date().toISOString(),
        executionTime: Date.now() - startTime,
        toolVersion: "1.0.0",
      },
    };
  } catch (error) {
    return {
      success: false,
      error: {
        code: "SEARCH_ERROR",
        message: "Failed to search listings",
        suggestions: [
          "Try simplifying your search criteria",
          "Contact support if this persists",
        ],
      },
      metadata: {
        timestamp: new Date().toISOString(),
        executionTime: Date.now() - startTime,
        toolVersion: "1.0.0",
      },
    };
  }
}
```

This structured approach makes debugging easier and gives the models consistent, predictable data to work with.

## Factor 9: Compact Errors into Context Window

[Factor 9](https://github.com/humanlayer/12-factor-agents#9-compact-errors-into-context-window) addresses a critical production issue: **error handling that doesn't blow up your context window**.

![Error Compaction Strategy](https://raw.githubusercontent.com/humanlayer/12-factor-agents/main/img/190-factor-9-errors-static.png)
_Source: [12 Factor Agents - Factor 9: Compact Errors](https://github.com/humanlayer/12-factor-agents)_

When things go wrong, you want helpful error information without overwhelming the models with stack traces and verbose logs:

```typescript
// src/utils/error-compaction.ts
interface CompactError {
  type: "tool_error" | "validation_error" | "network_error" | "business_error";
  tool?: string;
  code: string;
  userMessage: string;
  debugInfo?: string;
  retryable: boolean;
  suggestedActions: string[];
}

export function compactError(
  error: any,
  context: { tool?: string },
): CompactError {
  // Network/API errors
  if (error.code === "ECONNREFUSED" || error.status >= 500) {
    return {
      type: "network_error",
      tool: context.tool,
      code: "SERVICE_UNAVAILABLE",
      userMessage: "The service is temporarily unavailable",
      retryable: true,
      suggestedActions: [
        "Try again in a few moments",
        "Check if you have an internet connection",
      ],
    };
  }

  // Validation errors
  if (error.code === "INVALID_INPUT") {
    return {
      type: "validation_error",
      tool: context.tool,
      code: error.code,
      userMessage: error.message,
      retryable: false,
      suggestedActions: error.suggestions || ["Check your input parameters"],
    };
  }

  // Business logic errors
  if (error.code === "NO_RESULTS") {
    return {
      type: "business_error",
      tool: context.tool,
      code: "NO_RESULTS",
      userMessage: "No properties found matching your criteria",
      retryable: false,
      suggestedActions: [
        "Try broader search criteria",
        "Remove some filters",
        "Search in nearby areas",
      ],
    };
  }

  // Fallback for unexpected errors
  return {
    type: "tool_error",
    tool: context.tool,
    code: "UNKNOWN_ERROR",
    userMessage: "Something went wrong with the search",
    debugInfo: error.message?.substring(0, 200), // Truncated for context economy
    retryable: true,
    suggestedActions: ["Try again", "Contact support if this persists"],
  };
}
```

Now your error handling is consistent and context-efficient:

```typescript
// In your tool execution
try {
  const result = await findListings(filters);
  return result;
} catch (error) {
  const compactError = compactError(error, { tool: "findListings" });

  // Log full error for debugging (not sent to model)
  console.error("Tool execution failed:", error);

  // Return compact error to model
  return {
    success: false,
    error: compactError,
    metadata: {
      timestamp: new Date().toISOString(),
      executionTime: 0,
      toolVersion: "1.0.0",
    },
  };
}
```

## Factor 10: Small, Focused Agents

[Factor 10](https://github.com/humanlayer/12-factor-agents#10-small-focused-agents) emphasizes building **specialized agents instead of do-everything systems**. Our real estate assistant can be broken down into focused components:

![Small Focused Agents Architecture](https://raw.githubusercontent.com/humanlayer/12-factor-agents/main/img/1a0-small-focused-agents.png)
_Source: [12 Factor Agents - Factor 10: Small, Focused Agents](https://github.com/humanlayer/12-factor-agents)_

```typescript
// src/agents/property-search-agent.ts
export class PropertySearchAgent {
  constructor(
    private tools: { findListings: Function },
    private prompts: typeof SYSTEM_PROMPTS,
  ) {}

  async handleSearchRequest(userQuery: string, conversationHistory: Message[]) {
    const systemPrompt = this.prompts.realEstateAgent;
    const toolPrompt = this.prompts.toolDescriptions.findListings;

    return await this.llm.complete(
      [
        {
          role: "system",
          content: `${systemPrompt}\n\nTOOL AVAILABLE:\n${toolPrompt}`,
        },
        ...conversationHistory,
        { role: "user", content: userQuery },
      ],
      {
        tools: [this.tools.findListings],
        maxTokens: 1000,
      },
    );
  }
}

// src/agents/report-agent.ts
export class ReportAgent {
  constructor(
    private tools: { sendListingReport: Function },
    private prompts: typeof SYSTEM_PROMPTS,
  ) {}

  async handleReportRequest(listingIds: string[], email: string) {
    const systemPrompt = this.prompts.realEstateAgent;
    const toolPrompt = this.prompts.toolDescriptions.sendListingReport;

    // Focused only on report generation
    return await this.llm.complete(
      [
        {
          role: "system",
          content: `${systemPrompt}\n\nTOOL AVAILABLE:\n${toolPrompt}`,
        },
        {
          role: "user",
          content: `Send a report for listings ${listingIds.join(", ")} to ${email}`,
        },
      ],
      {
        tools: [this.tools.sendListingReport],
        maxTokens: 500,
      },
    );
  }
}
```

This modular approach makes testing easier and reduces the complexity each agent needs to handle.

## Factor 12: Make Your Agent a Stateless Reducer

[Factor 12](https://github.com/humanlayer/12-factor-agents#12-make-your-agent-a-stateless-reducer) is about **predictable, reproducible agent behavior**. Given the same inputs, your agent should produce the same outputs.

![Stateless Reducer Pattern](https://raw.githubusercontent.com/humanlayer/12-factor-agents/main/img/1c0-stateless-reducer.png)
_Source: [12 Factor Agents - Factor 12: Stateless Reducer](https://github.com/humanlayer/12-factor-agents)_

```typescript
// src/agents/stateless-agent.ts
interface AgentState {
  conversationHistory: Message[];
  userPreferences: UserPreferences;
  sessionContext: SessionContext;
}

interface AgentAction {
  type: "user_message" | "tool_call" | "tool_result" | "agent_response";
  payload: any;
  timestamp: string;
}

export class StatelessRealEstateAgent {
  // Pure function: state + action → new state
  static reduce(currentState: AgentState, action: AgentAction): AgentState {
    switch (action.type) {
      case "user_message":
        return {
          ...currentState,
          conversationHistory: [
            ...currentState.conversationHistory,
            {
              role: "user",
              content: action.payload.message,
              timestamp: action.timestamp,
            },
          ],
        };

      case "tool_result":
        return {
          ...currentState,
          conversationHistory: [
            ...currentState.conversationHistory,
            {
              role: "tool",
              content: JSON.stringify(action.payload),
              timestamp: action.timestamp,
            },
          ],
        };

      case "agent_response":
        return {
          ...currentState,
          conversationHistory: [
            ...currentState.conversationHistory,
            {
              role: "assistant",
              content: action.payload.response,
              timestamp: action.timestamp,
            },
          ],
        };

      default:
        return currentState;
    }
  }

  // Pure function: state → next action
  static async getNextAction(state: AgentState): Promise<AgentAction> {
    const lastMessage =
      state.conversationHistory[state.conversationHistory.length - 1];

    if (lastMessage?.role === "user") {
      // Determine if this requires a tool call
      if (this.isSearchQuery(lastMessage.content)) {
        return {
          type: "tool_call",
          payload: {
            tool: "findListings",
            args: this.extractSearchFilters(lastMessage.content),
          },
          timestamp: new Date().toISOString(),
        };
      }
    }

    // Default to generating a response
    return {
      type: "agent_response",
      payload: { response: await this.generateResponse(state) },
      timestamp: new Date().toISOString(),
    };
  }

  private static isSearchQuery(message: string): boolean {
    const searchKeywords = ["find", "search", "looking for", "show me", "list"];
    return searchKeywords.some((keyword) =>
      message.toLowerCase().includes(keyword),
    );
  }

  private static extractSearchFilters(message: string): ListingFilters {
    // Extract filters from natural language
    // This could use another LLM call or rule-based extraction
    return {}; // Simplified for example
  }
}
```

This stateless approach makes your agent **deterministic and testable**:

```typescript
// src/agents/agent.test.ts
describe("StatelessRealEstateAgent", () => {
  it("should produce consistent responses for same inputs", async () => {
    const initialState: AgentState = {
      conversationHistory: [],
      userPreferences: {},
      sessionContext: {},
    };

    const userAction: AgentAction = {
      type: "user_message",
      payload: { message: "Find 3-bedroom houses in Portland" },
      timestamp: "2025-07-05T10:00:00Z",
    };

    // Should always produce the same state transformation
    const newState1 = StatelessRealEstateAgent.reduce(initialState, userAction);
    const newState2 = StatelessRealEstateAgent.reduce(initialState, userAction);

    expect(newState1).toEqual(newState2);
  });
});
```

## Applying to MCP Architecture

If you're using MCP (from Part 2), these patterns integrate seamlessly. Your MCP servers become **specialized, focused agents** (Factor 10), while your main application orchestrates them using **stateless reduction patterns** (Factor 12):

```typescript
// Enhanced MCP client with 12 Factor patterns
export class ProductionMCPClient {
  constructor(private mcpServers: Map<string, string>) {}

  async callTool(toolName: string, args: any): Promise<ToolResponse<any>> {
    const serverUrl = this.mcpServers.get(toolName);
    if (!serverUrl) {
      return this.createErrorResponse(
        "TOOL_NOT_FOUND",
        `Tool ${toolName} not available`,
      );
    }

    try {
      const result = await ky
        .post(`${serverUrl}/tools/call`, {
          json: { name: toolName, arguments: args },
          timeout: 10000, // Factor 6: Simple APIs with timeouts
        })
        .json();

      return result;
    } catch (error) {
      // Factor 9: Compact errors
      return this.createErrorResponse(
        "MCP_CALL_FAILED",
        "Tool execution failed",
        error,
      );
    }
  }

  private createErrorResponse(
    code: string,
    message: string,
    originalError?: any,
  ): ToolResponse<any> {
    return {
      success: false,
      error: compactError(originalError || new Error(message), { tool: "mcp" }),
      metadata: {
        timestamp: new Date().toISOString(),
        executionTime: 0,
        toolVersion: "1.0.0",
      },
    };
  }
}
```

## The Production Difference

These patterns transform your agent from a working prototype into a production system:

**Before 12 Factor:**

- Inconsistent behavior across sessions
- Debugging requires guesswork
- Errors crash conversations
- Adding features breaks existing functionality

**After 12 Factor:**

- Predictable, testable behavior
- Clear error messages and logging
- Graceful error recovery
- Modular, maintainable architecture

The [12 Factor Agents methodology](https://github.com/humanlayer/12-factor-agents) gives you a roadmap for building AI systems that feel like professional software, not fragile experiments.

## Conclusion

Production-ready AI agents aren't just about having better prompts or more tools. They're about applying proven software engineering principles to create systems that are **reliable, maintainable, and debuggable**.

The [12 Factor Agents approach](https://github.com/humanlayer/12-factor-agents) provides exactly that framework. By treating agents as software systems with explicit contracts, structured data flows, and predictable behavior, you can build AI applications that work consistently for real users.

Whether you're using direct tool integration (Part 1) or MCP architecture (Part 2), these production patterns will help you ship AI systems that users can depend on.

_Start from the beginning: [LLM Tools: From Chatbot to Real-World Agent (Part 1)](/blog/llm-tools-chatbot-to-agent-part-1) → [LLM Tools: Scaling with MCP Architecture (Part 2)](/blog/llm-tools-scaling-with-mcp-part-2)_
