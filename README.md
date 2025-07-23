# 🤖 LLM Tools Series: Building Production-Ready AI Agents

A comprehensive tutorial series demonstrating the evolution from a simple chatbot to a scalable, secure, real-time AI agent system. Each part builds upon the previous, showing best practices for production LLM applications.

## 🎯 Project Overview

This repository contains a four-part progression showing how to build production-ready LLM agents:

### 📋 Available Branches

- **`main`**: Project overview and documentation
- **`part-1-chatbot-to-agent`**: Direct tool integration foundation
- **`part-2-mcp-scaling`**: MCP microservices architecture  
- **`part-3-mcp-security`**: Authentication and security layer
- **`part-4-sse`**: Real-time streaming with Server-Sent Events

## 🚀 Quick Start

### For All Parts (2-4)

```bash
# Clone the repository
git clone <repository-url>
cd llm-tools-series

# Checkout desired branch
git checkout part-X-name  # Replace with desired part

# Install dependencies
npm install

# Setup environment
npm run setup
# Add your OpenRouter API key to apps/main-app/.env

# Start all services and UI
npm run dev

# Open browser to http://localhost:3000
```

### For Part 1 Only

```bash
git checkout part-1-chatbot-to-agent
npm install
# Add your OpenRouter API key to .env
npm run dev
# API available at http://localhost:3000
```

## 📚 Part-by-Part Guide

### Part 1: Chatbot to Agent 🏗️

**Branch**: `part-1-chatbot-to-agent`

Transform a simple chatbot into an intelligent agent with tool-calling capabilities.

#### Key Features:
- **Direct Tool Integration**: Tools implemented directly in the main application
- **Type-Safe Schema Generation**: Automatic TypeScript to JSON Schema conversion
- **Smart Model Selection**: Kimi K2 for reasoning, Gemini Flash for responses
- **Comprehensive Testing**: Full test coverage with mocked LLM responses

#### Architecture:
- **Single NestJS Application**: Monolithic architecture for simplicity
- **Built-in Tools**: `findListings` and `sendListingReport` 
- **OpenRouter Integration**: Access to multiple LLM models via single API
- **Mock Data**: No external dependencies required

#### API Usage:
```bash
# Chat with the agent
curl -X POST http://localhost:3000/agents/chat \
  -H "Content-Type: application/json" \
  -d '{"userId": "test", "userMessage": "Find 3-bedroom homes in Portland"}'
```

### Part 2: MCP Scaling 🔧

**Branch**: `part-2-mcp-scaling`

Scale your agent using the Model Context Protocol (MCP) with microservices architecture.

#### Key Features:
- **Microservices Architecture**: Three separate services with clear boundaries
- **MCP Implementation**: Standardized tool discovery and execution protocol
- **Service Independence**: Each MCP server can be developed and deployed separately
- **Frontend UI**: Beautiful chat interface with service health monitoring

#### Services:
1. **Main App** (Port 3000): NestJS orchestration and UI
2. **MCP Listings** (Port 3001): Property search and reporting tools
3. **MCP Analytics** (Port 3002): Metrics and market analysis tools

#### New Capabilities:
- Real-time service health monitoring
- Tool discovery across multiple services
- Horizontal scaling potential
- Language-agnostic tool implementation

### Part 3: MCP Security 🔐

**Branch**: `part-3-mcp-security`

Add enterprise-grade security with JWT authentication and protected endpoints.

#### Key Features:
- **JWT Authentication**: Secure token-based auth with Passport.js
- **Protected Routes**: Auth required for agent interactions
- **User Management**: Registration, login, and session handling
- **Secure MCP Communication**: Auth tokens passed to MCP servers
- **Frontend Auth Flow**: Login/logout UI with session persistence

#### Security Implementation:
- Password hashing with bcrypt
- JWT tokens with expiration
- Auth guards on sensitive endpoints
- Secure cookie handling
- CORS configuration

#### Auth Endpoints:
```bash
# Register new user
curl -X POST http://localhost:3000/auth/register \
  -H "Content-Type: application/json" \
  -d '{"email": "user@example.com", "password": "secure123"}'

# Login
curl -X POST http://localhost:3000/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email": "user@example.com", "password": "secure123"}'
```

### Part 4: Production Patterns with SSE 📡

**Branch**: `part-4-sse`

Add real-time streaming responses using Server-Sent Events for production-ready UX.

#### Key Features:
- **Server-Sent Events**: Real-time streaming of AI responses
- **Thinking Indicators**: Show when AI is processing vs responding
- **Partial Updates**: Stream responses as they're generated
- **Error Recovery**: Automatic reconnection and error handling
- **Production Timeouts**: Configurable timeouts for all operations

#### SSE Implementation:
- Event-based streaming architecture
- Graceful connection handling
- Browser EventSource API integration
- Real-time status updates
- Progressive response rendering

#### Enhanced UX:
- "Thinking..." indicators during tool execution
- Smooth, character-by-character response streaming
- Connection status indicators
- Automatic retry on disconnection

## 🏗️ Architecture Overview

### Technology Stack

- **Framework**: NestJS (main app), Fastify (MCP servers)
- **Language**: TypeScript
- **LLM Integration**: OpenRouter API (Kimi K2 + Gemini Flash)
- **Authentication**: Passport.js with JWT
- **Real-time**: Server-Sent Events (SSE)
- **Testing**: Jest with SWC for fast test execution
- **Package Management**: npm workspaces
- **Frontend**: Vanilla JavaScript with ETA templates

### Project Structure (Parts 2-4)

```
llm-tools-series/
├── apps/                          # Application services
│   ├── main-app/                  # Primary NestJS application
│   │   ├── src/
│   │   │   ├── agents/           # LLM orchestration
│   │   │   ├── auth/             # Authentication (Part 3+)
│   │   │   ├── controllers/      # API endpoints
│   │   │   └── sse/              # SSE implementation (Part 4)
│   │   └── views/                # Frontend templates
│   ├── mcp-listings/             # MCP server for listings
│   └── mcp-analytics/            # MCP server for analytics
├── packages/                      # Shared libraries
│   ├── shared-types/             # Common TypeScript types
│   └── mcp-client/               # MCP client library
├── scripts/                      # Utility scripts
└── AI.md                         # AI assistant guide
```

## 🧪 Testing

All parts include comprehensive test suites with 100+ tests total:

```bash
# Run all tests
npm test

# Run tests for specific service
npm run test:main-app
npm run test:mcp-listings
npm run test:mcp-analytics

# Run with coverage
npm run test:cov
```

### Test Configuration Highlights:
- **SWC**: 40x faster test execution than ts-jest
- **Workspace Mocking**: Proper mocking of npm workspace packages
- **Async Testing**: Reliable testing of streaming responses
- **Test Isolation**: No test pollution or timing issues

## 🔧 Development Commands

### Workspace Commands (Parts 2-4)

```bash
# Development
npm run dev                 # Start all services
npm run dev:main-app       # Start only main app
npm run dev:mcp-listings   # Start only listings server
npm run dev:mcp-analytics  # Start only analytics server

# Building
npm run build              # Build all packages and apps
npm run build:packages     # Build shared packages only
npm run build:apps         # Build applications only

# Testing
npm run test               # Test all workspaces
npm run test:main-app      # Test specific service

# Production
npm run start              # Start all in production mode
```

### Part 1 Commands

```bash
npm run dev                # Start development server
npm run build             # Build application
npm run test              # Run tests
npm run start:prod        # Start production server
```

## 📊 Available Tools

### Listings Tools (All Parts)
- **`findListings`**: Search properties by location, price, bedrooms, status
- **`sendListingReport`**: Email property reports to clients

### Analytics Tools (Parts 2-4)
- **`getListingMetrics`**: View counts, saves, inquiries per listing
- **`getMarketAnalysis`**: Market trends and area comparisons
- **`generatePerformanceReport`**: Comprehensive listing performance data

## 🌟 Key Learning Points

### Part 1: Foundation
- Converting chatbots to agents with tool calling
- Type-safe tool schema generation
- LLM model selection strategies
- Testing LLM applications

### Part 2: Scaling
- Microservices architecture for AI agents
- Model Context Protocol implementation
- Service discovery and orchestration
- Frontend integration for AI apps

### Part 3: Security
- JWT authentication in AI applications
- Protecting LLM endpoints
- User session management
- Secure service-to-service communication

### Part 4: Production UX
- Real-time streaming with SSE
- Progressive response rendering
- Connection resilience
- Production timeout handling

## 🚀 Deployment Considerations

### Single Server Deployment
- All services on one server with PM2
- Good for small to medium loads
- Simple operational overhead

### Microservices Deployment
- Each MCP server deployed independently
- Docker containers with orchestration
- Better for scaling and resilience

### Cloud Platform Options
- **Main app**: Railway, Render, or Heroku
- **MCP servers**: AWS Lambda, Cloudflare Workers
- **Full stack**: Docker on any cloud provider

## 📚 Additional Resources

- **AI.md**: Comprehensive guide for AI assistants working with this codebase
- **Model Context Protocol**: https://modelcontextprotocol.io/
- **OpenRouter API**: https://openrouter.ai/docs
- **NestJS Documentation**: https://docs.nestjs.com/
- **Fastify Documentation**: https://www.fastify.io/

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Add tests for new functionality
5. Ensure all tests pass
6. Submit a pull request

## 📄 License

MIT License - see LICENSE file for details