#!/bin/bash

# AVAI Redis Infrastructure Deployment Script
# ===========================================

set -e

echo "🚀 Starting AVAI Redis Infrastructure Deployment"
echo "================================================"

# Function to check if command exists
command_exists() {
    command -v "$1" >/dev/null 2>&1
}

# Check prerequisites
echo "📋 Checking prerequisites..."

if ! command_exists docker; then
    echo "❌ Docker is not installed. Please install Docker first."
    exit 1
fi

if ! command_exists docker-compose; then
    echo "❌ Docker Compose is not installed. Please install Docker Compose first."
    exit 1
fi

echo "✅ Prerequisites check passed"

# Load environment variables
if [ -f .env.redis ]; then
    echo "📝 Loading Redis environment configuration..."
    source .env.redis
else
    echo "⚠️ .env.redis not found, using default values"
fi

# Create necessary directories
echo "📁 Creating directory structure..."
mkdir -p redis/data
mkdir -p redis/logs
mkdir -p docker/redis-analytics/logs
mkdir -p dashboard/logs
mkdir -p cloudflare/logs

# Set permissions
chmod 755 redis/data
chmod 755 redis/logs

echo "✅ Directory structure created"

# Build and start services
echo "🐳 Building and starting Docker services..."

# Pull latest images
docker-compose pull

# Build custom images
docker-compose build

# Start services in background
docker-compose up -d

# Wait for services to start
echo "⏳ Waiting for services to initialize..."
sleep 10

# Check service health
echo "🏥 Checking service health..."

services=("redis" "analytics" "dashboard")
all_healthy=true

for service in "${services[@]}"; do
    if docker-compose ps $service | grep -q "Up"; then
        echo "✅ $service is running"
    else
        echo "❌ $service failed to start"
        all_healthy=false
    fi
done

if [ "$all_healthy" = true ]; then
    echo ""
    echo "🎉 AVAI Redis Infrastructure deployed successfully!"
    echo ""
    echo "📊 Service URLs:"
    echo "  - Redis Server: redis://localhost:6379"
    echo "  - Analytics API: http://localhost:8001"
    echo "  - Web Dashboard: http://localhost:8002"
    echo ""
    echo "📋 Useful commands:"
    echo "  - View logs: docker-compose logs -f [service_name]"
    echo "  - Stop services: docker-compose down"
    echo "  - Restart services: docker-compose restart"
    echo "  - View status: docker-compose ps"
    echo ""
    echo "🔧 Configuration:"
    echo "  - Environment: .env.redis"
    echo "  - Redis data: ./redis/data"
    echo "  - Logs: ./redis/logs, ./docker/*/logs"
    echo ""
    
    # Show logs for quick verification
    echo "📜 Recent logs (last 10 lines per service):"
    echo ""
    for service in "${services[@]}"; do
        echo "=== $service ==="
        docker-compose logs --tail=10 $service
        echo ""
    done
else
    echo ""
    echo "❌ Some services failed to start. Check logs:"
    echo "   docker-compose logs"
    echo ""
    echo "🛠️ Troubleshooting:"
    echo "  1. Check if ports 6379, 8001, 8002 are available"
    echo "  2. Verify Docker has sufficient resources"
    echo "  3. Check .env.redis configuration"
    echo ""
    exit 1
fi

echo "🏁 Deployment complete!"
