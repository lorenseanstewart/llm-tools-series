import { OnModuleInit } from "@nestjs/common";
import { ConfigService } from "@nestjs/config";
import { ChatHistoryService } from "./chat-history.service";
export declare class AgentsService implements OnModuleInit {
    private readonly configService;
    private readonly chatHistoryService;
    private readonly logger;
    private readonly openrouterUrl;
    private readonly mcpClients;
    private tools;
    constructor(configService: ConfigService, chatHistoryService: ChatHistoryService);
    onModuleInit(): Promise<void>;
    private discoverTools;
    chat(userId: string, userMessage: string): Promise<string>;
    private callOpenRouter;
    private executeTool;
    private generateResponse;
}
