#!/bin/bash

# LLM Tools - Easy Startup Script
# This script makes it easy to start all services for development

set -e

echo "🚀 Starting LLM Tools Real Estate Agent..."
echo ""

# Check if we're in the right directory
if [ ! -f "package.json" ]; then
    echo "❌ Error: Please run this script from the project root directory"
    exit 1
fi

# Check if dependencies are installed
if [ ! -d "node_modules" ]; then
    echo "📦 Installing dependencies..."
    npm install
    echo ""
fi

# Check if environment is set up
if [ ! -f "apps/main-app/.env" ]; then
    echo "⚙️  Setting up environment files..."
    npm run setup
    echo ""
    echo "📝 Please edit apps/main-app/.env and add your OpenRouter API key"
    echo "   Get your key from: https://openrouter.ai/keys"
    echo ""
    read -p "Press Enter after you've added your API key..."
fi

# Check if API key is configured
if grep -q "your_openrouter_api_key_here" apps/main-app/.env 2>/dev/null; then
    echo "⚠️  OpenRouter API key not configured in apps/main-app/.env"
    echo "   Please edit the file and add your API key, then run this script again"
    exit 1
fi

echo "✅ Environment configured"
echo ""

# Start all services
echo "🎯 Starting all services..."
echo "   Main app:      http://localhost:3000"
echo "   Listings MCP:  http://localhost:3001"  
echo "   Analytics MCP: http://localhost:3002"
echo ""
echo "Press Ctrl+C to stop all services"
echo ""

# Start development servers
npm run dev