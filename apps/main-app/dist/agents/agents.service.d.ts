import { OnModuleInit } from "@nestjs/common";
import { ConfigService } from "@nestjs/config";
import { ChatHistoryService } from "./chat-history.service";
import { FastifyReply } from "fastify";
import { StreamingService } from "./streaming.service";
export declare class AgentsService implements OnModuleInit {
    private readonly configService;
    private readonly chatHistoryService;
    private readonly streamingService;
    private readonly logger;
    private readonly openrouterUrl;
    private readonly mcpClients;
    private tools;
    constructor(configService: ConfigService, chatHistoryService: ChatHistoryService, streamingService: StreamingService);
    onModuleInit(): Promise<void>;
    private discoverTools;
    chat(userId: string, userMessage: string): Promise<string>;
    private callOpenRouter;
    private executeTool;
    private generateResponse;
    chatStream(userId: string, userMessage: string, res: FastifyReply): Promise<void>;
    private executeToolWithEvents;
    private streamFinalResponseWithTool;
    private streamFinalResponseDirect;
    private buildToolContextMessage;
}
