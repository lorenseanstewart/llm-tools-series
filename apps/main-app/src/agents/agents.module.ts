import { Module } from "@nestjs/common";
import { AgentsService } from "./agents.service";
import { AgentsController } from "./agents.controller";
import { ChatHistoryService } from "./chat-history.service";
import { StreamingService, OpenRouterStreamProcessor } from "./streaming.service";

@Module({
  providers: [
    AgentsService, 
    ChatHistoryService, 
    StreamingService,
    {
      provide: 'STREAM_PROCESSOR',
      useClass: OpenRouterStreamProcessor
    }
  ],
  exports: [AgentsService, ChatHistoryService],
  controllers: [AgentsController],
})
export class AgentsModule {}
