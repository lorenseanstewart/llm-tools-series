# LLM Tools Real Estate Agent

A production-ready AI real estate agent built with **microservices architecture** using the **Model Context Protocol (MCP)**. This implementation demonstrates how to scale LLM agents from simple chatbots to enterprise-ready systems with decoupled tool services.

> **📍 Current Branch: `2-llm-tools-mcp` - MCP Microservices Implementation**
> 
> This README describes the **Part 2** implementation featuring a complete MCP-based microservices architecture. The code includes a main NestJS application with two specialized MCP servers for listings and analytics.

## Part 2: MCP Scaling Implementation

This branch showcases **scaling LLM agents with the Model Context Protocol**, transforming a monolithic tool integration into a distributed microservices architecture. The implementation includes:

- **🏗️ Microservices Architecture**: Three separate services with clear responsibilities
- **🔧 MCP Protocol Implementation**: Standardized tool discovery and execution
- **📊 Real-time Analytics**: Dedicated server for performance metrics and market analysis  
- **🏠 Specialized Tools**: Listings search, reporting, and market data
- **🧪 Production Testing**: Comprehensive test suite with 70+ tests
- **⚡ High Performance**: Fastify-based servers with TypeScript type safety
- **💬 Interactive Frontend**: Beautiful chat interface with real-time status indicators

## Architecture

The project uses a **monorepo microservices architecture** with the Model Context Protocol (MCP) for scalable tool integration.

### Repository Structure

```
llm-tools/
├── apps/                          # Application services
│   ├── main-app/                  # Primary NestJS application
│   │   ├── src/
│   │   │   ├── agents/           # LLM orchestration service
│   │   │   ├── controllers/      # API endpoints
│   │   │   └── config/           # Configuration
│   │   └── package.json
│   ├── mcp-listings/             # MCP server for listings
│   │   ├── src/
│   │   │   ├── data/             # Mock listings data
│   │   │   ├── tools/            # Tool implementations
│   │   │   ├── routes/           # MCP API routes
│   │   │   └── server.ts         # Fastify server
│   │   └── package.json
│   └── mcp-analytics/            # MCP server for analytics
│       ├── src/
│       │   ├── data/             # Mock analytics data
│       │   ├── tools/            # Analytics tool implementations
│       │   ├── routes/           # MCP API routes
│       │   └── server.ts         # Fastify server
│       └── package.json
├── packages/                      # Shared libraries
│   ├── shared-types/             # Common TypeScript types
│   └── mcp-client/               # MCP client library
├── docs/                         # Project documentation
└── scripts/                      # Build and utility scripts
```

## Microservices Architecture

### 1. Main Application (`apps/main-app`)
**Technology**: NestJS with Fastify adapter  
**Port**: 3000  
**Role**: Primary application server and AI orchestration

**Key Components**:
- **Agents Service**: Handles LLM interactions using OpenRouter API
- **Chat Controller**: Provides `/chat` endpoint for user interactions
- **MCP Integration**: Discovers and executes tools via MCP client

**LLM Integration**:
- **Kimi K2**: Tool selection and complex reasoning
- **Gemini 2.0 Flash**: Conversational responses
- **OpenRouter API**: Single API for multiple LLM providers

### 2. MCP Listings Server (`apps/mcp-listings`)
**Technology**: Fastify  
**Port**: 3001  
**Role**: Specialized microservice for real estate listing operations

**Available Tools**:
- `findListings`: Search listings by city, state, bedrooms, price, status
- `sendListingReport`: Email listing reports to recipients

**MCP Endpoints**:
- `GET /tools` - Tool discovery (returns available tools and schemas)
- `POST /tools/call` - Tool execution
- `GET /health` - Health check

### 3. MCP Analytics Server (`apps/mcp-analytics`)
**Technology**: Fastify  
**Port**: 3002  
**Role**: Specialized microservice for real estate analytics and metrics

**Available Tools**:
- `getListingMetrics`: Get analytics data for specific listings (views, saves, inquiries)
- `getMarketAnalysis`: Market trends and comparison data for areas
- `generatePerformanceReport`: Performance metrics for listing reports

**Analytics Data**:
- Page views, saves, and inquiry counts for each listing
- Market trends (price changes, time on market, competition)
- Performance metrics (click-through rates, conversion rates)

**MCP Endpoints**:
- `GET /tools` - Tool discovery (returns available tools and schemas)
- `POST /tools/call` - Tool execution
- `GET /health` - Health check

### 4. Shared Packages

#### `packages/shared-types`
Common TypeScript interfaces and types used across all services:
- `Listing`: Real estate listing structure
- `ListingFilters`: Search filter parameters
- `ListingMetrics`: Analytics data for listings
- `MarketAnalysis`: Market trends and comparison data
- `MCPTool`: Tool definition interface
- `MCPToolCallRequest/Response`: MCP protocol types

#### `packages/mcp-client`
HTTP client library for MCP communication:
- Tool discovery from MCP servers
- Tool execution with type safety
- Error handling and retry logic
- Health checking capabilities

## Frontend Chat Interface

The main application includes a beautiful, responsive chat interface built with modern web technologies:

### Features
- **Real-time Service Status**: Visual indicators showing health of all MCP servers
- **Interactive Chat**: Clean, modern chat interface similar to popular AI assistants
- **Responsive Design**: Works seamlessly on desktop and mobile devices
- **Sample Prompts**: Built-in suggestions to help users get started
- **Error Handling**: Graceful handling of connection issues and errors
- **Auto-scroll**: Messages automatically scroll into view
- **Typing Indicators**: Visual feedback during message processing

### Technology Stack
- **Templates**: ETA template engine for server-side rendering
- **Styling**: Modern CSS with gradients, backdrop blur, and smooth animations
- **JavaScript**: Vanilla ES6+ for lightweight, fast interactions
- **Responsive**: Mobile-first design with CSS Grid and Flexbox

### Sample Interactions
Try these example queries in the chat interface:
- "Find me 3-bedroom homes in Portland under $900,000"
- "Show me analytics for listing L001"
- "What's the market analysis for Seattle, WA?"
- "Generate a performance report for listings L001, L002, and L003"

## Model Context Protocol (MCP) Implementation

### What is MCP?
The Model Context Protocol enables AI agents to discover and execute tools across different services in a standardized way. Each MCP server:

1. **Exposes tools** via HTTP endpoints
2. **Provides schemas** for LLM integration
3. **Handles execution** independently
4. **Scales horizontally** as separate services

### MCP Flow Example

1. **Tool Discovery**: Main app calls `GET /tools` on MCP servers
2. **Schema Retrieval**: Receives tool definitions with JSON schemas
3. **LLM Integration**: Passes schemas to OpenRouter for tool selection
4. **Tool Execution**: Makes `POST /tools/call` with selected tool and arguments
5. **Response Handling**: Processes results and generates user response

### Benefits of MCP Architecture

- **Decoupling**: Tools are independent services
- **Scalability**: Each service can scale independently
- **Maintainability**: Tool logic is isolated and testable
- **Extensibility**: New tools can be added as separate services
- **Language Agnostic**: MCP servers can be written in any language

## Technical Stack

- **Framework**: NestJS (main app), Fastify (MCP servers)
- **Language**: TypeScript
- **HTTP Client**: Axios
- **LLM Integration**: OpenRouter API
- **Validation**: class-validator
- **Testing**: Jest with comprehensive mocking
- **Package Management**: npm workspaces

## Mock Data

The project uses realistic mock data to avoid external dependencies:

### Listings Data
- 20 diverse property listings
- Locations: Portland, Seattle, Bellevue, Kirkland, Redmond
- Price range: $425k - $2.2M
- Various statuses: Active, Pending, Sold

### Analytics Data (per listing)
- Page views: 100-5000 views
- Saves: 10-200 saves
- Inquiries: 5-50 inquiries
- Time on market: 1-90 days
- Performance metrics and trends

## Getting Started

### Prerequisites
- Node.js 18+
- npm 9+

### Quick Setup

1. **Clone and install dependencies:**
```bash
git clone <repository-url>
cd llm-tools
npm install
```

2. **Setup environment and API key:**
```bash
# Setup environment files and add your OpenRouter API key
npm run setup
```
Then edit `apps/main-app/.env` and add your OpenRouter API key from [https://openrouter.ai/keys](https://openrouter.ai/keys)

3. **Start all services:**
```bash
# Start all three services (main app + both MCP servers)
npm run dev
```

This starts:
- **Main app with frontend**: http://localhost:3000
- **MCP Listings server**: http://localhost:3001  
- **MCP Analytics server**: http://localhost:3002

4. **Open the chat interface:**
Visit http://localhost:3000 in your browser to use the interactive chat interface!

### Detailed Setup

#### Environment Configuration

The project requires an OpenRouter API key to function. After running `npm run setup`:

1. **Edit `apps/main-app/.env`:**
```bash
OPENROUTER_API_KEY=your_api_key_here
YOUR_SITE_URL=http://localhost:3000
MCP_LISTINGS_URL=http://localhost:3001
MCP_ANALYTICS_URL=http://localhost:3002
```

2. **Get your API key** from [OpenRouter](https://openrouter.ai/keys)

#### Alternative Startup Methods

```bash
# Start all services in development mode (recommended)
npm run dev

# Start services individually (for debugging):
npm run dev:main-app      # Main app on port 3000
npm run dev:mcp-listings  # Listings server on port 3001
npm run dev:mcp-analytics # Analytics server on port 3002

# Production mode:
npm run build             # Build all services
npm run start            # Start all services in production mode
```

#### Development Commands

When working in individual app directories:

```bash
# From apps/main-app/ directory:
npm run start:dev         # Development server with auto-reload
npm run start             # Production mode
npm run build             # Build the application
npm run test              # Run tests

# From project root:
npm run dev:main-app      # Start main app in dev mode
npm run dev               # Start all services
```

#### Easy Startup Script

For convenience, you can also use the startup script:
```bash
# Make script executable and run
chmod +x scripts/start.sh
./scripts/start.sh
```

### Testing

```bash
# Run all tests across all packages
npm run test

# Run tests with coverage
npm run test:cov

# Test individual services
npm run test -w apps/main-app
npm run test -w apps/mcp-listings  
npm run test -w apps/mcp-analytics
```

### Verifying the Setup

Once all services are running, test the system:

```bash
# Quick health check of all services
./scripts/health-check.sh

# Or check manually:
curl http://localhost:3000        # Main app
curl http://localhost:3001/health # MCP Listings server  
curl http://localhost:3002/health # MCP Analytics server

# Test the AI agent
curl -X POST http://localhost:3000/agents/chat \
  -H "Content-Type: application/json" \
  -d '{"userId": "test-user", "userMessage": "Find me homes in Portland"}'
```

## API Usage

### Chat Endpoint
```bash
# Send a message to the AI agent
curl -X POST http://localhost:3000/chat \
  -H "Content-Type: application/json" \
  -d '{"message": "Find me 3 bedroom houses in Portland under $800k with their performance metrics"}'
```

### MCP Listings Server
```bash
# Discover listing tools
curl http://localhost:3001/tools

# Find listings
curl -X POST http://localhost:3001/tools/call \
  -H "Content-Type: application/json" \
  -d '{
    "name": "findListings",
    "arguments": {
      "city": "Portland",
      "minBedrooms": 3,
      "maxPrice": 800000
    }
  }'
```

### MCP Analytics Server
```bash
# Discover analytics tools
curl http://localhost:3002/tools

# Get listing metrics
curl -X POST http://localhost:3002/tools/call \
  -H "Content-Type: application/json" \
  -d '{
    "name": "getListingMetrics",
    "arguments": {
      "listingIds": ["L001", "L002", "L003"]
    }
  }'
```

## Future Enhancements

### Additional MCP Servers
- **Calendar MCP Server** (`mcp-calendar`): Schedule property showings, manage agent availability
- **Market Data MCP Server** (`mcp-market`): Real-time market trends, comparable sales data
- **Document MCP Server** (`mcp-documents`): Generate contracts, manage property documents
- **Communication MCP Server** (`mcp-comms`): Email/SMS notifications, client messaging
- **Image Analysis MCP Server** (`mcp-vision`): Analyze property photos, virtual staging

### Infrastructure Improvements
- **Docker Deployment**: 
  - Containerize each MCP server
  - Docker Compose for local development
  - Kubernetes manifests for production
- **Service Discovery**: Consul or etcd for dynamic MCP server registration
- **API Gateway**: Kong or Traefik for unified entry point and routing

### Production Features
- **Authentication & Authorization**:
  - JWT-based auth across all services
  - Service-to-service authentication for MCP calls
  - Role-based access control per tool
- **Monitoring & Observability**:
  - OpenTelemetry integration for distributed tracing
  - Prometheus metrics for each MCP server
  - Grafana dashboards for service health
- **Rate Limiting**: Per-tool and per-service rate limits
- **Caching Layer**: Redis for frequently accessed data

### Development Experience
- **CI/CD Pipeline**:
  - GitHub Actions for automated testing
  - Separate deployment pipelines per service
  - Automated MCP server compatibility testing
- **Developer Tools**:
  - MCP server template generator
  - Automated TypeScript client generation from MCP schemas
  - Local development environment with all services

### Data Layer Evolution
- **Database Integration**:
  - PostgreSQL for listings data
  - TimescaleDB for analytics time-series data
  - MongoDB for flexible document storage
- **Event Streaming**: Kafka for real-time updates between services
- **Data Synchronization**: Change Data Capture (CDC) for keeping services in sync

### AI/LLM Enhancements
- **Multi-Model Support**: Different models for different MCP servers
- **Prompt Optimization**: A/B testing for tool descriptions
- **Tool Recommendation**: ML-based tool suggestion based on query patterns
- **Conversation Memory**: Redis-based conversation state management

## Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Add tests for new functionality
5. Ensure all tests pass
6. Submit a pull request

## License

MIT License - see LICENSE file for details