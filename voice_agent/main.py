import asyncio
import logging
import json
import time
import uuid
from livekit import rtc
from livekit.agents import AutoSubscribe, JobContext, WorkerOptions, cli, llm
from livekit.agents.voice import Agent, AgentSession, UserInputTranscribedEvent, ConversationItemAddedEvent
from livekit.plugins import deepgram, cartesia, openai, silero
from config import settings
from prompt_manager import prompt_manager
from database.redis_client import redis_client
from tools import VoiceAgentTools, book_meeting, qualify_lead, set_qualification_context
from followup_service import FollowupService, followup_worker

logger = logging.getLogger("voice-agent")
logger.setLevel(logging.INFO)

# Global follow-up service
followup_service = None


class HospitalVoiceAgent:
    def __init__(self, room: rtc.Room = None):
        self.prompt_manager = prompt_manager
        self.room = room
        
    def create_agent(self) -> Agent:
        system_prompt = self.prompt_manager.get_system_prompt()
        
        # Create tools - include transfer if we have room context
        tools = [book_meeting, qualify_lead]
        if self.room:
            voice_tools = VoiceAgentTools(self.room)
            tools.append(voice_tools.transfer_to_human)
        
        # Configure VAD with settings to prevent echo pickup
        # Higher threshold and longer silence duration to avoid picking up agent's own voice
        vad = silero.VAD.load(
            min_speech_duration=0.1,      # Minimum speech to trigger
            min_silence_duration=0.6,      # Wait longer before considering speech ended
            padding_duration=0.1,          # Buffer around speech
            activation_threshold=0.5,      # Higher threshold for speech detection
        )
        
        agent = Agent(
            instructions=system_prompt,
            vad=vad,
            stt=deepgram.STT(api_key=settings.deepgram_api_key),
            llm=openai.LLM(api_key=settings.openai_api_key, model="gpt-4o-mini"),
            tts=cartesia.TTS(api_key=settings.cartesia_api_key, voice=settings.cartesia_voice_id),
            tools=tools,
        )
        return agent


async def entrypoint(ctx: JobContext):
    global followup_service
    
    # Non-blocking Redis connection - don't block agent startup
    asyncio.create_task(redis_client.connect())
    
    # Initialize follow-up service (worker runs in server.py now)
    if followup_service is None:
        followup_service = FollowupService(redis_client)
    
    room = ctx.room
    
    print(f"Waiting for participant in room {room.name}...")
    session = AgentSession()
    conv_id = None
    
    async def log_message(role: str, content: str):
        if conv_id and content:
            await redis_client.add_message(conv_id=conv_id, role=role, content=content)
            logger.info(f"{role.capitalize()}: {content}")
            
            # Broadcast to frontend for transcripts
            try:
                payload = json.dumps({
                    "role": role,
                    "content": content,
                    "timestamp": int(time.time() * 1000)
                })
                
                await ctx.room.local_participant.publish_data(
                    payload.encode('utf-8'),
                    topic="transcription",
                    reliable=True
                )
            except Exception as e:
                logger.error(f"Failed to publish transcript: {e}")

    @session.on(UserInputTranscribedEvent)
    def on_user_speech(event: UserInputTranscribedEvent):
        if event.user_input:
            asyncio.create_task(log_message("user", event.user_input))
    
    @session.on(ConversationItemAddedEvent)
    def on_agent_speech(event: ConversationItemAddedEvent):
        if event.item.role == "assistant" and event.item.content:
            asyncio.create_task(log_message("assistant", event.item.content))

    hospital_agent = HospitalVoiceAgent(room=room)
    agent = hospital_agent.create_agent()
    
    await ctx.connect(auto_subscribe=AutoSubscribe.AUDIO_ONLY)
    participant = await ctx.wait_for_participant()
    logger.info(f"Starting voice assistant for: {participant.identity}")

    # Extract phone number from participant identity (format: "sip-user-+91XXXXXXXXXX")
    phone_number = participant.identity
    if phone_number.startswith("sip-user-"):
        phone_number = phone_number.replace("sip-user-", "")
    logger.info(f"Extracted phone number: {phone_number}")

    # Create conversation and set qualification context
    conv_id = await redis_client.create_conversation(
        user_id=participant.identity, 
        metadata={"room_name": room.name},
        phone_number=phone_number
    )
    
    # Set context for qualify_lead tool so it knows which conversation to update
    # Pass the phone number so follow-up calls know where to call
    set_qualification_context(
        redis_client=redis_client,
        followup_service=followup_service,
        conv_id=conv_id,
        client_id="lumoscale",
        phone=phone_number
    )
    logger.info(f"Conversation created: {conv_id}, qualification context set, phone: {phone_number}")
    
    await session.start(agent, room=room)
    
    # session.say() returns a SpeechHandle, not a coroutine - don't wrap in create_task
    session.say(prompt_manager.initial_greeting, allow_interruptions=True)
    logger.info("Voice assistant started and greeting initiated")

def run_agent():
    cli.run_app(WorkerOptions(entrypoint_fnc=entrypoint, api_key=settings.livekit_api_key, api_secret=settings.livekit_api_secret, ws_url=settings.livekit_url, agent_name="inbound-agent"))

if __name__ == "__main__":
    run_agent()

