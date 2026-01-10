# Agentic Instagram DM System

A production-ready, modular AI system for Instagram DM automation and lead qualification using LangGraph for dynamic agent orchestration.

## Features

- **12 Specialized AI Agents** working in harmony
- **LangGraph** for dynamic, adaptive conversation flows
- **FastAPI** webhook handler for Meta/Instagram integration
- **Cal.com** integration for meeting scheduling
- **Continuous learning** through reflection agent

## Quick Start

```bash
# Install dependencies
pip install -r requirements.txt

# Set up environment variables
cp .env.example .env
# Edit .env with your API keys

# Run the server
python main.py
```

## Agent Flow

1. **Context Agent** → Loads conversation history
2. **Intent Agent** → Understands user intent
3. **Emotion Agent** → Detects emotional state
4. **Planner Agent** → Decides next action
5. **Lead Qualification** → Scores lead quality
6. **Policy & Safety** → Ensures compliance
7. **Response Agent** → Generates reply
8. **Action Agent** → Executes decisions
9. **Booking Agent** → Handles Cal.com scheduling
10. **Summarization Agent** → Prepares meeting summary
11. **Reminder Agent** → Sends smart reminders
12. **Reflection Agent** → Continuous learning

## API Endpoints

- `GET /health` - Health check
- `POST /webhook` - Meta webhook receiver
- `GET /webhook` - Webhook verification
- `POST /test-message` - Development testing

## Environment Variables

See `.env.example` for required configuration.

## License

MIT
