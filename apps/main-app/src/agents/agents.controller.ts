import { Controller, Post, Body, Get, Param, Query, Sse, Response, UseGuards } from "@nestjs/common";
import { AgentsService } from "./agents.service";
import { ChatHistoryService } from "./chat-history.service";
import { ChatRequestDto } from "./dto/chat-request.dto";
import { FastifyReply } from "fastify";
import { JwtAuthGuard } from "../auth/guards/jwt-auth.guard";

interface ChatResponseDto {
  success: boolean;
  message: string;
  timestamp: string;
}

@Controller("agents")
@UseGuards(JwtAuthGuard)
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

  @Post("chat/stream")
  async streamChat(
    @Body() body: ChatRequestDto,
    @Response() res: FastifyReply
  ): Promise<void> {
    // Set up SSE headers
    res.type('text/event-stream');
    res.header('Cache-Control', 'no-cache');
    res.header('Connection', 'keep-alive');
    res.header('Access-Control-Allow-Origin', '*');
    res.header('Access-Control-Allow-Headers', 'Cache-Control');

    try {
      // Send immediate feedback
      this.sendEvent(res, {
        type: 'status',
        message: 'Starting conversation...'
      });

      // Stream the actual chat response
      await this.agentsService.chatStream(
        body.userId, 
        body.userMessage, 
        res
      );

      // Don't call res.send() - the stream will handle closing
    } catch (error) {
      this.sendEvent(res, {
        type: 'error',
        message: error.message
      });
      // Don't call res.send() - the stream will handle closing
    }
  }

  private sendEvent(res: FastifyReply, data: any): void {
    res.raw.write(`data: ${JSON.stringify(data)}\n\n`);
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
