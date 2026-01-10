#!/bin/bash
# Stop script for Instagram DM Agent
# Gracefully stops all services

echo "================================================"
echo "  Instagram DM Agent - Stop Script"
echo "================================================"

# Stop Python backend
if pgrep -f "python main.py" > /dev/null; then
    echo "🛑 Stopping backend server..."
    pkill -f "python main.py"
    echo "✅ Backend stopped"
else
    echo "ℹ️  Backend not running"
fi

# Stop Redis (this triggers a final save)
if pgrep -x "redis-server" > /dev/null; then
    echo "🛑 Stopping Redis (saving data to disk)..."
    redis-cli shutdown save 2>/dev/null || pkill -x redis-server
    echo "✅ Redis stopped and data saved"
else
    echo "ℹ️  Redis not running"
fi

# Stop frontend if running
if pgrep -f "vite" > /dev/null || pgrep -f "npm run dev" > /dev/null; then
    echo "🛑 Stopping frontend..."
    pkill -f "vite" 2>/dev/null
    pkill -f "npm run dev" 2>/dev/null
    echo "✅ Frontend stopped"
else
    echo "ℹ️  Frontend not running"
fi

echo ""
echo "✅ All services stopped"
