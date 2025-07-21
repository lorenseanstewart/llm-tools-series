import { Module } from "@nestjs/common";
import { AgentsService } from "./agents.service";
import { AgentsController } from "./agents.controller";
import { ChatHistoryService } from "./chat-history.service";
import { StreamingService } from "./streaming.service";

@Module({
  providers: [AgentsService, ChatHistoryService, StreamingService],
  exports: [AgentsService, ChatHistoryService],
  controllers: [AgentsController],
})
export class AgentsModule {}
