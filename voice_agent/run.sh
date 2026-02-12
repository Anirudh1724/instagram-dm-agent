#!/bin/bash

# Start the Fast API server in background
python3 -m uvicorn server:app --host 0.0.0.0 --port 8000 &
SERVER_PID=$!

# Start the Agent Worker
python3 main.py start &
AGENT_PID=$!

# Function to handle shutdown
shutdown() {
    echo "Shutting down..."
    kill -SIGTERM $SERVER_PID $AGENT_PID
    wait $SERVER_PID $AGENT_PID
    exit 0
}

# Trap signals
trap shutdown SIGTERM SIGINT

# Wait for processes
wait $SERVER_PID $AGENT_PID
