"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
var __param = (this && this.__param) || function (paramIndex, decorator) {
    return function (target, key) { decorator(target, key, paramIndex); }
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.AgentsController = void 0;
const common_1 = require("@nestjs/common");
const agents_service_1 = require("./agents.service");
const chat_history_service_1 = require("./chat-history.service");
const chat_request_dto_1 = require("./dto/chat-request.dto");
let AgentsController = class AgentsController {
    agentsService;
    chatHistoryService;
    constructor(agentsService, chatHistoryService) {
        this.agentsService = agentsService;
        this.chatHistoryService = chatHistoryService;
    }
    async chat(body) {
        const response = await this.agentsService.chat(body.userId, body.userMessage);
        return {
            success: true,
            message: response,
            timestamp: new Date().toISOString()
        };
    }
    async getChatHistory(userId, limit) {
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
    async getChatHistoryStats() {
        const stats = await this.chatHistoryService.getChatHistoryStats();
        return {
            success: true,
            stats,
            timestamp: new Date().toISOString()
        };
    }
};
exports.AgentsController = AgentsController;
__decorate([
    (0, common_1.Post)("chat"),
    __param(0, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [chat_request_dto_1.ChatRequestDto]),
    __metadata("design:returntype", Promise)
], AgentsController.prototype, "chat", null);
__decorate([
    (0, common_1.Get)("chat-history/:userId"),
    __param(0, (0, common_1.Param)("userId")),
    __param(1, (0, common_1.Query)("limit")),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, String]),
    __metadata("design:returntype", Promise)
], AgentsController.prototype, "getChatHistory", null);
__decorate([
    (0, common_1.Get)("chat-history-stats"),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", []),
    __metadata("design:returntype", Promise)
], AgentsController.prototype, "getChatHistoryStats", null);
exports.AgentsController = AgentsController = __decorate([
    (0, common_1.Controller)("agents"),
    __metadata("design:paramtypes", [agents_service_1.AgentsService,
        chat_history_service_1.ChatHistoryService])
], AgentsController);
//# sourceMappingURL=agents.controller.js.map