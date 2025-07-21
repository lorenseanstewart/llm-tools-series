import { Test, TestingModule } from "@nestjs/testing";
import { AppController } from "./app.controller";
import { AppService } from "./app.service";

describe("AppController", () => {
  let appController: AppController;

  beforeEach(async () => {
    jest.clearAllMocks();
    
    const app: TestingModule = await Test.createTestingModule({
      controllers: [AppController],
      providers: [AppService], // AppController doesn't actually use AppService in these methods
    }).compile();

    appController = app.get<AppController>(AppController);
  });

  describe("getHome", () => {
    it('should return home page data', async () => {
      const result = await appController.getHome();
      expect(result).toEqual({
        title: 'LLM Tools Real Estate Agent',
        subtitle: 'Part 2: MCP Microservices Implementation'
      });
    });
  });

  describe("getLogin", () => {
    it('should return login page data', async () => {
      const result = await appController.getLogin();
      expect(result).toEqual({});
    });
  });

  describe("getSignup", () => {
    it('should return signup page data', async () => {
      const result = await appController.getSignup();
      expect(result).toEqual({});
    });
  });

  describe("getHealth", () => {
    it('should return health status', () => {
      const result = appController.getHealth();
      expect(result).toEqual({
        status: 'ok',
        timestamp: expect.any(String),
        service: 'llm-tools-main-app'
      });
    });
  });
});
