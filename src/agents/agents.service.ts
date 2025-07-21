import { Injectable, Logger } from "@nestjs/common";
import { ConfigService } from "@nestjs/config";
import axios from "axios";
import { ToolsService } from "../tools/tools.service";
import { listingFiltersSchema } from "../schemas/listing-filters.schema";
import { OpenRouterMessage, ToolCall, OpenRouterResponse, Tool } from "../types/openrouter.types";
import { TOOL_SELECTION_PROMPT, RESPONSE_GENERATION_PROMPT } from "./system.prompts";

@Injectable()
export class AgentsService {
  private readonly logger = new Logger(AgentsService.name);
  private readonly openrouterUrl = "https://openrouter.ai/api/v1/chat/completions";

  constructor(
    private readonly toolsService: ToolsService,
    private readonly configService: ConfigService
  ) {}

  private readonly tools: Tool[] = [
    {
      type: "function",
      function: {
        name: "findListings",
        description: "Find property listings based on filters",
        parameters: listingFiltersSchema as Record<string, any>
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

  async chat(userMessage: string): Promise<string> {
    try {
      // Step 1: Send to Kimi K2 for tool decision
      const toolResponse = await this.callOpenRouter("moonshotai/kimi-k2", [
        {
          role: "system",
          content: TOOL_SELECTION_PROMPT
        },
        {
          role: "user",
          content: userMessage
        }
      ], this.tools);

      // Step 2: Check if tools were called
      if (toolResponse?.choices?.[0]?.message?.tool_calls) {
        const toolCall = toolResponse.choices[0].message.tool_calls[0];
        const toolResult = await this.executeTool(toolCall);

        // Step 3: Send to Gemini for natural response
        return this.generateResponse(userMessage, toolCall, toolResult);
      } else {
        // No tools needed, use Gemini for direct response
        return this.generateResponse(userMessage);
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

    this.logger.log(`Executing tool: ${name}`, parsedArgs);

    switch (name) {
      case "findListings":
        return await this.toolsService.findListings(parsedArgs);
      case "sendListingReport":
        return await this.toolsService.sendListingReport(
          parsedArgs.listingIds,
          parsedArgs.recipientEmail
        );
      default:
        throw new Error(`Unknown tool: ${name}`);
    }
  }

  private async generateResponse(
    userMessage: string, 
    toolCall?: ToolCall, 
    toolResult?: any
  ): Promise<string> {
    try {
      const messages: OpenRouterMessage[] = [
        {
          role: "system",
          content: RESPONSE_GENERATION_PROMPT
        },
        {
          role: "user",
          content: userMessage
        }
      ];

      // Add tool context if available - but clean it up for the conversational model
      if (toolCall && toolResult) {
        let contextMessage = "";
        
        if (toolCall.function.name === "findListings") {
          if (toolResult.length === 0) {
            contextMessage = "I searched the database but didn't find any properties matching those criteria.";
          } else {
            contextMessage = `I found ${toolResult.length} properties that match your criteria: ${JSON.stringify(toolResult, null, 2)}`;
          }
        } else if (toolCall.function.name === "sendListingReport") {
          contextMessage = `Report has been sent successfully.`;
        }
        
        messages.push({
          role: "user",
          content: `Tool result: ${contextMessage}`
        });
      }

      const response = await this.callOpenRouter("google/gemini-2.0-flash-001", messages);
      
      if (!response?.choices?.[0]?.message?.content) {
        this.logger.warn("Empty or invalid response from Gemini:", response);
        return toolCall && toolResult 
          ? `I found ${toolResult.length} properties. ${JSON.stringify(toolResult)}`
          : "I'm here to help with your real estate needs. What can I assist you with?";
      }

      return response.choices[0].message.content;
    } catch (error) {
      this.logger.error("Error generating response:", error);
      return toolCall && toolResult 
        ? `I found ${toolResult.length} properties. ${JSON.stringify(toolResult)}`
        : "I encountered an error generating a response. Please try again.";
    }
  }
}
