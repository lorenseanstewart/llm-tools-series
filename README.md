# LLM Tools Real Estate Agent - Part 4: Server-Sent Events

A production-ready AI real estate agent with **real-time streaming responses** using Server-Sent Events (SSE). This implementation adds streaming capabilities to the secure MCP architecture from Part 3.

> **📍 Current Branch: `part-4-sse`**
> 
> This is Part 4 of a 4-part series showing the evolution from a simple chatbot to a production-ready AI agent system. This part adds real-time streaming with SSE while maintaining all security features and the **frontend UI at localhost:3000**.

## What's New in Part 4: Server-Sent Events

Building on the secure MCP architecture from Part 3, this branch adds real-time streaming capabilities:

### Key Streaming Features
- **📡 Server-Sent Events**: Real-time streaming of AI responses
- **💭 Thinking Indicators**: Visual feedback when AI is processing vs responding
- **📝 Progressive Rendering**: Stream responses character-by-character as generated
- **🔄 Auto Reconnection**: Automatic retry on connection drops
- **⏱️ Production Timeouts**: Configurable timeouts for all operations
- **🎯 Event Types**: Multiple event types (thinking, content, error, done)
- **🔗 Connection Management**: Graceful SSE connection lifecycle

### Complete Feature Set
- All features from Part 3 (JWT auth, MCP microservices, user management)
- Real-time streaming AI responses
- Enhanced UX with thinking indicators
- Robust error handling and reconnection
- Production-ready timeout configuration

## Architecture

The project maintains the **secure MCP microservices architecture** from Part 3 with added streaming layers:

### SSE Components

#### SSE Controller (`apps/main-app/src/sse/`)
- **SSE Controller**: Handles streaming endpoints
- **Event Service**: Manages SSE connections and events
- **Stream Manager**: Coordinates multi-step streaming operations

#### Event Types
```typescript
// Different event types sent via SSE
'thinking'    // AI is processing (tool calls, reasoning)
'content'     // Streaming response content
'error'       // Error occurred during processing
'done'        // Response completed successfully
```

#### SSE Endpoints
- `/agents/chat-stream` - Protected streaming chat endpoint
- `/sse/health` - SSE connection health check

## Frontend Streaming Experience

The chat interface provides a smooth, real-time experience:

### Real-time Features
- **Thinking Indicators**: Shows "🤔 Thinking..." when AI processes requests
- **Progressive Text**: Response appears character-by-character
- **Connection Status**: Visual indicators for SSE connection health
- **Auto Reconnect**: Seamless reconnection if connection drops

### Enhanced UX Flow
1. User sends message
2. Shows "Thinking..." indicator
3. Tool execution feedback (if applicable)
4. Progressive response streaming begins
5. Final response completion

### Browser Compatibility
- Uses native EventSource API
- Fallback for older browsers
- Automatic retry logic
- Graceful degradation

## Getting Started

### Prerequisites
- Node.js 18+
- npm 9+
- OpenRouter API key

### Quick Setup

1. **Clone and checkout part-4:**
```bash
git clone <repository-url>
cd llm-tools-series
git checkout part-4-sse
npm install
```

2. **Setup environment:**
```bash
npm run setup
# Edit apps/main-app/.env with your OpenRouter API key
```

3. **Start all services:**
```bash
npm run dev
```

This starts:
- **Main app with streaming UI**: http://localhost:3000
- **MCP Listings server**: http://localhost:3001  
- **MCP Analytics server**: http://localhost:3002

4. **Experience real-time streaming:**
- Visit http://localhost:3000
- Login with your credentials (or register)
- Ask the AI agent a question
- Watch the real-time response streaming!

## SSE API Usage

### Streaming Chat Endpoint

**Connect to streaming chat:**
```bash
# First authenticate to get JWT token
TOKEN=$(curl -X POST http://localhost:3000/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email": "user@example.com", "password": "securepassword123"}' \
  | jq -r '.access_token')

# Connect to SSE stream
curl -X POST http://localhost:3000/agents/chat-stream \
  -H "Authorization: Bearer $TOKEN" \
  -H "Accept: text/event-stream" \
  -H "Cache-Control: no-cache" \
  -d '{"userMessage": "Find me homes in Portland"}' \
  --no-buffer
```

### SSE Event Format

The server sends events in this format:
```
event: thinking
data: {"status": "processing", "message": "Analyzing your request..."}

event: content
data: {"chunk": "I found several great properties in Portland"}

event: content  
data: {"chunk": " that match your criteria. Here are the top options:"}

event: done
data: {"status": "completed"}
```

### JavaScript Client Example

```javascript
// Connect to SSE endpoint
const eventSource = new EventSource('/agents/chat-stream', {
  headers: {
    'Authorization': `Bearer ${token}`
  }
});

// Handle different event types
eventSource.addEventListener('thinking', (event) => {
  const data = JSON.parse(event.data);
  showThinkingIndicator(data.message);
});

eventSource.addEventListener('content', (event) => {
  const data = JSON.parse(event.data);
  appendToResponse(data.chunk);
});

eventSource.addEventListener('done', (event) => {
  hideThinkingIndicator();
  markResponseComplete();
});

eventSource.addEventListener('error', (event) => {
  handleStreamError(event);
});
```

## Configuration

### SSE Settings
```typescript
// Configurable via environment variables
{
  timeout: process.env.SSE_TIMEOUT || 120000,     // 2 minutes
  keepAlive: process.env.SSE_KEEPALIVE || 30000,  // 30 seconds
  retry: process.env.SSE_RETRY || 3000            // 3 seconds
}
```

### Streaming Options
- **Chunk Size**: Configurable response chunking
- **Delay**: Optional delay between chunks for demo effect
- **Buffer**: Response buffering strategies

## Testing Streaming

The test suite includes SSE-specific testing:

```bash
# Run all tests including SSE tests
npm run test

# Run SSE-specific tests
npm run test -w apps/main-app -- sse

# Test streaming with coverage
npm run test:cov
```

SSE test coverage includes:
- Event stream creation and management
- Authentication with streaming endpoints
- Error handling and reconnection
- Event type validation
- Connection lifecycle testing

## Development Tips

### Testing SSE Locally
1. Use browser dev tools Network tab to see SSE connections
2. Monitor EventSource connection states
3. Test connection drops and reconnection
4. Verify event ordering and completeness

### Common Issues
- **Connection drops**: Check network stability and timeout settings
- **Auth failures**: Ensure JWT token is valid and passed correctly
- **Event parsing**: Verify JSON format in event data
- **Browser limits**: Be aware of concurrent SSE connection limits

### Performance Considerations
- SSE connections are long-lived
- Monitor server memory usage with many concurrent connections
- Consider connection pooling for production
- Implement proper cleanup on client disconnect

## Next Steps

Congratulations! You've completed the full series. Here's what you've learned:

- **Part 1**: `part-1-chatbot-to-agent` - Foundation with direct tool integration
- **Part 2**: `part-2-mcp-scaling` - Microservices with MCP
- **Part 3**: `part-3-mcp-security` - JWT authentication and security
- **Part 4**: `part-4-sse` - Real-time streaming with Server-Sent Events

### Production Deployment
This Part 4 implementation is production-ready with:
- Secure authentication
- Scalable microservices
- Real-time user experience
- Comprehensive error handling
- Full test coverage

## License

MIT