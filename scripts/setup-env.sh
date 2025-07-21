#!/bin/bash

# LLM Tools - Environment Setup Script
# This script copies all .env.example files to .env files

echo "🔧 Setting up environment files for LLM Tools..."

# Root level (optional)
if [ -f ".env.example" ]; then
    if [ ! -f ".env" ]; then
        cp .env.example .env
        echo "✅ Created root .env file"
    else
        echo "⚠️  Root .env file already exists, skipping"
    fi
fi

# Main App
if [ -f "apps/main-app/.env.example" ]; then
    if [ ! -f "apps/main-app/.env" ]; then
        cp apps/main-app/.env.example apps/main-app/.env
        echo "✅ Created apps/main-app/.env file"
    else
        echo "⚠️  apps/main-app/.env file already exists, skipping"
    fi
fi

# MCP Listings Server
if [ -f "apps/mcp-listings/.env.example" ]; then
    if [ ! -f "apps/mcp-listings/.env" ]; then
        cp apps/mcp-listings/.env.example apps/mcp-listings/.env
        echo "✅ Created apps/mcp-listings/.env file"
    else
        echo "⚠️  apps/mcp-listings/.env file already exists, skipping"
    fi
fi

# MCP Analytics Server
if [ -f "apps/mcp-analytics/.env.example" ]; then
    if [ ! -f "apps/mcp-analytics/.env" ]; then
        cp apps/mcp-analytics/.env.example apps/mcp-analytics/.env
        echo "✅ Created apps/mcp-analytics/.env file"
    else
        echo "⚠️  apps/mcp-analytics/.env file already exists, skipping"
    fi
fi

echo ""
echo "🎉 Environment setup complete!"
echo ""
echo "📝 Next steps:"
echo "1. Add your OpenRouter API key to apps/main-app/.env"
echo "2. Get your API key from: https://openrouter.ai/keys"
echo "3. Run 'npm install' to install dependencies"
echo "4. Run 'npm run dev' to start all services"
echo ""