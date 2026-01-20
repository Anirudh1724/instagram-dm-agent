#!/bin/bash
# Start script for Instagram DM Agent
# This script starts Redis with persistence and the backend server

set -e  # Exit on error

echo "================================================"
echo "  Instagram DM Agent - Production Start Script"
echo "================================================"

# Create data directories if they don't exist
mkdir -p data/redis

# Check if Redis is already running
if pgrep -x "redis-server" > /dev/null; then
    echo "⚠️  Redis is already running. Skipping Redis start."
else
    echo "🚀 Starting Redis with persistence..."
    redis-server redis.conf --daemonize yes
    
    # Wait for Redis to start
    sleep 2
    
    # Verify Redis is running
    if redis-cli ping > /dev/null 2>&1; then
        echo "✅ Redis started successfully with persistence enabled"
        echo "   - RDB snapshots: Every 60s-15min (based on changes)"
        echo "   - AOF logging: Every second"
        echo "   - Data directory: ./data/redis/"
    else
        echo "❌ Redis failed to start. Check redis.conf"
        exit 1
    fi
fi

echo ""
echo "🚀 Starting Backend Server..."
echo "   - API Docs: http://localhost:8000/docs"
echo "   - Health: http://localhost:8000/health"
echo ""

# Start the Python backend
python main.py
