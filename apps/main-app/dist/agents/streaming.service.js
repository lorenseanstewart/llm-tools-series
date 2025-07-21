"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
var __param = (this && this.__param) || function (paramIndex, decorator) {
    return function (target, key) { decorator(target, key, paramIndex); }
};
var StreamingService_1;
Object.defineProperty(exports, "__esModule", { value: true });
exports.StreamingService = exports.OpenRouterStreamProcessor = exports.FastifyStreamEventSender = void 0;
const common_1 = require("@nestjs/common");
const config_1 = require("@nestjs/config");
const axios_1 = require("axios");
class FastifyStreamEventSender {
    response;
    constructor(response) {
        this.response = response;
    }
    sendEvent(data) {
        this.response.raw.write(`data: ${JSON.stringify(data)}\n\n`);
    }
    end() {
        this.response.raw.end();
    }
    onClose(callback) {
        this.response.raw.on('close', callback);
    }
}
exports.FastifyStreamEventSender = FastifyStreamEventSender;
class OpenRouterStreamProcessor {
    processChunk(chunk) {
        const lines = chunk.split('\n');
        const tokens = [];
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
                }
                catch (e) {
                }
            }
        }
        return { tokens, isComplete };
    }
}
exports.OpenRouterStreamProcessor = OpenRouterStreamProcessor;
let StreamingService = StreamingService_1 = class StreamingService {
    configService;
    streamProcessor;
    logger = new common_1.Logger(StreamingService_1.name);
    openrouterUrl = "https://openrouter.ai/api/v1/chat/completions";
    constructor(configService, streamProcessor) {
        this.configService = configService;
        this.streamProcessor = streamProcessor;
    }
    async streamResponse(messages, eventSender, onComplete) {
        let accumulatedContent = '';
        let streamEnded = false;
        eventSender.onClose(() => {
            streamEnded = true;
        });
        try {
            const response = await axios_1.default.post(this.openrouterUrl, {
                model: "google/gemini-2.0-flash-001",
                messages,
                stream: true
            }, {
                headers: {
                    "Authorization": `Bearer ${this.configService.get("OPENROUTER_API_KEY")}`,
                    "HTTP-Referer": this.configService.get("SITE_URL") || "http://localhost:3000",
                    "X-Title": "Real Estate AI Agent",
                    "Content-Type": "application/json"
                },
                responseType: 'stream'
            });
            return new Promise((resolve, reject) => {
                response.data.on('data', (chunk) => {
                    if (streamEnded)
                        return;
                    const { tokens, isComplete } = this.streamProcessor.processChunk(chunk.toString());
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
                response.data.on('error', (error) => {
                    if (streamEnded)
                        return;
                    eventSender.sendEvent({
                        type: 'error',
                        message: error.message
                    });
                    eventSender.end();
                    reject(error);
                });
                response.data.on('end', () => {
                    if (!streamEnded && accumulatedContent) {
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
        }
        catch (error) {
            eventSender.sendEvent({
                type: 'error',
                message: error.message || 'Streaming failed'
            });
            eventSender.end();
            throw error;
        }
    }
    sendStatusEvent(eventSender, message) {
        eventSender.sendEvent({
            type: 'status',
            message
        });
    }
    sendToolExecutionEvent(eventSender, tool, status, result, error) {
        const event = {
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
    sendHeartbeat(eventSender) {
        eventSender.sendEvent({ type: 'heartbeat' });
    }
};
exports.StreamingService = StreamingService;
exports.StreamingService = StreamingService = StreamingService_1 = __decorate([
    (0, common_1.Injectable)(),
    __param(1, (0, common_1.Inject)('STREAM_PROCESSOR')),
    __metadata("design:paramtypes", [config_1.ConfigService, Object])
], StreamingService);
//# sourceMappingURL=streaming.service.js.map