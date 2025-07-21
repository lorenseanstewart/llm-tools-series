import { Module } from "@nestjs/common";
import { AgentsService } from "./agents.service";
import { ToolsModule } from "../tools/tools.module";
import { AgentsController } from "./agents.controller";

@Module({
  providers: [AgentsService],
  exports: [AgentsService],
  imports: [ToolsModule],
  controllers: [AgentsController],
})
export class AgentsModule {}
