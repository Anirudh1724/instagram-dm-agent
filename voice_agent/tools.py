from livekit.agents import llm
from livekit import rtc
from typing import Annotated
import logging
import os

logger = logging.getLogger("voice-agent-tools")

# Human agent number to transfer calls to - configure in .env
HUMAN_AGENT_NUMBER = os.getenv("HUMAN_AGENT_NUMBER", "+918919053970")

class VoiceAgentTools:
    """Tools that require room context for SIP operations"""
    
    def __init__(self, room: rtc.Room, sip_participant: rtc.RemoteParticipant = None):
        self.room = room
        self.sip_participant = sip_participant
    
    @llm.function_tool(description="Transfer the call to a human agent when the caller explicitly requests to speak with a real person")
    async def transfer_to_human(self):
        """Transfer the current call to a human agent.
        Use this when the caller explicitly asks to speak with a human or real person.
        """
        logger.info(f"Transferring call to human agent: {HUMAN_AGENT_NUMBER}")
        
        try:
            # Find the SIP participant in the room
            sip_participant = None
            for participant in self.room.remote_participants.values():
                if participant.identity.startswith("sip-"):
                    sip_participant = participant
                    break
            
            if not sip_participant:
                logger.error("No SIP participant found to transfer")
                return "I apologize, but I'm unable to transfer your call right now. Please call back and our team will assist you."
            
            # Use LiveKit's SIP transfer
            # This requires the livekit-api package
            from livekit import api
            from config import settings
            
            lk_api = api.LiveKitAPI(
                settings.livekit_url, 
                settings.livekit_api_key, 
                settings.livekit_api_secret
            )
            
            try:
                # Transfer the SIP call to the human agent number
                await lk_api.sip.transfer_sip_participant(
                    api.TransferSIPParticipantRequest(
                        room_name=self.room.name,
                        participant_identity=sip_participant.identity,
                        transfer_to=f"sip:{HUMAN_AGENT_NUMBER}@sip.livekit.cloud",
                    )
                )
                logger.info(f"Call transferred successfully to {HUMAN_AGENT_NUMBER}")
                return "Transferring you now to one of our team members. Please hold."
            finally:
                await lk_api.aclose()
                
        except Exception as e:
            logger.error(f"Failed to transfer call: {e}")
            return "I apologize, but I'm unable to transfer your call right now. Please try calling our direct line or we can have someone call you back."


@llm.function_tool(description="Book a meeting with the user")
def book_meeting(time: str):
    """Book a meeting with the user
    
    Args:
        time: The time to book the meeting for
    """
    logger.info(f"Booking meeting for {time}")
    # In a real app, this would integrate with a calendar API
    return f"Meeting booked for {time}"


# Global references for qualify_lead tool (set by main.py)
_redis_client = None
_followup_service = None
_current_conv_id = None
_current_client_id = None
_current_phone = None

def set_qualification_context(redis_client, followup_service, conv_id: str, client_id: str = None, phone: str = None):
    """Set the context for lead qualification (called from main.py)."""
    global _redis_client, _followup_service, _current_conv_id, _current_client_id, _current_phone
    _redis_client = redis_client
    _followup_service = followup_service
    _current_conv_id = conv_id
    _current_client_id = client_id
    _current_phone = phone


@llm.function_tool(description="Qualify the lead at the end of the call. MUST be called before ending every conversation.")
async def qualify_lead(
    qualification: Annotated[str, "Lead qualification: 'hot', 'warm', or 'cold'"],
    name: Annotated[str, "Lead's name if collected, otherwise 'Unknown'"] = "Unknown",
    email: Annotated[str, "Lead's email if collected, otherwise empty string"] = "",
    phone: Annotated[str, "Lead's phone number if known"] = "",
    industry: Annotated[str, "Lead's industry: 'real_estate', 'healthcare', or 'other'"] = "other",
    service_interest: Annotated[str, "Service type: 'voice', 'text', or 'both'"] = "",
    notes: Annotated[str, "Brief notes explaining the qualification reasoning"] = ""
):
    """Qualify the lead based on conversation signals.
    
    Call this at the end of every conversation to record lead qualification
    and trigger appropriate follow-ups.
    
    Args:
        qualification: 'hot' (booked meeting), 'warm' (interested), or 'cold' (not interested)
        name: Lead's name if collected
        email: Lead's email if collected
        phone: Lead's phone number
        industry: Lead's industry
        service_interest: Type of service they're interested in
        notes: Brief qualification reasoning
    """
    global _redis_client, _followup_service, _current_conv_id, _current_client_id, _current_phone
    
    # Use the phone from context if not provided by the LLM
    actual_phone = phone if phone else _current_phone
    
    logger.info(f"Qualifying lead: {qualification} - {name} - phone: {actual_phone} - {notes}")
    
    lead_data = {
        "name": name,
        "email": email,
        "phone": actual_phone,
        "industry": industry,
        "service_interest": service_interest,
        "notes": notes
    }
    
    try:
        # Store qualification in Redis
        if _redis_client and _current_conv_id:
            await _redis_client.store_lead_qualification(
                conv_id=_current_conv_id,
                qualification=qualification,
                lead_data=lead_data,
                client_id=_current_client_id
            )
            
            # Schedule follow-up if not a hot lead
            if _followup_service and qualification != "hot":
                await _followup_service.schedule_followup(
                    conv_id=_current_conv_id,
                    lead_type=qualification,
                    lead_data=lead_data,
                    client_id=_current_client_id
                )
            
            logger.info(f"Lead {_current_conv_id} qualified as {qualification}")
            
            if qualification == "hot":
                return f"Lead qualified as HOT. Great job closing! No follow-up needed."
            elif qualification == "warm":
                return f"Lead qualified as WARM. Follow-up call and SMS scheduled."
            else:
                return f"Lead qualified as COLD. SMS follow-up scheduled."
        else:
            logger.warning("No Redis client or conv_id available for qualification")
            return f"Lead qualification recorded: {qualification}"
            
    except Exception as e:
        logger.error(f"Error qualifying lead: {e}")
        return f"Lead qualification attempted: {qualification}"

