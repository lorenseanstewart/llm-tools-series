import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import axios from 'axios';
import { FastifyReply } from 'fastify';
import { OpenRouterMessage, ToolCall } from '@llm-tools/shared-types';

/**
 * TESTABILITY STRATEGY #1: Interface Abstraction
 * 
 * This interface abstracts streaming response behavior, making the code testable and safe.
 * Tests can use simple mock implementations instead of complex Fastify response objects.
 * 
 * Example test mock:
 * ```
 * const mockSender = {
 *   events: [],
 *   sendEvent: (data) => { this.events.push(data); },
 *   end: jest.fn(),
 *   onClose: jest.fn()
 * };
 * ```
 */
export interface StreamEventSender {
  sendEvent(data: any): void;
  end(): void;
  onClose(callback: () => void): void;
}

export class FastifyStreamEventSender implements StreamEventSender {
  constructor(private readonly response: FastifyReply) {}

  sendEvent(data: any): void {
    this.response.raw.write(`data: ${JSON.stringify(data)}\n\n`);
  }

  end(): void {
    this.response.raw.end();
  }

  onClose(callback: () => void): void {
    this.response.raw.on('close', callback);
  }
}

/**
 * TESTABILITY STRATEGY #2: Pure Function Design
 * 
 * Stream processing logic is implemented as pure functions for reliable testing.
 * No network calls, timers, or side effects - just predictable input → output transformations.
 * 
 * Example test:
 * ```
 * const result = processor.processChunk('data: {"choices":[{"delta":{"content":"hello"}}]}\n\n');
 * expect(result.tokens).toEqual(['hello']);
 * ```
 */
export interface StreamProcessor {
  processChunk(chunk: string): { tokens: string[]; isComplete: boolean };
}

export class OpenRouterStreamProcessor implements StreamProcessor {
  processChunk(chunk: string): { tokens: string[]; isComplete: boolean } {
    const lines = chunk.split('\n');
    const tokens: string[] = [];
    let isComplete = false;

    for (const line of lines) {
      if (line.startsWith('data: ')) {
        const data = line.slice(6);
        
        if (data === '[DONE]') {
          isComplete = true;
          continue;
        }

        try {
          const parsed = JSON.parse(data);
          const delta = parsed.choices?.[0]?.delta;
          
          if (delta?.content) {
            tokens.push(delta.content);
          }
        } catch (e) {
          // Skip malformed JSON lines
        }
      }
    }

    return { tokens, isComplete };
  }
}

/**
 * TESTABILITY STRATEGY #3: Dependency Injection
 * 
 * Dependencies are injected through the constructor, enabling safe and controlled testing.
 * External dependencies can be easily mocked for deterministic test behavior.
 * 
 * Example test setup:
 * ```
 * const mockConfigService = { get: jest.fn().mockReturnValue('test-key') };
 * const mockProcessor = { processChunk: jest.fn().mockReturnValue({tokens: ['test'], isComplete: true}) };
 * const service = new StreamingService(mockConfigService, mockProcessor);
 * ```
 * 
 * This approach eliminates complex mocking and ensures predictable test outcomes.
 */
@Injectable()
export class StreamingService {
  private readonly logger = new Logger(StreamingService.name);
  private readonly openrouterUrl = "https://openrouter.ai/api/v1/chat/completions";

  constructor(
    private readonly configService: ConfigService,
    private readonly streamProcessor: StreamProcessor = new OpenRouterStreamProcessor()
  ) {}

  /**
   * TESTABILITY STRATEGY #4: Event-Driven Design with Promise Return
   * 
   * This method implements a clean, testable streaming pattern:
   * 1. Returns a Promise that resolves with the final content
   * 2. Uses injected StreamProcessor for predictable chunk processing
   * 3. Maintains clear success/failure states without timing dependencies
   * 
   * Example test pattern:
   * ```
   * const content = await streamingService.streamResponse(messages, mockSender);
   * expect(content).toBe('expected response');
   * expect(mockSender.events).toContainEqual({type: 'token', content: 'hello'});
   * ```
   */
  async streamResponse(
    messages: OpenRouterMessage[],
    eventSender: StreamEventSender,
    onComplete?: (content: string) => void
  ): Promise<string> {
    let accumulatedContent = '';
    let streamEnded = false;

    // Set up cleanup on client disconnect
    eventSender.onClose(() => {
      streamEnded = true;
    });

    try {
      const response = await axios.post(
        this.openrouterUrl,
        {
          model: "google/gemini-2.0-flash-001",
          messages,
          stream: true
        },
        {
          headers: {
            "Authorization": `Bearer ${this.configService.get<string>("OPENROUTER_API_KEY")}`,
            "HTTP-Referer": this.configService.get<string>("SITE_URL") || "http://localhost:3000",
            "X-Title": "Real Estate AI Agent",
            "Content-Type": "application/json"
          },
          responseType: 'stream'
        }
      );

      return new Promise((resolve, reject) => {
        response.data.on('data', (chunk: Buffer) => {
          if (streamEnded) return;

          const { tokens, isComplete } = this.streamProcessor.processChunk(chunk.toString());
          
          // Send individual tokens
          for (const token of tokens) {
            accumulatedContent += token;
            eventSender.sendEvent({
              type: 'token',
              content: token,
              accumulated: accumulatedContent
            });
          }

          if (isComplete) {
            eventSender.sendEvent({
              type: 'complete',
              content: accumulatedContent
            });
            
            if (onComplete) {
              onComplete(accumulatedContent);
            }
            
            eventSender.end();
            resolve(accumulatedContent);
          }
        });

        response.data.on('error', (error: Error) => {
          if (streamEnded) return;
          
          eventSender.sendEvent({
            type: 'error',
            message: error.message
          });
          eventSender.end();
          reject(error);
        });

        response.data.on('end', () => {
          if (!streamEnded && accumulatedContent) {
            // Stream ended without [DONE] marker
            eventSender.sendEvent({
              type: 'complete',
              content: accumulatedContent
            });
            
            if (onComplete) {
              onComplete(accumulatedContent);
            }
            
            eventSender.end();
            resolve(accumulatedContent);
          }
        });
      });

    } catch (error) {
      eventSender.sendEvent({
        type: 'error',
        message: error.message || 'Streaming failed'
      });
      eventSender.end();
      throw error;
    }
  }

  sendStatusEvent(eventSender: StreamEventSender, message: string): void {
    eventSender.sendEvent({
      type: 'status',
      message
    });
  }

  sendToolExecutionEvent(
    eventSender: StreamEventSender, 
    tool: string, 
    status: 'starting' | 'completed' | 'failed',
    result?: any,
    error?: string
  ): void {
    const event: any = {
      type: 'tool-execution',
      tool,
      status
    };

    if (result !== undefined) {
      event.result = result;
    }

    if (error) {
      event.error = error;
    }

    eventSender.sendEvent(event);
  }

  sendHeartbeat(eventSender: StreamEventSender): void {
    eventSender.sendEvent({ type: 'heartbeat' });
  }
}