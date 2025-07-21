"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var ChatHistoryService_1;
Object.defineProperty(exports, "__esModule", { value: true });
exports.ChatHistoryService = void 0;
const common_1 = require("@nestjs/common");
let ChatHistoryService = ChatHistoryService_1 = class ChatHistoryService {
    logger = new common_1.Logger(ChatHistoryService_1.name);
    chatHistory = new Map();
    async saveChatMessage(userId, message, messageId) {
        const historyEntry = {
            id: messageId || this.generateMessageId(),
            userId,
            message,
            timestamp: new Date(),
        };
        if (!this.chatHistory.has(userId)) {
            this.chatHistory.set(userId, []);
        }
        this.chatHistory.get(userId).push(historyEntry);
        const userHistory = this.chatHistory.get(userId);
        if (userHistory.length > 20) {
            this.chatHistory.set(userId, userHistory.slice(-20));
        }
        this.logger.log(`Saved message for user ${userId}: ${message.role}`);
    }
    async getChatHistory(userId, limit = 10) {
        const userHistory = this.chatHistory.get(userId) || [];
        const recentHistory = userHistory
            .slice(-limit)
            .map(entry => entry.message);
        this.logger.log(`Retrieved ${recentHistory.length} messages for user ${userId}`);
        return recentHistory;
    }
    async clearChatHistory(userId) {
        this.chatHistory.delete(userId);
        this.logger.log(`Cleared chat history for user ${userId}`);
    }
    async getChatHistoryStats() {
        const totalUsers = this.chatHistory.size;
        const totalMessages = Array.from(this.chatHistory.values())
            .reduce((sum, history) => sum + history.length, 0);
        return {
            totalUsers,
            totalMessages,
            averageMessagesPerUser: totalUsers > 0 ? totalMessages / totalUsers : 0,
        };
    }
    generateMessageId() {
        return `msg_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    }
};
exports.ChatHistoryService = ChatHistoryService;
exports.ChatHistoryService = ChatHistoryService = ChatHistoryService_1 = __decorate([
    (0, common_1.Injectable)()
], ChatHistoryService);
//# sourceMappingURL=chat-history.service.js.map