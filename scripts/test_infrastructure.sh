#!/bin/bash

# AVAI Redis Infrastructure Test Script
# ====================================

echo "🧪 AVAI Redis Infrastructure Test Suite"
echo "========================================"
echo ""

# Function to test HTTP endpoint
test_endpoint() {
    local url=$1
    local name=$2
    echo -n "Testing $name... "
    
    if curl -s -f "$url" > /dev/null 2>&1; then
        echo "✅ PASS"
        return 0
    else
        echo "❌ FAIL"
        return 1
    fi
}

# Function to test service health
test_service_health() {
    local url=$1
    local name=$2
    echo -n "Testing $name health... "
    
    local response=$(curl -s "$url/health" 2>/dev/null)
    if [[ $response == *"healthy"* ]]; then
        echo "✅ HEALTHY"
        return 0
    else
        echo "❌ UNHEALTHY"
        return 1
    fi
}

echo "📍 Testing Local Services"
echo "------------------------"

# Test Redis
echo -n "Redis Server... "
if docker exec avai-redis redis-cli ping > /dev/null 2>&1; then
    echo "✅ RUNNING"
else
    echo "❌ DOWN"
fi

# Test Analytics API
test_service_health "http://localhost:8002" "Analytics API"

# Test Dashboard
test_endpoint "http://localhost:8003" "Dashboard Web UI"

echo ""
echo "🌐 Testing Cloudflare Tunnel URLs"
echo "---------------------------------"

# Test tunnel endpoints (might not work immediately due to DNS propagation)
echo -n "Dashboard Tunnel... "
if curl -s -f -m 10 "https://avai-redis-dashboard.mrarejimmyz.workers.dev.avai.life" > /dev/null 2>&1; then
    echo "✅ ACCESSIBLE"
else
    echo "⏳ PENDING (DNS propagation or SSL setup needed)"
fi

echo -n "API Tunnel... "
if curl -s -f -m 10 "https://avai-redis-api.mrarejimmyz.workers.dev.avai.life/health" > /dev/null 2>&1; then
    echo "✅ ACCESSIBLE"
else
    echo "⏳ PENDING (DNS propagation or SSL setup needed)"
fi

echo ""
echo "🐳 Docker Container Status"
echo "--------------------------"
docker-compose ps

echo ""
echo "📊 Service URLs"
echo "---------------"
echo "Local Services:"
echo "  🔴 Redis:      redis://localhost:6379"
echo "  📊 Analytics:  http://localhost:8002"
echo "  🌐 Dashboard:  http://localhost:8003"
echo "  🔍 RedisInsight: http://localhost:8001"
echo ""
echo "Cloudflare Tunnel URLs:"
echo "  📊 Dashboard:  https://avai-redis-dashboard.mrarejimmyz.workers.dev.avai.life"
echo "  🔌 API:        https://avai-redis-api.mrarejimmyz.workers.dev.avai.life"
echo "  🤖 Main App:   https://avai-main.mrarejimmyz.workers.dev.avai.life"
echo ""
echo "📋 Management Commands"
echo "---------------------"
echo "  View logs:     docker-compose logs -f [service]"
echo "  Stop all:      docker-compose down"
echo "  Restart:       docker-compose restart"
echo "  Update:        docker-compose pull && docker-compose up -d"
echo ""
echo "🏁 Test Complete!"
