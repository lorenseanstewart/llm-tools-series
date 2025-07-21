import { Test, TestingModule } from '@nestjs/testing';
import { AgentsController } from './agents.controller';
import { AgentsService } from './agents.service';
import { ChatHistoryService } from './chat-history.service';
import { ChatRequestDto } from './dto/chat-request.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';

describe('AgentsController', () => {
  let controller: AgentsController;
  let agentsService: AgentsService;

  const mockAgentsService = {
    chat: jest.fn()
  };

  const mockChatHistoryService = {
    saveChatMessage: jest.fn(),
    getChatHistory: jest.fn(),
    clearChatHistory: jest.fn(),
    getChatHistoryStats: jest.fn()
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [AgentsController],
      providers: [
        {
          provide: AgentsService,
          useValue: mockAgentsService
        },
        {
          provide: ChatHistoryService,
          useValue: mockChatHistoryService
        }
      ]
    })
    .overrideGuard(JwtAuthGuard)
    .useValue({ canActivate: () => true })
    .compile();

    controller = module.get<AgentsController>(AgentsController);
    agentsService = module.get<AgentsService>(AgentsService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });

  describe('chat', () => {
    it('should handle successful chat request', async () => {
      const chatRequest: ChatRequestDto = {
        userId: 'test-user',
        userMessage: "Find me some listings in Portland"
      };

      const mockResponse = "I found 5 listings in Portland...";
      mockAgentsService.chat.mockResolvedValue(mockResponse);

      const result = await controller.chat(chatRequest);

      expect(result).toEqual({
        success: true,
        message: mockResponse,
        timestamp: expect.any(String)
      });

      expect(agentsService.chat).toHaveBeenCalledWith(chatRequest.userId, chatRequest.userMessage);
      expect(agentsService.chat).toHaveBeenCalledTimes(1);
    });

    it('should return properly formatted response structure', async () => {
      const chatRequest: ChatRequestDto = {
        userId: 'test-user',
        userMessage: "Hello"
      };

      const mockResponse = "Hello! How can I help you today?";
      mockAgentsService.chat.mockResolvedValue(mockResponse);

      const result = await controller.chat(chatRequest);

      expect(result).toHaveProperty('success');
      expect(result).toHaveProperty('message');
      expect(result).toHaveProperty('timestamp');
      expect(result.success).toBe(true);
      expect(result.message).toBe(mockResponse);
      expect(result.timestamp).toMatch(/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}.\d{3}Z$/);
    });

    it('should handle empty response from service', async () => {
      const chatRequest: ChatRequestDto = {
        userId: 'test-user',
        userMessage: "Test message"
      };

      mockAgentsService.chat.mockResolvedValue("");

      const result = await controller.chat(chatRequest);

      expect(result).toEqual({
        success: true,
        message: "",
        timestamp: expect.any(String)
      });
    });

    it('should handle long user messages', async () => {
      const longMessage = "a".repeat(1000);
      const chatRequest: ChatRequestDto = {
        userId: 'test-user',
        userMessage: longMessage
      };

      const mockResponse = "I received your long message...";
      mockAgentsService.chat.mockResolvedValue(mockResponse);

      const result = await controller.chat(chatRequest);

      expect(result.success).toBe(true);
      expect(result.message).toBe(mockResponse);
      expect(agentsService.chat).toHaveBeenCalledWith(chatRequest.userId, longMessage);
    });

    it('should handle special characters in user message', async () => {
      const specialMessage = "Find listings with $500,000 budget & 3+ bedrooms!";
      const chatRequest: ChatRequestDto = {
        userId: 'test-user',
        userMessage: specialMessage
      };

      const mockResponse = "I found listings matching your criteria...";
      mockAgentsService.chat.mockResolvedValue(mockResponse);

      const result = await controller.chat(chatRequest);

      expect(result.success).toBe(true);
      expect(result.message).toBe(mockResponse);
      expect(agentsService.chat).toHaveBeenCalledWith(chatRequest.userId, specialMessage);
    });

    it('should handle unicode characters in user message', async () => {
      const unicodeMessage = "Find listings in San José, California 🏠";
      const chatRequest: ChatRequestDto = {
        userId: 'test-user',
        userMessage: unicodeMessage
      };

      const mockResponse = "I found listings in San José...";
      mockAgentsService.chat.mockResolvedValue(mockResponse);

      const result = await controller.chat(chatRequest);

      expect(result.success).toBe(true);
      expect(result.message).toBe(mockResponse);
      expect(agentsService.chat).toHaveBeenCalledWith(chatRequest.userId, unicodeMessage);
    });

    it('should handle real estate specific queries', async () => {
      const realEstateQuery = "Show me active 3-bedroom houses in Seattle under $800,000";
      const chatRequest: ChatRequestDto = {
        userId: 'test-user',
        userMessage: realEstateQuery
      };

      const mockResponse = "I found 3 active 3-bedroom houses in Seattle under $800,000:\n\n1. 123 Main St - $750,000\n2. 456 Oak Ave - $780,000\n3. 789 Pine Rd - $795,000";
      mockAgentsService.chat.mockResolvedValue(mockResponse);

      const result = await controller.chat(chatRequest);

      expect(result.success).toBe(true);
      expect(result.message).toBe(mockResponse);
      expect(agentsService.chat).toHaveBeenCalledWith(chatRequest.userId, realEstateQuery);
    });

    it('should handle report generation requests', async () => {
      const reportRequest = "Send a report of listings L001 and L002 to client@example.com";
      const chatRequest: ChatRequestDto = {
        userId: 'test-user',
        userMessage: reportRequest
      };

      const mockResponse = "I've successfully sent a report to client@example.com with listings:\n- 123 Main St Seattle WA\n- 456 Oak Ave Seattle WA";
      mockAgentsService.chat.mockResolvedValue(mockResponse);

      const result = await controller.chat(chatRequest);

      expect(result.success).toBe(true);
      expect(result.message).toBe(mockResponse);
      expect(agentsService.chat).toHaveBeenCalledWith(chatRequest.userId, reportRequest);
    });

    it('should handle general conversation', async () => {
      const generalQuery = "What can you help me with?";
      const chatRequest: ChatRequestDto = {
        userId: 'test-user',
        userMessage: generalQuery
      };

      const mockResponse = "I'm a real estate assistant. I can help you find properties, filter listings, and send reports.";
      mockAgentsService.chat.mockResolvedValue(mockResponse);

      const result = await controller.chat(chatRequest);

      expect(result.success).toBe(true);
      expect(result.message).toBe(mockResponse);
      expect(agentsService.chat).toHaveBeenCalledWith(chatRequest.userId, generalQuery);
    });

    it('should pass through service exceptions', async () => {
      const chatRequest: ChatRequestDto = {
        userId: 'test-user',
        userMessage: "Test message"
      };

      const serviceError = new Error("Service error");
      mockAgentsService.chat.mockRejectedValue(serviceError);

      await expect(controller.chat(chatRequest)).rejects.toThrow(serviceError);
      expect(agentsService.chat).toHaveBeenCalledWith(chatRequest.userId, chatRequest.userMessage);
    });

    it('should generate valid ISO timestamp', async () => {
      const chatRequest: ChatRequestDto = {
        userId: 'test-user',
        userMessage: "Test message"
      };

      mockAgentsService.chat.mockResolvedValue("Test response");

      const result = await controller.chat(chatRequest);
      
      // Verify timestamp is a valid ISO string
      expect(() => new Date(result.timestamp)).not.toThrow();
      expect(new Date(result.timestamp).toISOString()).toBe(result.timestamp);
    });

    it('should handle concurrent requests', async () => {
      const chatRequest1: ChatRequestDto = {
        userId: 'test-user-1',
        userMessage: "First message"
      };
      const chatRequest2: ChatRequestDto = {
        userId: 'test-user-2',
        userMessage: "Second message"
      };

      mockAgentsService.chat
        .mockResolvedValueOnce("First response")
        .mockResolvedValueOnce("Second response");

      const [result1, result2] = await Promise.all([
        controller.chat(chatRequest1),
        controller.chat(chatRequest2)
      ]);

      expect(result1.message).toBe("First response");
      expect(result2.message).toBe("Second response");
      expect(agentsService.chat).toHaveBeenCalledTimes(2);
    });

    it('should handle responses with various data types', async () => {
      const chatRequest: ChatRequestDto = {
        userId: 'test-user',
        userMessage: "Test message"
      };

      // Test with string containing JSON-like structure
      const complexResponse = "Found 3 listings:\n{\"listing1\": \"123 Main St\", \"price\": 500000}";
      mockAgentsService.chat.mockResolvedValue(complexResponse);

      const result = await controller.chat(chatRequest);

      expect(result.success).toBe(true);
      expect(result.message).toBe(complexResponse);
      expect(typeof result.message).toBe('string');
    });
  });
});
