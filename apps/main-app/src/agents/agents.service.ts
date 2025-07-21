import { Injectable, Logger, OnModuleInit } from "@nestjs/common";
import { ConfigService } from "@nestjs/config";
import axios from "axios";
import * as jwt from "jsonwebtoken";
import { MCPClient } from "@llm-tools/mcp-client";
import { MCPTool, OpenRouterMessage, ToolCall, OpenRouterResponse, Tool } from "@llm-tools/shared-types";
import { TOOL_SELECTION_PROMPT, RESPONSE_GENERATION_PROMPT } from "./system.prompts";
import { ChatHistoryService } from "./chat-history.service";

@Injectable()
export class AgentsService implements OnModuleInit {
  private readonly logger = new Logger(AgentsService.name);
  private readonly openrouterUrl = "https://openrouter.ai/api/v1/chat/completions";
  
  private readonly mcpClients: MCPClient[] = [];
  private tools: Tool[] = [];
  private currentUserId?: string;

  constructor(
    private readonly configService: ConfigService,
    private readonly chatHistoryService: ChatHistoryService
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
      this.mcpClients.forEach(client => client.setAuthToken(userToken));
      
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
      this.logger.error("Chat error:", error);
      return "Sorry, I encountered an error. Please try again.";
    }
  }

  private async callOpenRouter(
    model: string, 
    messages: OpenRouterMessage[], 
    tools?: Tool[]
  ): Promise<OpenRouterResponse> {
    const body: Record<string, any> = {
      model,
      messages
    };

    if (tools) {
      body.tools = tools;
      body.tool_choice = "auto";
    }

    const response = await axios.post(this.openrouterUrl, body, {
      headers: {
        "Authorization": `Bearer ${this.configService.get<string>("OPENROUTER_API_KEY")}`,
        "HTTP-Referer": this.configService.get<string>("SITE_URL") || "http://localhost:3000",
        "X-Title": "Real Estate AI Agent",
        "Content-Type": "application/json"
      }
    });

    return response.data;
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
}
