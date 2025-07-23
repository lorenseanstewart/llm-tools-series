# LLM Tools Real Estate Agent - Part 1: Chatbot to Agent

A TypeScript-powered real estate agent AI system built with NestJS, featuring intelligent property search and automated report generation.

> **📍 Current Branch: `part-1-chatbot-to-agent`**
> 
> This is Part 1 of a 4-part series showing the evolution from a simple chatbot to a production-ready AI agent system. This part demonstrates direct tool integration patterns with a **REST API only (no UI)**.

## Overview

A demonstration AI real estate agent showcasing direct tool integration patterns. Features conversational property search and simulated report generation using OpenRouter's API with a dual-model approach. Built for learning and demonstrating LLM tool integration concepts using mock data and simulated services.

### Key Features

- **Direct Tool Integration**: TypeScript-first tool definitions with auto-generated JSON schemas
- **Dual LLM Architecture**: Kimi K2 for complex tool reasoning, Gemini 2.0 Flash for conversations
- **Type Safety**: Single source of truth between TypeScript interfaces and LLM schemas
- **Mock Data**: 20 realistic property listings for demonstration purposes
- **Comprehensive Testing**: 100+ tests with 68% coverage using Jest and SWC
- **API Only**: No frontend UI - interact via curl or API client

### Available Tools

1. **`findListings`** - Search property listings with flexible filters
2. **`sendListingReport`** - Generate and send detailed property reports (mocked - no actual emails sent)

## Quick Start

### Prerequisites

- Node.js 18+ 
- npm
- OpenRouter API key (get one at [openrouter.ai/keys](https://openrouter.ai/keys))

### Installation

```bash
# Clone and checkout part-1
git clone <repository-url>
cd llm-tools-series
git checkout part-1-chatbot-to-agent

# Install dependencies
npm install

# Create environment file
cp .env.example .env
```

### Environment Configuration

Edit `.env` with your OpenRouter API key:

```env
OPENROUTER_API_KEY=your_api_key_here
YOUR_SITE_URL=http://localhost:3000
PORT=3000
```

### Development

```bash
# Start in development mode (with auto-reload)
npm run dev
# or
npm run start:dev

# Run tests
npm run test

# Run tests in watch mode
npm run test:watch

# Generate test coverage report
npm run test:cov

# Lint and format code
npm run lint
npm run format
```

The API server will start on `http://localhost:3000`.

## API Testing with curl

**Note**: This part has no frontend UI. All interactions are done via the REST API using curl or your preferred API client.

### Basic Chat Request

```bash
curl -X POST http://localhost:3000/agents/chat \
  -H "Content-Type: application/json" \
  -d '{"userId": "test-user", "userMessage": "Hello, I am looking for a 3 bedroom house in Portland under 800k"}'
```

### General Conversation

```bash
curl -X POST http://localhost:3000/agents/chat \
  -H "Content-Type: application/json" \
  -d '{"userId": "test-user", "userMessage": "What can you help me with?"}'
```

### Property Search Examples

**Search by location and price:**
```bash
curl -X POST http://localhost:3000/agents/chat \
  -H "Content-Type: application/json" \
  -d '{"userId": "test-user", "userMessage": "Show me homes in Seattle under 700k"}'
```

**Search by bedrooms and status:**
```bash
curl -X POST http://localhost:3000/agents/chat \
  -H "Content-Type: application/json" \
  -d '{"userId": "test-user", "userMessage": "I need a 4 bedroom active listing"}'
```

**Specific city search:**
```bash
curl -X POST http://localhost:3000/agents/chat \
  -H "Content-Type: application/json" \
  -d '{"userId": "test-user", "userMessage": "Find properties in Bellevue, WA"}'
```

### Report Generation (Simulated)

**Request a detailed report:**
```bash
curl -X POST http://localhost:3000/agents/chat \
  -H "Content-Type: application/json" \
  -d '{"userId": "test-user", "userMessage": "Send me a detailed report about houses in Portland under 600k"}'
```

**Market analysis request:**
```bash
curl -X POST http://localhost:3000/agents/chat \
  -H "Content-Type: application/json" \
  -d '{"userId": "test-user", "userMessage": "Generate a market report for 2-3 bedroom homes in Oregon"}'
```

*Note: Reports are simulated for demonstration purposes. No actual reports are generated or emails sent.*

### Complex Multi-criteria Search

```bash
curl -X POST http://localhost:3000/agents/chat \
  -H "Content-Type: application/json" \
  -d '{"userId": "test-user", "userMessage": "I want a 3 bedroom house in Washington state, preferably pending or sold, under 900k"}'
```

### Expected Response Format

All API responses follow this structure:

```json
{
  "success": true,
  "message": "AI assistant response text here...",
  "timestamp": "2025-01-XX:XX:XX.XXXZ"
}
```

The AI will automatically:
- Parse your natural language requirements
- Call appropriate tools (`findListings`, `sendListingReport`)
- Return conversational responses with relevant property data

### Important Note for curl Commands

When using curl with JSON payloads, avoid these characters in your messages as they can cause parsing errors:
- `!` (exclamation marks) - causes shell escaping issues
- `+` (plus signs) - causes JSON parsing errors
- `$` (dollar signs) - causes shell variable expansion

Use plain text alternatives like "3 bedroom" instead of "3+ bedroom" and "800k" instead of "$800k".

## Architecture

### Tech Stack

- **Framework**: NestJS with Fastify adapter
- **Language**: TypeScript with strict type checking
- **LLM Integration**: OpenRouter API
  - **Kimi K2**: Tool selection and complex reasoning
  - **Gemini 2.0 Flash**: Conversational responses
- **Schema Generation**: typescript-json-schema
- **Testing**: Jest with SWC compilation
- **Validation**: class-validator

### Project Structure

```
src/
├── agents/           # LLM orchestration and conversation handling
├── tools/            # Property search and report tools
├── schemas/          # Auto-generated JSON schemas
├── config/           # Environment configuration
└── common/           # Shared utilities and decorators
```

### Type-Driven Development

This demonstration showcases TypeScript-first tool development:

1. Define types in `src/tools/listings.types.ts`
2. Auto-generate JSON schemas for LLM integration
3. Maintain type safety across the entire application

## Testing

Run the comprehensive test suite:

```bash
# All tests
npm run test

# Watch mode for development
npm run test:watch

# Coverage report
npm run test:cov
```

The test suite includes:
- Tool function testing with mock data
- Schema generation validation
- LLM integration flow testing
- Configuration and validation testing

## Next Steps

Ready for more features? Check out the other parts in this series:

- **Part 2**: `part-2-mcp-scaling` - Scale with microservices and MCP
- **Part 3**: `part-3-mcp-security` - Add authentication and security
- **Part 4**: `part-4-sse` - Real-time streaming with Server-Sent Events

Each part builds on the previous one, adding production-ready features while maintaining the core agent functionality.

## License

MIT