import { Controller, Post, Body } from "@nestjs/common";
import { AgentsService } from "./agents.service";
import { ChatRequestDto } from "./dto/chat-request.dto";

interface ChatResponseDto {
  success: boolean;
  message: string;
  timestamp: string;
}

@Controller("agents")
export class AgentsController {
  constructor(private readonly agentsService: AgentsService) {}

  @Post("chat")
  async chat(@Body() body: ChatRequestDto): Promise<ChatResponseDto> {
    // Validation happens automatically via the ValidationPipe
    // No need for manual checks - NestJS will return 400 if validation fails
    
    const response = await this.agentsService.chat(body.userMessage);
    
    return {
      success: true,
      message: response,
      timestamp: new Date().toISOString()
    };
  }
} 
