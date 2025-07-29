import { Injectable, Logger, OnModuleInit } from "@nestjs/common";
import { ConfigService } from "@nestjs/config";
import axios from "axios";
import * as jwt from "jsonwebtoken";
import { MCPClient } from "@llm-tools/mcp-client";
import { MCPTool, OpenRouterMessage, ToolCall, OpenRouterResponse, Tool } from "@llm-tools/shared-types";
import { TOOL_SELECTION_PROMPT, RESPONSE_GENERATION_PROMPT } from "./system.prompts";
import { ChatHistoryService } from "./chat-history.service";
import { FastifyReply } from "fastify";
import { StreamingService, FastifyStreamEventSender } from "./streaming.service";

@Injectable()
export class AgentsService implements OnModuleInit {
  private readonly logger = new Logger(AgentsService.name);
  private readonly openrouterUrl = "https://openrouter.ai/api/v1/chat/completions";
  
  private readonly mcpClients: MCPClient[] = [];
  private tools: Tool[] = [];
  private currentUserId?: string;

  constructor(
    private readonly configService: ConfigService,
    private readonly chatHistoryService: ChatHistoryService,
    private readonly streamingService: StreamingService
  ) {
    // MCP clients will be initialized in onModuleInit
  }

  async onModuleInit() {
    // Initialize MCP clients for each server with service token
    const serviceToken = this.generateServiceToken();
    
    this.mcpClients.push(
      new MCPClient({
        baseURL: this.configService.get<string>("MCP_LISTINGS_URL") || "http://localhost:3001",
        timeout: 10000,
        retries: 3,
        authToken: serviceToken
      }),
      new MCPClient({
        baseURL: this.configService.get<string>("MCP_ANALYTICS_URL") || "http://localhost:3002",
        timeout: 10000,
        retries: 3,
        authToken: serviceToken
      })
    );
    
    await this.discoverTools();
  }

  private generateServiceToken(userId?: string): string {
    const jwtSecret = this.configService.get<string>('JWT_SECRET') || 'your-secret-key';
    return jwt.sign(
      { 
        serviceId: 'main-app',
        userId: userId,
        iat: Date.now() 
      },
      jwtSecret,
      { expiresIn: '1h' }
    );
  }

  private async discoverTools(): Promise<void> {
    this.logger.log("Discovering tools from MCP servers...");
    const allTools: Tool[] = [];

    for (const client of this.mcpClients) {
      try {
        const mcpTools = await client.discoverTools();
        
        // Convert MCP tools to OpenRouter tool format
        const openRouterTools: Tool[] = mcpTools.map((mcpTool: MCPTool) => ({
          type: "function",
          function: {
            name: mcpTool.name,
            description: mcpTool.description,
            parameters: mcpTool.inputSchema
          }
        }));

        allTools.push(...openRouterTools);
        this.logger.log(`Discovered ${mcpTools.length} tools from MCP server`);
      } catch (error) {
        this.logger.warn(`Failed to discover tools from MCP server: ${error instanceof Error ? error.message : String(error)}`);
      }
    }

    this.tools = allTools;
    this.logger.log(`Total tools available: ${this.tools.length}`);
  }

  async chat(userId: string, userMessage: string): Promise<string> {
    try {
      // Update current user ID and refresh tokens with user context
      this.currentUserId = userId;
      const userToken = this.generateServiceToken(userId);
      this.mcpClients.forEach(client => {
        if (client.setAuthToken) {
          client.setAuthToken(userToken);
        }
      });
      
      // Step 1: Get chat history for context
      const chatHistory = await this.chatHistoryService.getChatHistory(userId, 5);
      
      // Step 2: Save user message to history
      const userMsg: OpenRouterMessage = {
        role: "user",
        content: userMessage
      };
      await this.chatHistoryService.saveChatMessage(userId, userMsg);

      // Step 3: Build messages with history context
      const messages: OpenRouterMessage[] = [
        {
          role: "system",
          content: TOOL_SELECTION_PROMPT
        },
        ...chatHistory, // Include previous conversation context
        {
          role: "user",
          content: userMessage
        }
      ];

      // Step 4: Send to Kimi K2 for tool decision
      const toolResponse = await this.callOpenRouter("moonshotai/kimi-k2", messages, this.tools);

      // Step 5: Check if tools were called
      if (toolResponse?.choices?.[0]?.message?.tool_calls) {
        const toolCall = toolResponse.choices[0].message.tool_calls[0];
        const toolResult = await this.executeTool(toolCall);

        // Step 6: Generate response with tool context
        const assistantResponse = await this.generateResponse(userId, userMessage, toolCall, toolResult);
        
        // Step 7: Save assistant response to history
        await this.chatHistoryService.saveChatMessage(userId, {
          role: "assistant",
          content: assistantResponse
        });

        return assistantResponse;
      } else {
        // No tools needed, use Gemini for direct response
        const assistantResponse = await this.generateResponse(userId, userMessage);
        
        // Save assistant response to history
        await this.chatHistoryService.saveChatMessage(userId, {
          role: "assistant",
          content: assistantResponse
        });

        return assistantResponse;
      }
    } catch (error) {
      // Log only the error message, not the entire error object
      const errorMessage = error instanceof Error ? error.message : String(error);
      this.logger.error(`Chat error: ${errorMessage}`);
      
      // Return user-friendly error message
      if (errorMessage.includes('OpenRouter API key not configured')) {
        return "The OpenRouter API key is not configured. Please add your API key to the .env file.";
      } else if (errorMessage.includes('OpenRouter authentication failed')) {
        return "Authentication with OpenRouter failed. Please check your API key.";
      }
      
      return "Sorry, I encountered an error. Please try again.";
    }
  }

  private async callOpenRouter(
    model: string, 
    messages: OpenRouterMessage[], 
    tools?: Tool[]
  ): Promise<OpenRouterResponse> {
    const apiKey = this.configService.get<string>("OPENROUTER_API_KEY");
    
    // Check if API key is configured
    if (!apiKey || apiKey === 'your_openrouter_api_key_here') {
      throw new Error('OpenRouter API key not configured. Please set OPENROUTER_API_KEY in your .env file');
    }
    
    const body: Record<string, any> = {
      model,
      messages
    };

    if (tools) {
      body.tools = tools;
      body.tool_choice = "auto";
    }

    try {
      const response = await axios.post(this.openrouterUrl, body, {
        headers: {
          "Authorization": `Bearer ${apiKey}`,
          "HTTP-Referer": this.configService.get<string>("SITE_URL") || "http://localhost:3000",
          "X-Title": "Real Estate AI Agent",
          "Content-Type": "application/json"
        }
      });

      return response.data;
    } catch (error: any) {
      if (error.response?.status === 401) {
        throw new Error('OpenRouter authentication failed. Please check your API key.');
      } else if (error.response) {
        throw new Error(`OpenRouter API error: ${error.response.status} - ${error.response.data?.error?.message || error.response.statusText}`);
      } else {
        throw new Error(`Failed to connect to OpenRouter: ${error.message}`);
      }
    }
  }

  private async executeTool(toolCall: ToolCall): Promise<any> {
    const { name, arguments: args } = toolCall.function;
    const parsedArgs = JSON.parse(args);

    this.logger.log(`🔧 Executing tool: ${name}`);
    this.logger.log(`📋 Tool arguments:`, JSON.stringify(parsedArgs, null, 2));

    // Try to execute the tool on each MCP client until one succeeds
    for (const client of this.mcpClients) {
      try {
        const response = await client.callTool({
          name,
          arguments: parsedArgs
        });

        if (response.error) {
          this.logger.warn(`❌ Tool execution error from MCP server: ${response.error}`);
          continue;
        }

        this.logger.log(`✅ Tool result:`, JSON.stringify(response.result, null, 2));
        return response.result;
      } catch (error) {
        this.logger.warn(`Failed to execute tool on MCP server: ${error instanceof Error ? error.message : String(error)}`);
        continue;
      }
    }

    throw new Error(`Failed to execute tool ${name} on any MCP server`);
  }

  private async generateResponse(
    userId: string,
    userMessage: string, 
    toolCall?: ToolCall, 
    toolResult?: any
  ): Promise<string> {
    // Get recent chat history for context
    const chatHistory = await this.chatHistoryService.getChatHistory(userId, 3);
    
    // Build a single comprehensive user message with tool context
    let finalUserMessage = userMessage;
    
    if (toolCall && toolResult) {
      if (toolCall.function.name === "findListings") {
        finalUserMessage = `${userMessage}\n\nI searched for listings and found ${Array.isArray(toolResult) ? toolResult.length : 'some'} properties. Please present these listings in a friendly, readable format:\n\n${JSON.stringify(toolResult, null, 2)}`;
      } else if (toolCall.function.name === "sendListingReport") {
        finalUserMessage = `${userMessage}\n\nReport result: ${JSON.stringify(toolResult)}`;
      } else if (toolCall.function.name === "getListingMetrics") {
        finalUserMessage = `${userMessage}\n\nAnalytics data: ${JSON.stringify(toolResult)}`;
      } else if (toolCall.function.name === "getMarketAnalysis") {
        finalUserMessage = `${userMessage}\n\nMarket analysis: ${JSON.stringify(toolResult)}`;
      } else if (toolCall.function.name === "generatePerformanceReport") {
        finalUserMessage = `${userMessage}\n\nPerformance report: ${JSON.stringify(toolResult)}`;
      } else {
        finalUserMessage = `${userMessage}\n\nTool result: ${JSON.stringify(toolResult)}`;
      }
    }

    const messages: OpenRouterMessage[] = [
      {
        role: "system",
        content: RESPONSE_GENERATION_PROMPT
      },
      ...chatHistory, // Include conversation context
      {
        role: "user",
        content: finalUserMessage
      }
    ];

    this.logger.log(`💬 Sending to response generation model:`, JSON.stringify(messages, null, 2));
    const response = await this.callOpenRouter("google/gemini-2.0-flash-001", messages);
    
    this.logger.log(`💬 Response generation - Model: google/gemini-2.0-flash-001`);
    this.logger.log(`📤 Response:`, JSON.stringify(response.choices[0]?.message, null, 2));
    
    const content = response.choices[0]?.message?.content;
    if (!content) {
      this.logger.warn(`⚠️ Empty response content from Gemini`);
      return "I found the listings but had trouble formatting the response. Please try again.";
    }
    
    return content;
  }

  /**
   * TESTABILITY STRATEGY #5: Linear Control Flow
   * 
   * The chatStream method follows a clear, testable sequence:
   * 1. Create event sender (mockable interface)
   * 2. Save user message
   * 3. Send status updates 
   * 4. Check for tool calls (async/await)
   * 5. Execute tools or stream directly
   * 6. Save result
   * 
   * This design enables safe, predictable testing:
   * ```
   * const mockEventSender = { sendEvent: jest.fn(), end: jest.fn(), onClose: jest.fn() };
   * const mockStreamingService = { streamResponse: jest.fn().mockResolvedValue('test') };
   * 
   * await service.chatStream('user', 'message', mockResponse);
   * expect(mockStreamingService.streamResponse).toHaveBeenCalled();
   * ```
   */
  async chatStream(userId: string, userMessage: string, res: FastifyReply): Promise<void> {
    const eventSender = new FastifyStreamEventSender(res);
    let timeoutId: NodeJS.Timeout | undefined;
    let hasStartedStreaming = false;

    const setupTimeout = (duration: number) => {
      if (timeoutId) {
        clearTimeout(timeoutId);
      }
      timeoutId = setTimeout(() => {
        const message = hasStartedStreaming 
          ? 'Stream timeout - taking longer than expected'
          : 'Request timeout - no response received';
        
        eventSender.sendEvent({ type: 'error', message });
        eventSender.end();
      }, duration);
    };

    // Initial timeout for connection/first response
    setupTimeout(60000); // 60 seconds for initial response

    // Check if client disconnected
    res.raw.on('close', () => {
      if (timeoutId) {
        clearTimeout(timeoutId);
      }
      // Cleanup any ongoing operations
    });
    
    try {
      // Update current user ID and refresh tokens with user context
      this.currentUserId = userId;
      const userToken = this.generateServiceToken(userId);
      this.mcpClients.forEach(client => {
        if (client.setAuthToken) {
          client.setAuthToken(userToken);
        }
      });

      // Save user message to history
      await this.chatHistoryService.saveChatMessage(userId, {
        role: "user",
        content: userMessage
      });

      // Send initial status
      this.streamingService.sendStatusEvent(eventSender, 'Discovering available tools...');
      this.streamingService.sendHeartbeat(eventSender);

      // Get chat history and build messages
      const history = await this.chatHistoryService.getChatHistory(userId, 5);
      const messages: OpenRouterMessage[] = [
        {
          role: "system",
          content: TOOL_SELECTION_PROMPT
        },
        ...history,
        {
          role: "user",
          content: userMessage
        }
      ];

      // Check if tools are needed (non-streaming call to Kimi)
      const toolResponse = await this.callOpenRouter("moonshotai/kimi-k2", messages, this.tools);
      
      if (toolResponse?.choices?.[0]?.message?.tool_calls) {
        hasStartedStreaming = true;
        // Extend timeout once streaming starts
        setupTimeout(120000); // 2 minutes for ongoing stream
        
        // Execute tools first
        const toolCall = toolResponse.choices[0].message.tool_calls[0];
        await this.executeToolWithEvents(toolCall, eventSender);
        
        // Get tool result for context
        const toolResult = await this.executeTool(toolCall);
        
        // Stream the final response with tool context
        const finalContent = await this.streamFinalResponseWithTool(userId, userMessage, eventSender, toolCall, toolResult);
        
        // Save to history
        await this.chatHistoryService.saveChatMessage(userId, {
          role: "assistant",
          content: finalContent
        });
      } else {
        hasStartedStreaming = true;
        // Extend timeout once streaming starts
        setupTimeout(120000); // 2 minutes for ongoing stream
        
        // No tools needed, stream direct response
        const finalContent = await this.streamFinalResponseDirect(userId, userMessage, eventSender);
        
        // Save to history
        await this.chatHistoryService.saveChatMessage(userId, {
          role: "assistant",
          content: finalContent
        });
      }
      
      if (timeoutId) {
        clearTimeout(timeoutId);
      }
    } catch (error) {
      if (timeoutId) {
        clearTimeout(timeoutId);
      }
      
      // Log only the error message, not the entire error object
      const errorMessage = error instanceof Error ? error.message : String(error);
      this.logger.error(`Stream chat error: ${errorMessage}`);
      
      if (errorMessage.includes('cancelled')) {
        // Handle cancellation gracefully
        eventSender.sendEvent({
          type: 'cancelled',
          message: 'Request was cancelled'
        });
      } else if (errorMessage.includes('OpenRouter API key not configured')) {
        eventSender.sendEvent({
          type: 'error',
          message: 'The OpenRouter API key is not configured. Please add your API key to the .env file.'
        });
      } else if (errorMessage.includes('OpenRouter authentication failed')) {
        eventSender.sendEvent({
          type: 'error',
          message: 'Authentication with OpenRouter failed. Please check your API key.'
        });
      } else {
        eventSender.sendEvent({
          type: 'error',
          message: errorMessage || "An error occurred during streaming"
        });
      }
      eventSender.end();
    }
  }

  /**
   * TESTABILITY STRATEGY #6: Single Responsibility Methods
   * 
   * Each method has a focused responsibility for safe, isolated testing:
   * - executeToolWithEvents: handles tool execution + event emission
   * - streamFinalResponseWithTool: handles streaming with tool context
   * - streamFinalResponseDirect: handles streaming without tools
   * - buildToolContextMessage: pure function for message building
   * 
   * This design enables focused testing of individual behaviors:
   * ```
   * // Test tool execution separately from streaming
   * await service.executeToolWithEvents(toolCall, mockSender);
   * expect(mockSender.sendEvent).toHaveBeenCalledWith({type: 'tool-execution', status: 'starting'});
   * 
   * // Test message building as pure function
   * const message = service.buildToolContextMessage('query', toolCall, result);
   * expect(message).toContain('found 3 properties');
   * ```
   */
  private async executeToolWithEvents(toolCall: ToolCall, eventSender: any): Promise<void> {
    this.streamingService.sendToolExecutionEvent(eventSender, toolCall.function.name, 'starting');

    try {
      const result = await this.executeTool(toolCall);
      this.streamingService.sendToolExecutionEvent(eventSender, toolCall.function.name, 'completed', result);
    } catch (error) {
      this.streamingService.sendToolExecutionEvent(eventSender, toolCall.function.name, 'failed', undefined, error.message);
      throw error;
    }
  }

  private async streamFinalResponseWithTool(
    userId: string,
    userMessage: string,
    eventSender: any,
    toolCall: ToolCall,
    toolResult: any
  ): Promise<string> {
    const chatHistory = await this.chatHistoryService.getChatHistory(userId, 3);
    const finalUserMessage = this.buildToolContextMessage(userMessage, toolCall, toolResult);

    const messages: OpenRouterMessage[] = [
      {
        role: "system",
        content: RESPONSE_GENERATION_PROMPT
      },
      ...chatHistory,
      {
        role: "user",
        content: finalUserMessage
      }
    ];

    return await this.streamingService.streamResponse(messages, eventSender);
  }

  private async streamFinalResponseDirect(
    userId: string,
    userMessage: string,
    eventSender: any
  ): Promise<string> {
    const chatHistory = await this.chatHistoryService.getChatHistory(userId, 3);

    const messages: OpenRouterMessage[] = [
      {
        role: "system",
        content: RESPONSE_GENERATION_PROMPT
      },
      ...chatHistory,
      {
        role: "user",
        content: userMessage
      }
    ];

    return await this.streamingService.streamResponse(messages, eventSender);
  }

  private buildToolContextMessage(userMessage: string, toolCall: ToolCall, toolResult: any): string {
    if (toolCall.function.name === "findListings") {
      return `${userMessage}\n\nI searched for listings and found ${Array.isArray(toolResult) ? toolResult.length : 'some'} properties. Please present these listings in a friendly, readable format:\n\n${JSON.stringify(toolResult, null, 2)}`;
    } else if (toolCall.function.name === "sendListingReport") {
      return `${userMessage}\n\nReport result: ${JSON.stringify(toolResult)}`;
    } else if (toolCall.function.name === "getListingMetrics") {
      return `${userMessage}\n\nAnalytics data: ${JSON.stringify(toolResult)}`;
    } else if (toolCall.function.name === "getMarketAnalysis") {
      return `${userMessage}\n\nMarket analysis: ${JSON.stringify(toolResult)}`;
    } else if (toolCall.function.name === "generatePerformanceReport") {
      return `${userMessage}\n\nPerformance report: ${JSON.stringify(toolResult)}`;
    } else {
      return `${userMessage}\n\nTool result: ${JSON.stringify(toolResult)}`;
    }
  }

}
