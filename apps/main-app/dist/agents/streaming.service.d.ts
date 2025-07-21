import { ConfigService } from '@nestjs/config';
import { FastifyReply } from 'fastify';
import { OpenRouterMessage } from '@llm-tools/shared-types';
export interface StreamEventSender {
    sendEvent(data: any): void;
    end(): void;
    onClose(callback: () => void): void;
}
export declare class FastifyStreamEventSender implements StreamEventSender {
    private readonly response;
    constructor(response: FastifyReply);
    sendEvent(data: any): void;
    end(): void;
    onClose(callback: () => void): void;
}
export interface StreamProcessor {
    processChunk(chunk: string): {
        tokens: string[];
        isComplete: boolean;
    };
}
export declare class OpenRouterStreamProcessor implements StreamProcessor {
    processChunk(chunk: string): {
        tokens: string[];
        isComplete: boolean;
    };
}
export declare class StreamingService {
    private readonly configService;
    private readonly streamProcessor;
    private readonly logger;
    private readonly openrouterUrl;
    constructor(configService: ConfigService, streamProcessor: StreamProcessor);
    streamResponse(messages: OpenRouterMessage[], eventSender: StreamEventSender, onComplete?: (content: string) => void): Promise<string>;
    sendStatusEvent(eventSender: StreamEventSender, message: string): void;
    sendToolExecutionEvent(eventSender: StreamEventSender, tool: string, status: 'starting' | 'completed' | 'failed', result?: any, error?: string): void;
    sendHeartbeat(eventSender: StreamEventSender): void;
}
