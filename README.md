# LLM Tools: Building Production-Ready AI Agents

This repository contains the complete code examples for the 4-part blog series on building production-ready AI agents with tool integration.

## Blog Series Overview

### [Part 1: From Chatbot to Agent](https://cheddybop.digital/blog/llm-tools-chatbot-to-agent-part-1)
Transform a simple chatbot into an intelligent agent with direct tool integration. Learn how to use TypeScript types to generate JSON schemas for LLM function calling.

**Branch:** `part-1-chatbot-to-agent`

### [Part 2: Scaling with MCP](https://cheddybop.digital/blog/llm-tools-scaling-with-mcp-part-2)
Scale your LLM tools using the Model Context Protocol (MCP). First introduce MCP patterns internally, then extract tools into standalone microservices.

**Branch:** `part-2-mcp-scaling`

### [Part 3: Securing MCP Servers](https://cheddybop.digital/blog/llm-tools-mcp-security-part-3)
Add authentication and security to your MCP servers. Implement API key authentication, JWT tokens, and rate limiting.

**Branch:** `part-3-mcp-security`

### [Part 4: 12 Factor Agents](https://cheddybop.digital/blog/llm-tools-12-factor-agents-part-4)
Apply the 12 Factor App methodology to AI agent systems for production deployment.

**Branch:** `part-4-production-patterns`

## Getting Started

Each branch contains a complete, working implementation for that part of the series:

```bash
# Clone the repository
git clone https://github.com/yourusername/llm-tools-series.git
cd llm-tools-series

# Switch to a specific part
git checkout part-1-chatbot-to-agent

# Follow the setup instructions in each branch's README
```

## Technology Stack

- **TypeScript** - Type-safe development
- **NestJS** - Main application framework
- **Fastify** - Lightweight MCP servers
- **OpenRouter** - LLM API integration
- **Model Context Protocol (MCP)** - Tool scaling architecture

## Repository Structure

Each branch builds upon the previous one:

- `main` - This README only
- `part-1-chatbot-to-agent` - Basic LLM with direct tool integration
- `part-2-mcp-scaling` - MCP microservices architecture
- `part-3-mcp-security` - Authentication and security additions
- `part-4-production-patterns` - Production deployment patterns

## Contributing

This repository is for educational purposes. Feel free to use the code as a starting point for your own AI agent projects.

## License

MIT License - See individual branch LICENSE files for details.