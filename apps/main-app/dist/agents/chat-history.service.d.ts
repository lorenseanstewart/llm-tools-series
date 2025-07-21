import { OpenRouterMessage } from '@llm-tools/shared-types';
export interface ChatHistoryEntry {
    id: string;
    userId: string;
    message: OpenRouterMessage;
    timestamp: Date;
}
export declare class ChatHistoryService {
    private readonly logger;
    private chatHistory;
    saveChatMessage(userId: string, message: OpenRouterMessage, messageId?: string): Promise<void>;
    getChatHistory(userId: string, limit?: number): Promise<OpenRouterMessage[]>;
    clearChatHistory(userId: string): Promise<void>;
    getChatHistoryStats(): Promise<{
        totalUsers: number;
        totalMessages: number;
        averageMessagesPerUser: number;
    }>;
    private generateMessageId;
}
