# LLM Tools Real Estate Agent

A TypeScript-powered real estate agent AI system built with NestJS, featuring intelligent property search and automated report generation.

## Overview

A demonstration AI real estate agent showcasing direct tool integration patterns. Features conversational property search and simulated report generation using OpenRouter's API with a dual-model approach. Built for learning and demonstrating LLM tool integration concepts using mock data and simulated services.

### Key Features

- **Direct Tool Integration**: TypeScript-first tool definitions with auto-generated JSON schemas
- **Dual LLM Architecture**: Kimi K2 for complex tool reasoning, Gemini 2.0 Flash for conversations
- **Type Safety**: Single source of truth between TypeScript interfaces and LLM schemas
- **Mock Data**: 20 realistic property listings for demonstration purposes
- **Comprehensive Testing**: 100+ tests with 68% coverage using Jest and SWC

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
# Clone and install dependencies
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

The application will start on `http://localhost:3000`.

## API Testing with curl

### Basic Chat Request

```bash
curl -X POST http://localhost:3000/agents/chat \
  -H "Content-Type: application/json" \
  -d '{"userMessage": "Hello, I am looking for a 3 bedroom house in Portland under 800k"}'
```

### General Conversation

```bash
curl -X POST http://localhost:3000/agents/chat \
  -H "Content-Type: application/json" \
  -d '{"userMessage": "What can you help me with?"}'
```

### Property Search Examples

**Search by location and price:**
```bash
curl -X POST http://localhost:3000/agents/chat \
  -H "Content-Type: application/json" \
  -d '{"userMessage": "Show me homes in Seattle under 700k"}'
```

**Search by bedrooms and status:**
```bash
curl -X POST http://localhost:3000/agents/chat \
  -H "Content-Type: application/json" \
  -d '{"userMessage": "I need a 4 bedroom active listing"}'
```

**Specific city search:**
```bash
curl -X POST http://localhost:3000/agents/chat \
  -H "Content-Type: application/json" \
  -d '{"userMessage": "Find properties in Bellevue, WA"}'
```

### Report Generation (Simulated)

**Request a detailed report:**
```bash
curl -X POST http://localhost:3000/agents/chat \
  -H "Content-Type: application/json" \
  -d '{"userMessage": "Send me a detailed report about houses in Portland under 600k"}'
```

**Market analysis request:**
```bash
curl -X POST http://localhost:3000/agents/chat \
  -H "Content-Type: application/json" \
  -d '{"userMessage": "Generate a market report for 2-3 bedroom homes in Oregon"}'
```

*Note: Reports are simulated for demonstration purposes. No actual reports are generated or emails sent.*

### Complex Multi-criteria Search

```bash
curl -X POST http://localhost:3000/agents/chat \
  -H "Content-Type: application/json" \
  -d '{"userMessage": "I want a 3 bedroom house in Washington state, preferably pending or sold, under 900k"}'
```

### Expected Response Format

All API responses follow this structure:

```json
{
  "response": "AI assistant response text here...",
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


## License

MIT