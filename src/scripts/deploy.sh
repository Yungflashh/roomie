#!/bin/bash

# Deployment script for Roommate Finder API

set -e

echo "🚀 Starting deployment process..."

# Load environment variables
if [ -f .env.production ]; then
    export $(cat .env.production | grep -v '#' | xargs)
else
    echo "❌ .env.production file not found!"
    exit 1
fi

# Build Docker image
echo "📦 Building Docker image..."
docker build -t roommate-finder-api:latest .

# Stop existing containers
echo "🛑 Stopping existing containers..."
docker-compose down

# Start new containers
echo "▶️  Starting new containers..."
docker-compose up -d

# Run database migrations (if any)
echo "🔄 Running database migrations..."
# Add migration commands here if needed

# Health check
echo "🏥 Performing health check..."
sleep 10
response=$(curl -s -o /dev/null -w "%{http_code}" http://localhost:5000/health)

if [ $response -eq 200 ]; then
    echo "✅ Deployment successful! API is healthy."
else
    echo "❌ Deployment failed! Health check returned status $response"
    exit 1
fi

# Cleanup old images
echo "🧹 Cleaning up old Docker images..."
docker image prune -f

echo "🎉 Deployment completed successfully!"