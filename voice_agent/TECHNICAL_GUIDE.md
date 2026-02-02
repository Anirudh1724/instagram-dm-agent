# Lumoscale Voice Agent - Complete Technical Guide

## Executive Summary

This document provides a comprehensive technical overview of Lumoscale's Voice AI system, designed to handle both **inbound** (web-based) and **outbound** (phone-based) calls. The system leverages real-time WebRTC technology through LiveKit to deliver low-latency, conversational AI experiences for lead qualification in real estate and healthcare industries.

---

## System Architecture Overview

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                         LUMOSCALE VOICE AI SYSTEM                          │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                             │
│  ┌─────────────────┐      ┌─────────────────┐      ┌─────────────────┐     │
│  │   WEB CLIENT    │      │   PHONE/SIP     │      │  FRONTEND API   │     │
│  │   (Browser)     │      │   (Twilio/SIP)  │      │  (FastAPI)      │     │
│  └────────┬────────┘      └────────┬────────┘      └────────┬────────┘     │
│           │                        │                        │              │
│           └────────────────────────┼────────────────────────┘              │
│                                    ▼                                       │
│                    ┌───────────────────────────────┐                       │
│                    │       LIVEKIT SERVER          │                       │
│                    │   (WebRTC Signaling & SFU)    │                       │
│                    └───────────────┬───────────────┘                       │
│                                    │                                       │
│                                    ▼                                       │
│                    ┌───────────────────────────────┐                       │
│                    │      VOICE AGENT WORKER       │                       │
│                    │   (Python/livekit-agents)     │                       │
│                    └───────────────┬───────────────┘                       │
│                                    │                                       │
│           ┌────────────────────────┼────────────────────────┐              │
│           ▼                        ▼                        ▼              │
│  ┌─────────────────┐      ┌─────────────────┐      ┌─────────────────┐     │
│  │   Deepgram      │      │    OpenAI       │      │    Cartesia     │     │
│  │   (STT)         │      │    (LLM)        │      │    (TTS)        │     │
│  └─────────────────┘      └─────────────────┘      └─────────────────┘     │
│                                    │                                       │
│                                    ▼                                       │
│                    ┌───────────────────────────────┐                       │
│                    │          REDIS                │                       │
│                    │  (Conversation Storage)       │                       │
│                    └───────────────────────────────┘                       │
│                                                                             │
└─────────────────────────────────────────────────────────────────────────────┘
```

---

## Agent Inventory

### Current Agent Count: **1 Voice Agent**

| Agent Name | Role | Entry Point | Use Case |
|------------|------|-------------|----------|
| **Lumoscale Agent** | Inbound/Outbound Voice Assistant | `main.py` | Lead qualification, inquiry handling, appointment booking |

---

## Agent Roles & Responsibilities

### Lumoscale Voice Agent

**Primary Objective**: Collect basic information from callers, answer questions about Lumoscale's services, and direct prospects to book strategy calls.

#### Responsibilities:

| Task | Description |
|------|-------------|
| **Greeting** | Initiate conversation with standardized greeting |
| **Industry Qualification** | Identify if caller is in Real Estate or Healthcare |
| **Service Interest** | Determine interest in Voice Agents, Text Agents, or Both |
| **Lead Collection** | Gather Name, Email, and Monthly Lead Volume |
| **Inquiry Handling** | Answer common questions about services, pricing, integrations |
| **Objection Handling** | Address competitor comparisons, DIY concerns, and research phase |
| **Call-to-Action** | Direct qualified leads to book strategy calls |

#### Information Collection Flow:

```
┌─────────────┐    ┌─────────────┐    ┌─────────────┐    ┌─────────────┐    ┌─────────────┐
│  Industry   │ -> │   Service   │ -> │    Name     │ -> │    Email    │ -> │ Lead Volume │
│   Check     │    │    Type     │    │             │    │             │    │             │
└─────────────┘    └─────────────┘    └─────────────┘    └─────────────┘    └─────────────┘
      │
      ▼ (If Not RE/Healthcare)
┌─────────────────────────────────┐
│ Collect Name/Email → End Call  │
│ "Someone will reach out..."    │
└─────────────────────────────────┘
```

---

## Inbound vs Outbound Calls

### Inbound Calls (Web-Based)

**Entry Point**: `/api/token` endpoint → Browser WebRTC connection

| Component | Implementation |
|-----------|----------------|
| **Connection Method** | WebRTC via LiveKit SDK |
| **Authentication** | JWT Access Token |
| **Participant Type** | Web Participant |
| **Audio Stream** | Browser microphone → LiveKit Room |
| **Latency** | ~100-200ms (WebRTC native) |

**Flow**:
```
1. Frontend calls GET /api/token
2. Server generates JWT with room access grants
3. Frontend connects to LiveKit room using token
4. Agent worker detects new participant
5. Agent starts session and speaks greeting
6. Bidirectional audio streaming begins
```

**Code Path**:
```
server.py::get_token() → AccessToken generation
          ↓
main.py::entrypoint() → Wait for participant
          ↓
main.py::AgentSession.start() → Begin interaction
          ↓
prompts.yaml::initial_greeting → "Hey, how are you doing?..."
```

---

### Outbound Calls (SIP/Phone-Based)

**Entry Point**: `/api/call` endpoint → SIP Trunk dial-out

| Component | Implementation |
|-----------|----------------|
| **Connection Method** | SIP over LiveKit |
| **Trunk Provider** | Configurable (Twilio, etc.) |
| **Participant Type** | SIP Participant |
| **Audio Stream** | Phone ↔ SIP Trunk ↔ LiveKit Room |
| **Latency** | ~300-500ms (includes PSTN) |

**Flow**:
```
1. Frontend/API calls POST /api/call with phone number
2. Server creates new LiveKit room
3. Server calls LiveKit SIP API to create SIP participant
4. SIP trunk dials the phone number
5. When call connects, SIP participant joins room
6. Agent worker auto-joins and begins interaction
```

**Code Path**:
```
server.py::start_outbound_call() → Create room + SIP participant
          ↓
lk_api.sip.create_sip_participant() → Dial phone number
          ↓
main.py::entrypoint() → Agent joins when room created
          ↓
prompts.yaml::initial_greeting → Same greeting for both types
```

**Required Configuration**:
```bash
SIP_TRUNK_ID=<your-livekit-sip-trunk-id>
```

---

## Technology Stack

### Core Infrastructure

| Layer | Technology | Purpose | Version/Details |
|-------|------------|---------|-----------------|
| **Real-time Communication** | LiveKit | WebRTC SFU, room management | Cloud-hosted |
| **Agent Framework** | livekit-agents | Python SDK for voice agents | Latest |
| **API Server** | FastAPI | REST endpoints for token/call | v0.100+ |
| **Database** | Redis | Conversation storage | Async client |

### AI/ML Pipeline

| Component | Provider | Model/Service | Latency Target |
|-----------|----------|---------------|----------------|
| **Voice Activity Detection (VAD)** | Silero | silero-vad | <50ms |
| **Speech-to-Text (STT)** | Deepgram | Nova-2 | <300ms |
| **Language Model (LLM)** | OpenAI | GPT-4o-mini | <500ms |
| **Text-to-Speech (TTS)** | Cartesia | Custom Voice ID | <200ms (streaming) |

### Dependencies (requirements.txt)

```
livekit-agents          # Core agent framework
livekit-plugins-deepgram # STT integration
livekit-plugins-cartesia # TTS integration  
livekit-plugins-openai   # LLM integration
livekit-plugins-silero   # VAD integration
python-dotenv           # Environment config
redis                   # Conversation storage
fastapi                 # HTTP API
uvicorn                 # ASGI server
pyyaml                  # Prompt configuration
```

---

## The 5-Layer Voice Pipeline

### Layer 1: Phone/Web Integration

**Purpose**: Establish bidirectional audio connection

| Type | Protocol | Handler |
|------|----------|---------|
| Web | WebRTC (DTLS-SRTP) | LiveKit JS SDK |
| Phone | SIP/RTP | LiveKit SIP Bridge |

### Layer 2: Voice Activity Detection (VAD)

**Purpose**: Detect when user is speaking vs silence

```python
vad=silero.VAD.load()  # Loaded in Agent constructor
```

- Enables natural turn-taking
- Supports barge-in (user can interrupt agent)
- Sub-50ms detection latency

### Layer 3: Speech-to-Text (STT)

**Purpose**: Convert spoken audio to text in real-time

```python
stt=deepgram.STT(api_key=settings.deepgram_api_key)
```

- Streaming transcription (partial results)
- Optimized for conversational speech
- Handles background noise

### Layer 4: Language Model (LLM)

**Purpose**: Process intent, maintain context, generate responses

```python
llm=openai.LLM(api_key=settings.openai_api_key, model="gpt-4o-mini")
```

- System prompt from `prompts.yaml`
- Tool calling support (e.g., `book_meeting`)
- Conversation memory within session

### Layer 5: Text-to-Speech (TTS)

**Purpose**: Convert AI responses to natural speech

```python
tts=cartesia.TTS(api_key=settings.cartesia_api_key, voice=settings.cartesia_voice_id)
```

- Streaming synthesis (audio plays while generating)
- Custom voice cloning supported
- Natural prosody and intonation

---

## Data Flow

### Real-time Transcript Broadcasting

The agent broadcasts transcripts to the frontend for display:

```python
# Payload structure sent via LiveKit data channel
payload = {
    "role": "user" | "assistant",
    "content": "transcript text",
    "timestamp": 1234567890000  # milliseconds
}

# Published to 'transcription' topic
await ctx.room.local_participant.publish_data(
    payload.encode('utf-8'),
    topic="transcription",
    reliable=True
)
```

### Conversation Persistence

```python
# Redis key structure
conversation:{conv_id}           # Metadata (id, user_id, created_at)
conversation:{conv_id}:messages  # List of message objects

# Message format
{
    "role": "user" | "assistant",
    "content": "...",
    "timestamp": 1234567890.123
}
```

---

## Configuration

### Environment Variables

```bash
# LiveKit Configuration
LIVEKIT_URL=wss://your-project.livekit.cloud
LIVEKIT_API_KEY=APIxxxxx
LIVEKIT_API_SECRET=secret

# AI Services
OPENAI_API_KEY=sk-xxxxx
DEEPGRAM_API_KEY=xxxxx
CARTESIA_API_KEY=xxxxx
CARTESIA_VOICE_ID=248be419-3632-4f4d-b671-xxxx  # Custom voice

# Phone/SIP (for outbound)
SIP_TRUNK_ID=ST_xxxxx

# Database
REDIS_URL=redis://localhost:6379
```

### Prompt Configuration (prompts.yaml)

```yaml
system_prompt: |
  # Role and Objective
  You are a Lumoscale Agent...
  
  # Personality
  You are helpful, conversational...
  
  # Instructions
  ## Greeting
  ## Information Collection Flow
  ## Answering Questions Mode
  ...

initial_greeting: "Hey, how are you doing? This is Lumoscale Agent. How may I help you?"
```

---

## Available Tools

| Tool | Purpose | Parameters |
|------|---------|------------|
| `book_meeting` | Book a meeting with the caller | `time: str` |

---

## Deployment

### Running the Agent Worker

```bash
# Start the voice agent (connects to LiveKit and listens for rooms)
cd voice_agent
python main.py
```

### Running the API Server

```bash
# Start FastAPI server for token/call endpoints
cd voice_agent
uvicorn server:app --host 0.0.0.0 --port 8000
```

### Process File (Procfile)

```
worker: python main.py
```

---

## Performance Characteristics

| Metric | Target | Current Implementation |
|--------|--------|------------------------|
| **End-to-end Latency** | <1000ms | ~800ms typical |
| **VAD Detection** | <50ms | Silero native |
| **STT Transcription** | <300ms | Deepgram streaming |
| **LLM Response** | <500ms | GPT-4o-mini |
| **TTS First Byte** | <200ms | Cartesia streaming |
| **Concurrent Calls** | Scalable | Worker-based (horizontal) |

---

## Future Enhancements

- [ ] Multi-agent support (specialized agents for different intents)
- [ ] CRM integration (automatic lead creation)
- [ ] Calendar API integration (real-time booking)
- [ ] Call recording and analytics
- [ ] Multi-language support
- [ ] Warm transfer to human agents

---

## Quick Reference

### API Endpoints

| Method | Endpoint | Purpose | Request Body |
|--------|----------|---------|--------------|
| GET | `/api/token` | Get WebRTC access token | None |
| POST | `/api/call` | Initiate outbound call | `{"phone": "+1234567890"}` |

### File Structure

```
voice_agent/
├── main.py              # Agent worker entry point
├── server.py            # FastAPI endpoints
├── config.py            # Environment configuration
├── prompts.yaml         # System prompt & greeting
├── prompt_manager.py    # Prompt loading utilities
├── tools.py             # LLM function tools
├── requirements.txt     # Python dependencies
├── Procfile            # Deployment configuration
└── database/
    └── redis_client.py  # Conversation storage
```

---

*Document Version: 1.0*  
*Last Updated: January 2026*  
*Author: Lumoscale Engineering*
