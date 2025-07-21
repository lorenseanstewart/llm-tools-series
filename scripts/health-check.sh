#!/bin/bash

# LLM Tools - Health Check Script
# Verifies all services are running and healthy

echo "🏥 Checking health of all LLM Tools services..."
echo ""

# Function to check service health
check_service() {
    local name="$1"
    local url="$2"
    local expected_pattern="$3"
    
    printf "%-20s" "$name:"
    
    # Try to connect with timeout
    if response=$(curl -s --max-time 5 "$url" 2>/dev/null); then
        if echo "$response" | grep -q "$expected_pattern" 2>/dev/null; then
            echo "✅ Healthy"
            return 0
        else
            echo "⚠️  Responded but unexpected content"
            return 1
        fi
    else
        echo "❌ Not responding"
        return 1
    fi
}

# Check main app (should return HTML or JSON)
check_service "Main App" "http://localhost:3000" "."

# Check MCP servers
check_service "Listings MCP" "http://localhost:3001/health" "ok"
check_service "Analytics MCP" "http://localhost:3002/health" "ok"

echo ""

# Test tool discovery
echo "🔧 Testing tool discovery..."

printf "%-20s" "Listings tools:"
if curl -s --max-time 5 "http://localhost:3001/tools" | grep -q "findListings" 2>/dev/null; then
    echo "✅ Available"
else
    echo "❌ Not available"
fi

printf "%-20s" "Analytics tools:"
if curl -s --max-time 5 "http://localhost:3002/tools" | grep -q "getListingMetrics" 2>/dev/null; then
    echo "✅ Available"
else
    echo "❌ Not available"
fi

echo ""
echo "🎯 To test the full system, try:"
echo "curl -X POST http://localhost:3000/agents/chat \\"
echo "  -H \"Content-Type: application/json\" \\"
echo "  -d '{\"userId\": \"test\", \"userMessage\": \"Find homes in Portland\"}'"