import { Controller, Post, Body, Get, Param, Query } from "@nestjs/common";
import { AgentsService } from "./agents.service";
import { ChatHistoryService } from "./chat-history.service";
import { ChatRequestDto } from "./dto/chat-request.dto";

interface ChatResponseDto {
  success: boolean;
  message: string;
  timestamp: string;
}

@Controller("agents")
export class AgentsController {
  constructor(
    private readonly agentsService: AgentsService,
    private readonly chatHistoryService: ChatHistoryService
  ) {}

  @Post("chat")
  async chat(@Body() body: ChatRequestDto): Promise<ChatResponseDto> {
    // Validation happens automatically via the ValidationPipe
    // No need for manual checks - NestJS will return 400 if validation fails
    
    const response = await this.agentsService.chat(body.userId, body.userMessage);
    
    return {
      success: true,
      message: response,
      timestamp: new Date().toISOString()
    };
  }

  @Get("chat-history/:userId")
  async getChatHistory(
    @Param("userId") userId: string,
    @Query("limit") limit?: string
  ) {
    const historyLimit = limit ? parseInt(limit) : 10;
    const history = await this.chatHistoryService.getChatHistory(userId, historyLimit);
    
    return {
      success: true,
      userId,
      history,
      count: history.length,
      timestamp: new Date().toISOString()
    };
  }

  @Get("chat-history-stats")
  async getChatHistoryStats() {
    const stats = await this.chatHistoryService.getChatHistoryStats();
    
    return {
      success: true,
      stats,
      timestamp: new Date().toISOString()
    };
  }
} 
