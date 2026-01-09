#!/bin/bash

# Fynd Review API - Docker Quick Start Script

set -e

echo "🚀 Fynd Review API - Docker Setup"
echo "=================================="
echo ""

# Check if Docker is installed
if ! command -v docker &> /dev/null; then
    echo "❌ Docker is not installed. Please install Docker first."
    exit 1
fi

# Check if Docker Compose is installed
if ! command -v docker-compose &> /dev/null; then
    echo "❌ Docker Compose is not installed. Please install Docker Compose first."
    exit 1
fi

echo "✅ Docker and Docker Compose are installed"
echo ""

# Check if .env file exists
if [ ! -f .env ]; then
    echo "⚠️  .env file not found. Creating from .env.example..."
    if [ -f .env.example ]; then
        cp .env.example .env
        echo "✅ Created .env file from template"
        echo ""
        echo "⚠️  IMPORTANT: Edit .env file and add your API keys before continuing!"
        echo "   Run: nano .env (or use your preferred editor)"
        echo ""
        read -p "Press Enter once you've configured .env file..."
    else
        echo "❌ .env.example not found. Please create a .env file manually."
        exit 1
    fi
else
    echo "✅ .env file found"
fi

echo ""
echo "🔧 Building Docker images..."
docker-compose build

echo ""
echo "🚀 Starting services..."
docker-compose up -d

echo ""
echo "⏳ Waiting for services to be healthy..."
sleep 5

# Check if services are running
if docker-compose ps | grep -q "Up"; then
    echo ""
    echo "✅ Services are running!"
    echo ""
    echo "📝 Service Information:"
    echo "   - API: http://localhost:8000"
    echo "   - API Docs: http://localhost:8000/docs"
    echo "   - Health: http://localhost:8000/health"
    echo "   - PostgreSQL: localhost:5432"
    echo ""
    echo "📊 View logs:"
    echo "   docker-compose logs -f"
    echo ""
    echo "🛑 Stop services:"
    echo "   docker-compose down"
    echo ""
    
    # Test health endpoint
    echo "🏥 Testing health endpoint..."
    sleep 3
    if curl -s http://localhost:8000/health | grep -q "ok"; then
        echo "✅ API is healthy and responding!"
    else
        echo "⚠️  API might still be starting up. Check logs with: docker-compose logs -f api"
    fi
else
    echo "❌ Services failed to start. Check logs with: docker-compose logs"
    exit 1
fi

echo ""
echo "🎉 Setup complete! Your API is ready to use."
