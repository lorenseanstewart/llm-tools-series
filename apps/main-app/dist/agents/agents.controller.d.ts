import { AgentsService } from "./agents.service";
import { ChatHistoryService } from "./chat-history.service";
import { ChatRequestDto } from "./dto/chat-request.dto";
interface ChatResponseDto {
    success: boolean;
    message: string;
    timestamp: string;
}
export declare class AgentsController {
    private readonly agentsService;
    private readonly chatHistoryService;
    constructor(agentsService: AgentsService, chatHistoryService: ChatHistoryService);
    chat(body: ChatRequestDto): Promise<ChatResponseDto>;
    getChatHistory(userId: string, limit?: string): Promise<{
        success: boolean;
        userId: string;
        history: import("@llm-tools/shared-types").OpenRouterMessage[];
        count: number;
        timestamp: string;
    }>;
    getChatHistoryStats(): Promise<{
        success: boolean;
        stats: {
            totalUsers: number;
            totalMessages: number;
            averageMessagesPerUser: number;
        };
        timestamp: string;
    }>;
}
export {};
