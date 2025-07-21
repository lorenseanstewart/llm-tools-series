import { Test, TestingModule } from "@nestjs/testing";
import { AppController } from "./app.controller";
import { AppService } from "./app.service";

describe("AppController", () => {
  let appController: AppController;
  let appService: AppService;

  const mockAppService = {
    getHome: jest.fn().mockReturnValue({
      title: 'LLM Tools Real Estate Agent',
      subtitle: 'Part 2: MCP Microservices Implementation'
    })
  };

  beforeEach(async () => {
    jest.clearAllMocks();
    
    const app: TestingModule = await Test.createTestingModule({
      controllers: [AppController],
      providers: [
        {
          provide: AppService,
          useValue: mockAppService
        }
      ],
    }).compile();

    appController = app.get<AppController>(AppController);
  });

  describe("root", () => {
    it('should return home page data', async () => {
      const result = await appController.getHome();
      expect(result).toEqual({
        title: 'LLM Tools Real Estate Agent',
        subtitle: 'Part 2: MCP Microservices Implementation'
      });
    });
  });
});
