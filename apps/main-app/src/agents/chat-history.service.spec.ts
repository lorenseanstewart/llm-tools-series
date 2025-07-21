import { Test, TestingModule } from '@nestjs/testing';
import { ChatHistoryService } from './chat-history.service';
import { OpenRouterMessage } from '@llm-tools/shared-types';

describe('ChatHistoryService', () => {
  let service: ChatHistoryService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [ChatHistoryService],
    }).compile();

    service = module.get<ChatHistoryService>(ChatHistoryService);
  });

  describe('saveChatMessage', () => {
    it('should save a message to user history', async () => {
      const userId = 'test-user';
      const message: OpenRouterMessage = {
        role: 'user',
        content: 'Hello, find me homes'
      };

      await service.saveChatMessage(userId, message);
      const history = await service.getChatHistory(userId);

      expect(history).toHaveLength(1);
      expect(history[0]).toEqual(message);
    });

    it('should maintain separate histories for different users', async () => {
      const user1 = 'user-1';
      const user2 = 'user-2';
      
      await service.saveChatMessage(user1, { role: 'user', content: 'User 1 message' });
      await service.saveChatMessage(user2, { role: 'user', content: 'User 2 message' });

      const history1 = await service.getChatHistory(user1);
      const history2 = await service.getChatHistory(user2);

      expect(history1).toHaveLength(1);
      expect(history2).toHaveLength(1);
      expect(history1[0].content).toBe('User 1 message');
      expect(history2[0].content).toBe('User 2 message');
    });

    it('should limit history to 20 messages per user', async () => {
      const userId = 'test-user';
      
      // Add 25 messages
      for (let i = 0; i < 25; i++) {
        await service.saveChatMessage(userId, {
          role: 'user',
          content: `Message ${i}`
        });
      }

      const history = await service.getChatHistory(userId, 25);
      
      expect(history).toHaveLength(20);
      expect(history[0].content).toBe('Message 5'); // First 5 messages should be dropped
      expect(history[19].content).toBe('Message 24'); // Last message should be the most recent
    });

    it('should generate unique message IDs', async () => {
      const userId = 'test-user';
      const message: OpenRouterMessage = { role: 'user', content: 'Test' };

      await service.saveChatMessage(userId, message);
      await service.saveChatMessage(userId, message);

      // Access internal state to check IDs (in real tests, you might expose a method for this)
      const history = service['chatHistory'].get(userId);
      
      expect(history![0].id).not.toBe(history![1].id);
    });
  });

  describe('getChatHistory', () => {
    it('should return empty array for unknown user', async () => {
      const history = await service.getChatHistory('unknown-user');
      expect(history).toEqual([]);
    });

    it('should respect the limit parameter', async () => {
      const userId = 'test-user';
      
      // Add 10 messages
      for (let i = 0; i < 10; i++) {
        await service.saveChatMessage(userId, {
          role: i % 2 === 0 ? 'user' : 'assistant',
          content: `Message ${i}`
        });
      }

      const history5 = await service.getChatHistory(userId, 5);
      const history3 = await service.getChatHistory(userId, 3);

      expect(history5).toHaveLength(5);
      expect(history3).toHaveLength(3);
      
      // Should return the most recent messages
      expect(history3[0].content).toBe('Message 7');
      expect(history3[2].content).toBe('Message 9');
    });

    it('should return messages in chronological order', async () => {
      const userId = 'test-user';
      
      await service.saveChatMessage(userId, { role: 'user', content: 'First' });
      await service.saveChatMessage(userId, { role: 'assistant', content: 'Second' });
      await service.saveChatMessage(userId, { role: 'user', content: 'Third' });

      const history = await service.getChatHistory(userId);
      
      expect(history[0].content).toBe('First');
      expect(history[1].content).toBe('Second');
      expect(history[2].content).toBe('Third');
    });
  });

  describe('clearChatHistory', () => {
    it('should clear all messages for a user', async () => {
      const userId = 'test-user';
      
      await service.saveChatMessage(userId, { role: 'user', content: 'Test 1' });
      await service.saveChatMessage(userId, { role: 'assistant', content: 'Test 2' });
      
      await service.clearChatHistory(userId);
      
      const history = await service.getChatHistory(userId);
      expect(history).toEqual([]);
    });

    it('should not affect other users', async () => {
      const user1 = 'user-1';
      const user2 = 'user-2';
      
      await service.saveChatMessage(user1, { role: 'user', content: 'User 1' });
      await service.saveChatMessage(user2, { role: 'user', content: 'User 2' });
      
      await service.clearChatHistory(user1);
      
      const history1 = await service.getChatHistory(user1);
      const history2 = await service.getChatHistory(user2);
      
      expect(history1).toEqual([]);
      expect(history2).toHaveLength(1);
    });
  });

  describe('getChatHistoryStats', () => {
    it('should return correct statistics', async () => {
      // Add messages for multiple users
      await service.saveChatMessage('user-1', { role: 'user', content: 'Test' });
      await service.saveChatMessage('user-1', { role: 'assistant', content: 'Response' });
      await service.saveChatMessage('user-2', { role: 'user', content: 'Test' });
      await service.saveChatMessage('user-3', { role: 'user', content: 'Test' });
      await service.saveChatMessage('user-3', { role: 'assistant', content: 'Response' });
      await service.saveChatMessage('user-3', { role: 'user', content: 'Follow-up' });

      const stats = await service.getChatHistoryStats();

      expect(stats).toEqual({
        totalUsers: 3,
        totalMessages: 6,
        averageMessagesPerUser: 2
      });
    });

    it('should handle empty history', async () => {
      const stats = await service.getChatHistoryStats();

      expect(stats).toEqual({
        totalUsers: 0,
        totalMessages: 0,
        averageMessagesPerUser: 0
      });
    });
  });

  describe('message persistence', () => {
    it('should preserve message structure including tool calls', async () => {
      const userId = 'test-user';
      const messageWithToolCall: OpenRouterMessage = {
        role: 'assistant',
        content: null,
        tool_calls: [{
          id: 'call_123',
          type: 'function',
          function: {
            name: 'findListings',
            arguments: '{"city": "Portland"}'
          }
        }]
      };

      await service.saveChatMessage(userId, messageWithToolCall);
      const history = await service.getChatHistory(userId);

      expect(history[0]).toEqual(messageWithToolCall);
      expect(history[0].tool_calls).toBeDefined();
      expect(history[0].tool_calls![0].function.name).toBe('findListings');
    });

    it('should handle all message types', async () => {
      const userId = 'test-user';
      const messages: OpenRouterMessage[] = [
        { role: 'system', content: 'You are a helpful assistant' },
        { role: 'user', content: 'Hello' },
        { role: 'assistant', content: 'Hi there!' },
        { role: 'tool', content: '{"result": "success"}', tool_call_id: 'call_123' }
      ];

      for (const msg of messages) {
        await service.saveChatMessage(userId, msg);
      }

      const history = await service.getChatHistory(userId, 10);
      
      expect(history).toHaveLength(4);
      expect(history.map(m => m.role)).toEqual(['system', 'user', 'assistant', 'tool']);
    });
  });
});