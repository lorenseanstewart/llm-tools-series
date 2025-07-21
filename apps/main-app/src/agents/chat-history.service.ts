import { Injectable, Logger } from '@nestjs/common';
import { OpenRouterMessage } from '@llm-tools/shared-types';

export interface ChatHistoryEntry {
  id: string;
  userId: string;
  message: OpenRouterMessage;
  timestamp: Date;
}

@Injectable()
export class ChatHistoryService {
  private readonly logger = new Logger(ChatHistoryService.name);
  
  // Mock in-memory storage - in production this would be a database
  private chatHistory: Map<string, ChatHistoryEntry[]> = new Map();

  /**
   * Save a chat message to user's history
   */
  async saveChatMessage(
    userId: string,
    message: OpenRouterMessage,
    messageId?: string
  ): Promise<void> {
    const historyEntry: ChatHistoryEntry = {
      id: messageId || this.generateMessageId(),
      userId,
      message,
      timestamp: new Date(),
    };

    if (!this.chatHistory.has(userId)) {
      this.chatHistory.set(userId, []);
    }

    this.chatHistory.get(userId)!.push(historyEntry);
    
    // Keep only last 20 messages per user for memory management
    const userHistory = this.chatHistory.get(userId)!;
    if (userHistory.length > 20) {
      this.chatHistory.set(userId, userHistory.slice(-20));
    }

    this.logger.log(`Saved message for user ${userId}: ${message.role}`);
  }

  /**
   * Get chat history for a user
   */
  async getChatHistory(userId: string, limit: number = 10): Promise<OpenRouterMessage[]> {
    const userHistory = this.chatHistory.get(userId) || [];
    
    // Get the last N messages and extract just the message content
    const recentHistory = userHistory
      .slice(-limit)
      .map(entry => entry.message);

    this.logger.log(`Retrieved ${recentHistory.length} messages for user ${userId}`);
    
    return recentHistory;
  }

  /**
   * Clear chat history for a user
   */
  async clearChatHistory(userId: string): Promise<void> {
    this.chatHistory.delete(userId);
    this.logger.log(`Cleared chat history for user ${userId}`);
  }

  /**
   * Get chat history stats (for monitoring)
   */
  async getChatHistoryStats(): Promise<{
    totalUsers: number;
    totalMessages: number;
    averageMessagesPerUser: number;
  }> {
    const totalUsers = this.chatHistory.size;
    const totalMessages = Array.from(this.chatHistory.values())
      .reduce((sum, history) => sum + history.length, 0);
    
    return {
      totalUsers,
      totalMessages,
      averageMessagesPerUser: totalUsers > 0 ? totalMessages / totalUsers : 0,
    };
  }

  /**
   * Generate a unique message ID
   */
  private generateMessageId(): string {
    return `msg_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }
}