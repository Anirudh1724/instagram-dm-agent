#!/bin/bash
# Install dependencies if needed (optional check)
# pip install -r requirements.txt

# Create a virtual environment if not exists - user might already be in one
# python3 -m venv venv
# source venv/bin/activate

# Start the Fast API server in background
python3 -m uvicorn server:app --reload --port 8000 &
SERVER_PID=$!

# Start the Agent Worker
python3 main.py dev &
AGENT_PID=$!

trap "kill $SERVER_PID $AGENT_PID" EXIT

wait
