# 🤖 AI.md: Guide for Forking and Extending This Project

This document provides essential information for developers and LLMs who want to fork this LLM Tools Real Estate Agent project and adapt it for their own use cases. It serves as a comprehensive guide to the project structure, architecture patterns, and extension points.

## 🎯 Project Overview

This is a production ready LLM agent system that demonstrates the evolution from a simple chatbot to a scalable, secure, real-time AI agent. The project is structured as a four part progression, with each part available on its own branch.

## 📋 Branch Structure

Each branch represents a complete, working implementation of that part:

- `main`: Project overview
- `part-1-chatbot-to-agent`: Direct tool integration foundation
- `part-2-mcp-scaling`: MCP microservices architecture
- `part-3-mcp-security`: Authentication and security layer
- `part-4-production-patterns`: Real-time streaming and production features

**For Forkers:** Start with the branch that matches your current needs. Each branch is fully functional and can serve as a foundation for your project.

## 🧪 Testing Configuration (Critical!)

**⚠️ Don't Skip This Section**

This project includes 116 comprehensive tests with a carefully tuned Jest/SWC configuration that solves many common issues with TypeScript monorepos and LLM application testing:

### Key Testing Features:
- **Fast Compilation**: SWC instead of ts-jest (40x faster test execution)
- **Workspace Mocking**: Proper mocking of npm workspace packages
- **Module Resolution**: Handles complex TypeScript paths and workspace dependencies
- **LLM Testing Patterns**: Deterministic testing of streaming responses and async LLM interactions
- **Test Isolation**: Prevents test pollution and timing issues

### Testing Gotchas We Solved:
```bash
# Common issues you'll avoid by using our setup:
- "Cannot resolve module '@llm-tools/shared-types'" ❌
- Tests hanging on streaming responses ❌  
- Flaky tests due to timing dependencies ❌
- Slow test execution (55s+ per test run) ❌
- Jest/TypeScript configuration conflicts ❌
```

**If you fork this project**: Keep the test configuration intact. It will save you days of debugging.

## 🏗️ Architecture Extension Points

### Adding New Tools
1. **Create Tool Interface** in `packages/shared-types/src/tools.types.ts`
2. **Implement Tool Logic** in the appropriate MCP server
3. **Add Tool Schema** with TypeScript driven schema generation
4. **Update Tests** following the existing patterns

### Adding New MCP Servers
1. **Create New App** in `apps/` directory (follow `mcp-listings-server` pattern)
2. **Add Workspace Config** in root `package.json`
3. **Update Main App** to discover tools from new server
4. **Add Health Checks** and error handling

### Extending Authentication
Current implementation uses Passport.js with JWT. Extension points:
- **Social Login**: Add OAuth strategies
- **Role Based Access**: Extend user model with roles
- **API Keys**: Add API key authentication for programmatic access
- **Rate Limiting**: Implement per-user rate limits

### Customizing the Domain
To adapt from real estate to your domain:
1. **Update Mock Data** in `apps/mcp-listings-server/src/mock.data.ts`
2. **Modify Tool Schemas** in `packages/shared-types/`
3. **Update System Prompts** in `apps/main-app/src/agents/system.prompts.ts`
4. **Revise Frontend Templates** in `apps/main-app/views/`

### Frontend Architecture
The frontend uses vanilla JavaScript with ETA templates, keeping it simple since the focus is on the backend LLM architecture:
- **No Framework Dependencies**: Pure JavaScript for maximum simplicity and compatibility
- **ETA Templating**: Server-side rendering with minimal client-side JavaScript
- **Responsive Design**: Mobile-friendly CSS without complex build processes
- **Real-time Updates**: Fetch API with Server-Sent Events for streaming responses

This approach ensures the frontend doesn't overshadow the core LLM agent patterns and makes the project accessible to developers regardless of their frontend framework preferences.

## 🛠️ Why Manual MCP Implementation vs Official SDK?

You might wonder why this project implements MCP protocol manually instead of using the [official MCP TypeScript SDK](https://github.com/modelcontextprotocol/typescript-sdk). This was an intentional architectural choice for several reasons:

### Educational Value
- **Understanding the Protocol**: Building MCP manually teaches you exactly how the protocol works, making debugging and customization easier
- **No Magic**: You see every HTTP request, response format, and error handling pattern explicitly
- **Foundation Knowledge**: Understanding the underlying protocol helps when the SDK doesn't fit your specific needs

### Simplicity and Control
- **Minimal Dependencies**: Our implementation has fewer moving parts and dependencies to manage
- **Custom Error Handling**: We can implement exactly the retry logic, timeouts, and error responses our application needs
- **Framework Integration**: Direct integration with Fastify/NestJS without additional abstraction layers

### Production Flexibility
- **Custom Authentication**: Easy to add JWT validation, rate limiting, and custom headers without SDK constraints
- **Performance Optimization**: Direct control over connection pooling, caching, and request batching
- **Monitoring Integration**: Simple to add custom metrics, logging, and observability hooks

### When to Use the Official SDK Instead

Consider the official MCP SDK when you:
- **Want Rapid Prototyping**: Need to get MCP working quickly without custom requirements
- **Standard Use Cases**: Your needs align well with the SDK's opinionated patterns
- **Complex MCP Features**: Need advanced protocol features the SDK handles automatically
- **Multiple MCP Clients**: Building applications that connect to many different MCP servers

### Migration Path

If you want to use the official SDK, you can easily migrate by:
1. Replace our custom `MCPClient` with the SDK's client implementation
2. Update MCP server implementations to use SDK server patterns
3. Maintain the same tool interfaces and business logic

The core patterns and architecture remain the same; only the protocol implementation layer changes.

## 💰 Production Considerations

### Cost Management
- **Monitor Token Usage**: Each conversation can cost $0.01 to $0.10 in API calls
- **Implement Rate Limiting**: Prevent abuse and cost spikes
- **Cache Strategically**: Real estate data can be cached for 5 to 10 minutes
- **Choose Models Wisely**: Kimi K2 for tool selection, Gemini Flash for responses

### Security Hardening
- **Environment Variables**: Never commit API keys
- **HTTPS Only**: Use SSL certificates in production
- **Database Security**: Use proper database credentials and access controls
- **Input Validation**: Validate all user inputs on multiple layers

### Performance Optimization
- **Connection Pooling**: Configure database connection pools
- **MCP Server Scaling**: Run multiple instances behind a load balancer
- **CDN**: Serve static assets from a CDN
- **Monitoring**: Add observability with OpenTelemetry

## 🔧 Development Workflow

### Initial Setup
```bash
# Clone and install
git clone [your-fork]
cd llm-tools
npm install

# Set up environment
cp .env.example .env
# Add your OpenRouter API key

# Run all services
npm run dev

# Run tests
npm test
```

### Making Changes
1. **Start with Tests**: Write tests for new functionality first
2. **Follow Patterns**: Look at existing code for patterns and conventions
3. **Update Documentation**: Keep AI.md and CLAUDE.md updated
4. **Test Thoroughly**: Run the full test suite before committing

## 🚀 Deployment Options

### Single Server Deployment
- Deploy all services on one server
- Use PM2 or similar for process management
- Good for small to medium loads

### Microservices Deployment
- Deploy each MCP server independently
- Use Docker containers with orchestration
- Better for scaling and resilience

### Cloud Platform Options
- Main app on Railway, Render, or Heroku (NestJS needs persistent server)
- MCP servers on AWS Lambda/Cloudflare Workers (simple Fastify apps work well)
- Containerized deployment with Docker on any cloud provider

## 📊 Monitoring and Observability

Add these metrics to understand your system:
- `llm_tokens_used_total`: Track API costs
- `mcp_server_response_time_seconds`: Monitor tool performance
- `chat_session_duration_minutes`: Understand user engagement
- `tool_execution_success_rate`: Detect issues early

## 🤝 Contributing Back

If you create find any errors or mistakes, please consider contributing!

## 📚 Additional Resources

- **OpenRouter Documentation**: https://openrouter.ai/docs
- **Model Context Protocol**: https://modelcontextprotocol.io/
- **NestJS Documentation**: https://docs.nestjs.com/
- **Fastify Documentation**: https://www.fastify.io/docs/
- **Jest Testing Guide**: https://jestjs.io/docs/getting-started

## 🆘 Common Issues and Solutions

### "Module not found" errors
- Check `jest.config.js` moduleNameMapper
- Verify workspace dependencies in `package.json`
- Ensure proper TypeScript path mapping

### Tests timing out
- Check for proper async/await usage
- Mock external API calls
- Use `setImmediate` instead of `setTimeout` in mocks

### Authentication not working
- Verify JWT secret is set
- Check token expiration times
- Ensure CORS is configured properly

### MCP servers not connecting
- Check health endpoints (`/health`)
- Verify port configurations
- Look at server logs for connection errors

---

**Remember**: This project demonstrates real-world patterns, testing setup, and architecture decisions that solve common problems when building LLM systems. The foundations are solid; build on them and focus on your unique value proposition.

Happy building! 🚀