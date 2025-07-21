import { Module } from "@nestjs/common";
import { ConfigModule } from "@nestjs/config";
import { AppController } from "./app.controller";
import { AppService } from "./app.service";
import { ToolsModule } from "./tools/tools.module";
import { AgentsModule } from "./agents/agents.module";
import configuration from "./config/configuration";

@Module({
  imports: [
    ConfigModule.forRoot({
      load: [configuration],
      isGlobal: true,
    }),
    ToolsModule, 
    AgentsModule
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
