import { Controller, Get, Render } from "@nestjs/common";
import { AppService } from "./app.service";

@Controller()
export class AppController {
  constructor(private readonly appService: AppService) {}

  @Get("/")
  @Render("index.eta")
  async getHome() {
    return {
      title: 'LLM Tools Real Estate Agent',
      subtitle: 'Part 2: MCP Microservices Implementation'
    };
  }

  @Get('/auth/login')
  @Render("auth/login.eta")
  async getLogin() {
    return {};
  }

  @Get('/auth/signup')
  @Render("auth/signup.eta")
  async getSignup() {
    return {};
  }

  @Get('health')
  getHealth() {
    return {
      status: 'ok',
      timestamp: new Date().toISOString(),
      service: 'llm-tools-main-app'
    };
  }
}
