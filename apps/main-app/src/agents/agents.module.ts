import { Module } from "@nestjs/common";
import { AgentsService } from "./agents.service";
import { AgentsController } from "./agents.controller";
import { ChatHistoryService } from "./chat-history.service";

@Module({
  providers: [AgentsService, ChatHistoryService],
  exports: [AgentsService, ChatHistoryService],
  controllers: [AgentsController],
})
export class AgentsModule {}
