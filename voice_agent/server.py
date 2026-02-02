from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from livekit import api
import os
import asyncio
from config import settings
from pydantic import BaseModel
from database.redis_client import redis_client
from followup_service import FollowupService
import logging

logger = logging.getLogger("voice-server")
logging.basicConfig(level=logging.INFO)

app = FastAPI()

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Global follow-up service and worker task
followup_service = None
followup_worker_task = None


async def followup_worker():
    """Background worker to execute scheduled follow-ups."""
    global followup_service
    
    # Initialize
    await redis_client.connect()
    followup_service = FollowupService(redis_client)
    
    logger.info("Follow-up worker started - checking every 30 seconds")
    
    while True:
        try:
            executed = await followup_service.execute_pending_followups()
            if executed > 0:
                logger.info(f"Executed {executed} follow-ups")
        except Exception as e:
            logger.error(f"Follow-up worker error: {e}")
        
        # Check every 30 seconds for testing
        await asyncio.sleep(30)


@app.on_event("startup")
async def startup_event():
    """Start the follow-up worker when server starts."""
    global followup_worker_task
    followup_worker_task = asyncio.create_task(followup_worker())
    logger.info("Follow-up worker task started")


@app.on_event("shutdown")
async def shutdown_event():
    """Clean up on shutdown."""
    global followup_worker_task
    if followup_worker_task:
        followup_worker_task.cancel()
        logger.info("Follow-up worker task cancelled")


@app.get("/api/token")
async def get_token():
    # Create a random room name if needed, or use a specific one
    # For this demo, let's use a unique room for each session or shared
    import uuid
    room_name = f"room-{uuid.uuid4()}"
    participant_identity = f"user-{uuid.uuid4()}"

    token = api.AccessToken(settings.livekit_api_key, settings.livekit_api_secret) \
        .with_identity(participant_identity) \
        .with_name(participant_identity) \
        .with_grants(api.VideoGrants(room_join=True, room=room_name))

    return {
        "accessToken": token.to_jwt(),
        "url": settings.livekit_url
    }


class OutboundCallRequest(BaseModel):
    phone: str

@app.post("/api/call")
async def start_outbound_call(request: OutboundCallRequest):
    import uuid
    room_name = f"room-{uuid.uuid4()}"
    
    # Initialize LiveKit API
    lk_api = api.LiveKitAPI(settings.livekit_url, settings.livekit_api_key, settings.livekit_api_secret)
    
    try:
        if not settings.sip_trunk_id:
             return {"error": "SIP_TRUNK_ID not configured"}
             
        # Create SIP Participant to dial out
        # This requires the SIP trunk to be configured in LiveKit Cloud
        # and the SIP_TRUNK_ID to be set in env
        await lk_api.sip.create_sip_participant(
            api.CreateSIPParticipantRequest(
                sip_trunk_id=settings.sip_trunk_id,
                sip_call_to=request.phone,
                room_name=room_name,
                participant_identity=f"sip-user-{request.phone}",
                participant_name="Phone User",
            )
        )
        
        # The Agent (worker) is already listening for new rooms.
        # It will automatically join 'room_name' when the room is created 
        # (which happens when the SIP participant is created/connected).
        
        return {"message": "Call initiated", "room_name": room_name}
    finally:
        await lk_api.aclose()


@app.get("/api/followups/pending")
async def get_pending_followups():
    """Debug endpoint to see pending follow-ups."""
    if not redis_client.client:
        await redis_client.connect()
    
    followups = await redis_client.client.zrange("followups:scheduled", 0, -1, withscores=True)
    import time
    current = time.time()
    
    result = []
    for key, score in followups:
        key = key.decode() if isinstance(key, bytes) else key
        result.append({
            "key": key,
            "execute_at": score,
            "seconds_remaining": int(score - current)
        })
    
    return {"pending": result, "current_time": current}

