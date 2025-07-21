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
var AgentsService_1;
Object.defineProperty(exports, "__esModule", { value: true });
exports.AgentsService = void 0;
const common_1 = require("@nestjs/common");
const config_1 = require("@nestjs/config");
const axios_1 = require("axios");
const jwt = require("jsonwebtoken");
const mcp_client_1 = require("@llm-tools/mcp-client");
const system_prompts_1 = require("./system.prompts");
const chat_history_service_1 = require("./chat-history.service");
const streaming_service_1 = require("./streaming.service");
let AgentsService = AgentsService_1 = class AgentsService {
    configService;
    chatHistoryService;
    streamingService;
    logger = new common_1.Logger(AgentsService_1.name);
    openrouterUrl = "https://openrouter.ai/api/v1/chat/completions";
    mcpClients = [];
    tools = [];
    currentUserId;
    constructor(configService, chatHistoryService, streamingService) {
        this.configService = configService;
        this.chatHistoryService = chatHistoryService;
        this.streamingService = streamingService;
    }
    async onModuleInit() {
        const serviceToken = this.generateServiceToken();
        this.mcpClients.push(new mcp_client_1.MCPClient({
            baseURL: this.configService.get("MCP_LISTINGS_URL") || "http://localhost:3001",
            timeout: 10000,
            retries: 3,
            authToken: serviceToken
        }), new mcp_client_1.MCPClient({
            baseURL: this.configService.get("MCP_ANALYTICS_URL") || "http://localhost:3002",
            timeout: 10000,
            retries: 3,
            authToken: serviceToken
        }));
        await this.discoverTools();
    }
    generateServiceToken(userId) {
        const jwtSecret = this.configService.get('JWT_SECRET') || 'your-secret-key';
        return jwt.sign({
            serviceId: 'main-app',
            userId: userId,
            iat: Date.now()
        }, jwtSecret, { expiresIn: '1h' });
    }
    async discoverTools() {
        this.logger.log("Discovering tools from MCP servers...");
        const allTools = [];
        for (const client of this.mcpClients) {
            try {
                const mcpTools = await client.discoverTools();
                const openRouterTools = mcpTools.map((mcpTool) => ({
                    type: "function",
                    function: {
                        name: mcpTool.name,
                        description: mcpTool.description,
                        parameters: mcpTool.inputSchema
                    }
                }));
                allTools.push(...openRouterTools);
                this.logger.log(`Discovered ${mcpTools.length} tools from MCP server`);
            }
            catch (error) {
                this.logger.warn(`Failed to discover tools from MCP server: ${error instanceof Error ? error.message : String(error)}`);
            }
        }
        this.tools = allTools;
        this.logger.log(`Total tools available: ${this.tools.length}`);
    }
    async chat(userId, userMessage) {
        try {
            this.currentUserId = userId;
            const userToken = this.generateServiceToken(userId);
            this.mcpClients.forEach(client => {
                if (client.setAuthToken) {
                    client.setAuthToken(userToken);
                }
            });
            const chatHistory = await this.chatHistoryService.getChatHistory(userId, 5);
            const userMsg = {
                role: "user",
                content: userMessage
            };
            await this.chatHistoryService.saveChatMessage(userId, userMsg);
            const messages = [
                {
                    role: "system",
                    content: system_prompts_1.TOOL_SELECTION_PROMPT
                },
                ...chatHistory,
                {
                    role: "user",
                    content: userMessage
                }
            ];
            const toolResponse = await this.callOpenRouter("moonshotai/kimi-k2", messages, this.tools);
            if (toolResponse?.choices?.[0]?.message?.tool_calls) {
                const toolCall = toolResponse.choices[0].message.tool_calls[0];
                const toolResult = await this.executeTool(toolCall);
                const assistantResponse = await this.generateResponse(userId, userMessage, toolCall, toolResult);
                await this.chatHistoryService.saveChatMessage(userId, {
                    role: "assistant",
                    content: assistantResponse
                });
                return assistantResponse;
            }
            else {
                const assistantResponse = await this.generateResponse(userId, userMessage);
                await this.chatHistoryService.saveChatMessage(userId, {
                    role: "assistant",
                    content: assistantResponse
                });
                return assistantResponse;
            }
        }
        catch (error) {
            this.logger.error("Chat error:", error);
            return "Sorry, I encountered an error. Please try again.";
        }
    }
    async callOpenRouter(model, messages, tools) {
        const body = {
            model,
            messages
        };
        if (tools) {
            body.tools = tools;
            body.tool_choice = "auto";
        }
        const response = await axios_1.default.post(this.openrouterUrl, body, {
            headers: {
                "Authorization": `Bearer ${this.configService.get("OPENROUTER_API_KEY")}`,
                "HTTP-Referer": this.configService.get("SITE_URL") || "http://localhost:3000",
                "X-Title": "Real Estate AI Agent",
                "Content-Type": "application/json"
            }
        });
        return response.data;
    }
    async executeTool(toolCall) {
        const { name, arguments: args } = toolCall.function;
        const parsedArgs = JSON.parse(args);
        this.logger.log(`🔧 Executing tool: ${name}`);
        this.logger.log(`📋 Tool arguments:`, JSON.stringify(parsedArgs, null, 2));
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
            }
            catch (error) {
                this.logger.warn(`Failed to execute tool on MCP server: ${error instanceof Error ? error.message : String(error)}`);
                continue;
            }
        }
        throw new Error(`Failed to execute tool ${name} on any MCP server`);
    }
    async generateResponse(userId, userMessage, toolCall, toolResult) {
        const chatHistory = await this.chatHistoryService.getChatHistory(userId, 3);
        let finalUserMessage = userMessage;
        if (toolCall && toolResult) {
            if (toolCall.function.name === "findListings") {
                finalUserMessage = `${userMessage}\n\nI searched for listings and found ${Array.isArray(toolResult) ? toolResult.length : 'some'} properties. Please present these listings in a friendly, readable format:\n\n${JSON.stringify(toolResult, null, 2)}`;
            }
            else if (toolCall.function.name === "sendListingReport") {
                finalUserMessage = `${userMessage}\n\nReport result: ${JSON.stringify(toolResult)}`;
            }
            else if (toolCall.function.name === "getListingMetrics") {
                finalUserMessage = `${userMessage}\n\nAnalytics data: ${JSON.stringify(toolResult)}`;
            }
            else if (toolCall.function.name === "getMarketAnalysis") {
                finalUserMessage = `${userMessage}\n\nMarket analysis: ${JSON.stringify(toolResult)}`;
            }
            else if (toolCall.function.name === "generatePerformanceReport") {
                finalUserMessage = `${userMessage}\n\nPerformance report: ${JSON.stringify(toolResult)}`;
            }
            else {
                finalUserMessage = `${userMessage}\n\nTool result: ${JSON.stringify(toolResult)}`;
            }
        }
        const messages = [
            {
                role: "system",
                content: system_prompts_1.RESPONSE_GENERATION_PROMPT
            },
            ...chatHistory,
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
    async chatStream(userId, userMessage, res) {
        const eventSender = new streaming_service_1.FastifyStreamEventSender(res);
        let timeoutId;
        let hasStartedStreaming = false;
        const setupTimeout = (duration) => {
            if (timeoutId) {
                clearTimeout(timeoutId);
            }
            timeoutId = setTimeout(() => {
                const message = hasStartedStreaming
                    ? 'Stream timeout - taking longer than expected'
                    : 'Request timeout - no response received';
                eventSender.sendEvent({ type: 'error', message });
                eventSender.end();
            }, duration);
        };
        setupTimeout(60000);
        res.raw.on('close', () => {
            if (timeoutId) {
                clearTimeout(timeoutId);
            }
        });
        try {
            this.currentUserId = userId;
            const userToken = this.generateServiceToken(userId);
            this.mcpClients.forEach(client => {
                if (client.setAuthToken) {
                    client.setAuthToken(userToken);
                }
            });
            await this.chatHistoryService.saveChatMessage(userId, {
                role: "user",
                content: userMessage
            });
            this.streamingService.sendStatusEvent(eventSender, 'Discovering available tools...');
            this.streamingService.sendHeartbeat(eventSender);
            const history = await this.chatHistoryService.getChatHistory(userId, 5);
            const messages = [
                {
                    role: "system",
                    content: system_prompts_1.TOOL_SELECTION_PROMPT
                },
                ...history,
                {
                    role: "user",
                    content: userMessage
                }
            ];
            const toolResponse = await this.callOpenRouter("moonshotai/kimi-k2", messages, this.tools);
            if (toolResponse?.choices?.[0]?.message?.tool_calls) {
                hasStartedStreaming = true;
                setupTimeout(120000);
                const toolCall = toolResponse.choices[0].message.tool_calls[0];
                await this.executeToolWithEvents(toolCall, eventSender);
                const toolResult = await this.executeTool(toolCall);
                const finalContent = await this.streamFinalResponseWithTool(userId, userMessage, eventSender, toolCall, toolResult);
                await this.chatHistoryService.saveChatMessage(userId, {
                    role: "assistant",
                    content: finalContent
                });
            }
            else {
                hasStartedStreaming = true;
                setupTimeout(120000);
                const finalContent = await this.streamFinalResponseDirect(userId, userMessage, eventSender);
                await this.chatHistoryService.saveChatMessage(userId, {
                    role: "assistant",
                    content: finalContent
                });
            }
            if (timeoutId) {
                clearTimeout(timeoutId);
            }
        }
        catch (error) {
            if (timeoutId) {
                clearTimeout(timeoutId);
            }
            this.logger.error("Stream chat error:", error);
            if (error.message && error.message.includes('cancelled')) {
                eventSender.sendEvent({
                    type: 'cancelled',
                    message: 'Request was cancelled'
                });
            }
            else {
                eventSender.sendEvent({
                    type: 'error',
                    message: error.message || "An error occurred during streaming"
                });
            }
            eventSender.end();
        }
    }
    async executeToolWithEvents(toolCall, eventSender) {
        this.streamingService.sendToolExecutionEvent(eventSender, toolCall.function.name, 'starting');
        try {
            const result = await this.executeTool(toolCall);
            this.streamingService.sendToolExecutionEvent(eventSender, toolCall.function.name, 'completed', result);
        }
        catch (error) {
            this.streamingService.sendToolExecutionEvent(eventSender, toolCall.function.name, 'failed', undefined, error.message);
            throw error;
        }
    }
    async streamFinalResponseWithTool(userId, userMessage, eventSender, toolCall, toolResult) {
        const chatHistory = await this.chatHistoryService.getChatHistory(userId, 3);
        const finalUserMessage = this.buildToolContextMessage(userMessage, toolCall, toolResult);
        const messages = [
            {
                role: "system",
                content: system_prompts_1.RESPONSE_GENERATION_PROMPT
            },
            ...chatHistory,
            {
                role: "user",
                content: finalUserMessage
            }
        ];
        return await this.streamingService.streamResponse(messages, eventSender);
    }
    async streamFinalResponseDirect(userId, userMessage, eventSender) {
        const chatHistory = await this.chatHistoryService.getChatHistory(userId, 3);
        const messages = [
            {
                role: "system",
                content: system_prompts_1.RESPONSE_GENERATION_PROMPT
            },
            ...chatHistory,
            {
                role: "user",
                content: userMessage
            }
        ];
        return await this.streamingService.streamResponse(messages, eventSender);
    }
    buildToolContextMessage(userMessage, toolCall, toolResult) {
        if (toolCall.function.name === "findListings") {
            return `${userMessage}\n\nI searched for listings and found ${Array.isArray(toolResult) ? toolResult.length : 'some'} properties. Please present these listings in a friendly, readable format:\n\n${JSON.stringify(toolResult, null, 2)}`;
        }
        else if (toolCall.function.name === "sendListingReport") {
            return `${userMessage}\n\nReport result: ${JSON.stringify(toolResult)}`;
        }
        else if (toolCall.function.name === "getListingMetrics") {
            return `${userMessage}\n\nAnalytics data: ${JSON.stringify(toolResult)}`;
        }
        else if (toolCall.function.name === "getMarketAnalysis") {
            return `${userMessage}\n\nMarket analysis: ${JSON.stringify(toolResult)}`;
        }
        else if (toolCall.function.name === "generatePerformanceReport") {
            return `${userMessage}\n\nPerformance report: ${JSON.stringify(toolResult)}`;
        }
        else {
            return `${userMessage}\n\nTool result: ${JSON.stringify(toolResult)}`;
        }
    }
};
exports.AgentsService = AgentsService;
exports.AgentsService = AgentsService = AgentsService_1 = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [config_1.ConfigService,
        chat_history_service_1.ChatHistoryService,
        streaming_service_1.StreamingService])
], AgentsService);
//# sourceMappingURL=agents.service.js.map