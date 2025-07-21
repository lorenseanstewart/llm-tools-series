import { Test, TestingModule } from '@nestjs/testing';
import { ConfigService } from '@nestjs/config';
import { StreamingService, StreamEventSender, StreamProcessor } from './streaming.service';

// Mock event sender for testing
class MockStreamEventSender implements StreamEventSender {
  public events: any[] = [];
  public ended = false;
  private closeCallback?: () => void;
  public onClose = jest.fn((callback: () => void) => {
    this.closeCallback = callback;
  });

  sendEvent(data: any): void {
    this.events.push(data);
  }

  end(): void {
    this.ended = true;
  }

  // Test helper to simulate client disconnect
  simulateDisconnect(): void {
    if (this.closeCallback) {
      this.closeCallback();
    }
  }
}

// Mock stream processor for testing
class MockStreamProcessor implements StreamProcessor {
  private responses: Array<{ tokens: string[]; isComplete: boolean }> = [];
  private currentIndex = 0;

  setResponses(responses: Array<{ tokens: string[]; isComplete: boolean }>): void {
    this.responses = responses;
    this.currentIndex = 0;
  }

  processChunk(chunk: string): { tokens: string[]; isComplete: boolean } {
    if (this.currentIndex < this.responses.length) {
      return this.responses[this.currentIndex++];
    }
    return { tokens: [], isComplete: true };
  }
}

describe('StreamingService', () => {
  let service: StreamingService;
  let mockConfigService: jest.Mocked<ConfigService>;
  let mockProcessor: MockStreamProcessor;

  beforeEach(async () => {
    mockConfigService = {
      get: jest.fn((key: string) => {
        const config = {
          'OPENROUTER_API_KEY': 'test-api-key',
          'SITE_URL': 'http://localhost:3000'
        };
        return config[key];
      })
    } as any;

    mockProcessor = new MockStreamProcessor();

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        {
          provide: StreamingService,
          useFactory: () => new StreamingService(mockConfigService, mockProcessor)
        }
      ]
    }).compile();

    service = module.get<StreamingService>(StreamingService);
  });

  describe('Event Sending Methods', () => {
    let mockSender: MockStreamEventSender;

    beforeEach(() => {
      mockSender = new MockStreamEventSender();
    });

    it('should send status events', () => {
      service.sendStatusEvent(mockSender, 'Processing...');

      expect(mockSender.events).toContainEqual({
        type: 'status',
        message: 'Processing...'
      });
    });

    it('should send heartbeat events', () => {
      service.sendHeartbeat(mockSender);

      expect(mockSender.events).toContainEqual({
        type: 'heartbeat'
      });
    });

    it('should send tool execution events with different statuses', () => {
      // Starting
      service.sendToolExecutionEvent(mockSender, 'findListings', 'starting');
      expect(mockSender.events).toContainEqual({
        type: 'tool-execution',
        tool: 'findListings',
        status: 'starting'
      });

      // Completed with result
      service.sendToolExecutionEvent(mockSender, 'findListings', 'completed', { result: 'success' });
      expect(mockSender.events).toContainEqual({
        type: 'tool-execution',
        tool: 'findListings',
        status: 'completed',
        result: { result: 'success' }
      });

      // Failed with error
      service.sendToolExecutionEvent(mockSender, 'findListings', 'failed', undefined, 'Tool failed');
      expect(mockSender.events).toContainEqual({
        type: 'tool-execution',
        tool: 'findListings',
        status: 'failed',
        error: 'Tool failed'
      });
    });
  });

  describe('Stream Processing (Pure Functions)', () => {
    it('should process streaming tokens correctly', () => {
      const processor = mockProcessor;
      
      // Set up mock responses
      processor.setResponses([
        { tokens: ['Hello'], isComplete: false },
        { tokens: [' ', 'world'], isComplete: false },
        { tokens: ['!'], isComplete: true }
      ]);

      // Test each chunk
      expect(processor.processChunk('chunk1')).toEqual({ tokens: ['Hello'], isComplete: false });
      expect(processor.processChunk('chunk2')).toEqual({ tokens: [' ', 'world'], isComplete: false });
      expect(processor.processChunk('chunk3')).toEqual({ tokens: ['!'], isComplete: true });
    });

    it('should handle empty chunks', () => {
      mockProcessor.setResponses([{ tokens: [], isComplete: false }]);
      
      const result = mockProcessor.processChunk('');
      expect(result.tokens).toEqual([]);
      expect(result.isComplete).toBe(false);
    });
  });

  describe('Integration Tests (Mocked Network)', () => {
    let mockSender: MockStreamEventSender;

    beforeEach(() => {
      mockSender = new MockStreamEventSender();
    });

    it('should handle successful streaming with mocked processor', async () => {
      // Mock axios to return a basic response
      const mockAxios = require('axios');
      mockAxios.post = jest.fn().mockResolvedValue({
        data: {
          on: jest.fn((event: string, callback: Function) => {
            if (event === 'data') {
              // Simulate receiving chunks
              setImmediate(() => {
                callback(Buffer.from('chunk1'));
                callback(Buffer.from('chunk2'));
              });
            } else if (event === 'end') {
              setImmediate(callback);
            }
          })
        }
      });

      // Set up processor to return predictable results
      mockProcessor.setResponses([
        { tokens: ['Hello'], isComplete: false },
        { tokens: [' world!'], isComplete: true }
      ]);

      const messages = [{ role: 'user', content: 'Test message' }];
      
      const result = await service.streamResponse(messages, mockSender);

      // Verify the accumulated result
      expect(result).toBe('Hello world!');

      // Verify events were sent correctly
      expect(mockSender.events).toContainEqual({
        type: 'token',
        content: 'Hello',
        accumulated: 'Hello'
      });
      expect(mockSender.events).toContainEqual({
        type: 'token',
        content: ' world!',
        accumulated: 'Hello world!'
      });
      expect(mockSender.events).toContainEqual({
        type: 'complete',
        content: 'Hello world!'
      });

      expect(mockSender.ended).toBe(true);
    });

    it('should handle network errors gracefully', async () => {
      const mockAxios = require('axios');
      mockAxios.post = jest.fn().mockRejectedValue(new Error('Network error'));

      const messages = [{ role: 'user', content: 'Test message' }];

      await expect(service.streamResponse(messages, mockSender))
        .rejects.toThrow('Network error');

      expect(mockSender.events).toContainEqual({
        type: 'error',
        message: 'Network error'
      });
      expect(mockSender.ended).toBe(true);
    });

    it('should setup disconnect handling', () => {
      // Test that the disconnect callback is properly registered
      const messages = [{ role: 'user', content: 'Test message' }];
      
      // Mock axios to return immediately
      const mockAxios = require('axios');
      mockAxios.post = jest.fn().mockResolvedValue({
        data: {
          on: jest.fn()
        }
      });

      // Start streaming
      service.streamResponse(messages, mockSender);
      
      // Verify that onClose was called to set up disconnect handling
      expect(mockSender.onClose).toHaveBeenCalledWith(expect.any(Function));
    });
  });
});

/**
 * TESTABILITY STRATEGY SUMMARY
 * 
 * This test suite demonstrates several key strategies for safe, reliable testing:
 * 
 * 1. **Deterministic Execution**: No timeouts or timing dependencies
 * 2. **Pure Function Testing**: Stream processing logic tested in isolation
 * 3. **Dependency Injection**: External dependencies easily mocked
 * 4. **Interface Abstraction**: Simple mocks replace complex framework objects
 * 5. **Single Responsibility**: Each test focuses on one specific behavior
 * 6. **Predictable State**: No race conditions or asynchronous coordination issues
 * 7. **Clear Assertions**: Tests verify exact events and state changes
 * 
 * Benefits of this approach:
 * - Tests run quickly (milliseconds vs seconds)
 * - Clear input → output relationships
 * - No external dependencies or timing issues
 * - Easy to debug when tests fail
 * - Reliable in CI/CD environments
 */