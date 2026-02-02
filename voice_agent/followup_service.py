"""
Follow-up Service for Lead Qualification System.
Handles scheduling and executing follow-up calls and SMS for qualified leads.
"""

import asyncio
import logging
import json
import time
from typing import Optional
from config import settings

logger = logging.getLogger("followup-service")


class FollowupService:
    """Service to manage lead follow-ups (calls and SMS)."""
    
    def __init__(self, redis_client):
        self.redis_client = redis_client
        self.twilio_client = None
        self._init_twilio()
    
    def _init_twilio(self):
        """Initialize Twilio client if credentials are available."""
        if settings.twilio_account_sid and settings.twilio_auth_token:
            try:
                from twilio.rest import Client
                self.twilio_client = Client(
                    settings.twilio_account_sid,
                    settings.twilio_auth_token
                )
                logger.info("Twilio client initialized successfully")
            except ImportError:
                logger.warning("Twilio package not installed. SMS follow-ups disabled.")
            except Exception as e:
                logger.error(f"Failed to initialize Twilio: {e}")
    
    async def schedule_followup(
        self,
        conv_id: str,
        lead_type: str,
        lead_data: dict,
        client_id: str = None
    ) -> bool:
        """
        Schedule a follow-up based on lead type.
        
        Args:
            conv_id: Conversation ID
            lead_type: 'hot', 'warm', or 'cold'
            lead_data: Dict with name, email, phone, industry, service_interest, notes
            client_id: Client identifier
            
        Returns:
            True if scheduled successfully
        """
        if lead_type == "hot":
            # Hot leads booked a meeting - no follow-up needed
            logger.info(f"Hot lead {conv_id} - no follow-up scheduled (meeting booked)")
            return True
        
        # Calculate follow-up time
        if lead_type == "warm":
            delay_minutes = settings.followup_delay_warm
            followup_type = "call_and_sms"
        else:  # cold
            delay_minutes = settings.followup_delay_cold
            followup_type = "sms_only"
        
        execute_at = time.time() + (delay_minutes * 60)
        
        followup_data = {
            "conv_id": conv_id,
            "client_id": client_id or "lumoscale",
            "lead_type": lead_type,
            "followup_type": followup_type,
            "execute_at": execute_at,
            "status": "pending",
            "lead_data": json.dumps(lead_data),
            "created_at": time.time()
        }
        
        # Store in Redis with sorted set for easy retrieval by time
        key = f"followup:{client_id or 'lumoscale'}:{conv_id}"
        await self.redis_client.client.hset(key, mapping=followup_data)
        
        # Add to sorted set for scheduled execution
        await self.redis_client.client.zadd(
            "followups:scheduled",
            {key: execute_at}
        )
        
        logger.info(f"Scheduled {followup_type} follow-up for {lead_type} lead {conv_id} at {execute_at}")
        return True
    
    async def send_sms(self, phone: str, message: str) -> bool:
        """
        Send an SMS using Twilio.
        
        Args:
            phone: Phone number in E.164 format
            message: SMS message content
            
        Returns:
            True if sent successfully
        """
        if not self.twilio_client:
            logger.warning(f"SMS not sent to {phone} - Twilio not configured")
            return False
        
        try:
            # Ensure phone is in E.164 format
            if not phone.startswith("+"):
                phone = f"+{phone}"
            
            message = self.twilio_client.messages.create(
                body=message,
                from_=settings.twilio_phone_number,
                to=phone
            )
            logger.info(f"SMS sent to {phone}, SID: {message.sid}")
            return True
        except Exception as e:
            logger.error(f"Failed to send SMS to {phone}: {e}")
            return False
    
    async def trigger_outbound_call(self, phone: str, greeting: str = None) -> bool:
        """
        Trigger an outbound call using the voice agent.
        
        Args:
            phone: Phone number to call
            greeting: Custom greeting for the call
            
        Returns:
            True if call initiated successfully
        """
        import aiohttp
        
        try:
            # Call the local server endpoint
            async with aiohttp.ClientSession() as session:
                async with session.post(
                    "http://localhost:8000/api/call",
                    json={"phone": phone},
                    timeout=aiohttp.ClientTimeout(total=10)
                ) as response:
                    if response.status == 200:
                        result = await response.json()
                        logger.info(f"Outbound call initiated to {phone}: {result}")
                        return True
                    else:
                        logger.error(f"Failed to initiate call: {response.status}")
                        return False
        except Exception as e:
            logger.error(f"Failed to trigger outbound call to {phone}: {e}")
            return False
    
    async def execute_pending_followups(self) -> int:
        """
        Execute all pending follow-ups that are due.
        
        Returns:
            Number of follow-ups executed
        """
        if not self.redis_client.client:
            await self.redis_client.connect()
        
        current_time = time.time()
        
        # Get all follow-ups due for execution
        due_followups = await self.redis_client.client.zrangebyscore(
            "followups:scheduled",
            0,
            current_time
        )
        
        executed = 0
        for followup_key in due_followups:
            try:
                followup_key = followup_key.decode() if isinstance(followup_key, bytes) else followup_key
                data = await self.redis_client.client.hgetall(followup_key)
                
                if not data:
                    continue
                
                # Decode data
                data = {k.decode() if isinstance(k, bytes) else k: v.decode() if isinstance(v, bytes) else v for k, v in data.items()}
                
                if data.get("status") == "completed":
                    continue
                
                lead_data = json.loads(data.get("lead_data", "{}"))
                followup_type = data.get("followup_type", "sms_only")
                lead_type = data.get("lead_type", "cold")
                
                phone = lead_data.get("phone", "")
                name = lead_data.get("name", "there")
                service_interest = lead_data.get("service_interest", "AI")
                
                # Format SMS message
                from prompt_manager import prompt_manager
                if lead_type == "warm":
                    sms_template = prompt_manager.get_followup_message("warm_sms")
                else:
                    sms_template = prompt_manager.get_followup_message("cold_sms")
                
                sms_message = sms_template.format(
                    name=name,
                    service_type=service_interest,
                    booking_link=settings.booking_link
                )
                
                # Execute based on type
                logger.info(f"Executing {followup_type} for phone: {phone}, name: {name}")
                if followup_type == "call_and_sms":
                    # Trigger follow-up call (skip SMS if Twilio not configured)
                    if self.twilio_client:
                        await self.send_sms(phone, sms_message)
                    # Then trigger call
                    await self.trigger_outbound_call(phone)
                else:
                    # SMS only
                    await self.send_sms(phone, sms_message)
                
                # Mark as completed
                await self.redis_client.client.hset(followup_key, "status", "completed")
                await self.redis_client.client.zrem("followups:scheduled", followup_key)
                
                executed += 1
                logger.info(f"Executed {followup_type} follow-up for {followup_key}")
                
            except Exception as e:
                logger.error(f"Error executing follow-up {followup_key}: {e}")
        
        return executed


# Background task to check and execute follow-ups
async def followup_worker(redis_client):
    """Background worker to execute scheduled follow-ups."""
    service = FollowupService(redis_client)
    
    while True:
        try:
            executed = await service.execute_pending_followups()
            if executed > 0:
                logger.info(f"Executed {executed} follow-ups")
        except Exception as e:
            logger.error(f"Follow-up worker error: {e}")
        
        # Check every 30 seconds for testing (change to 60 for production)
        await asyncio.sleep(30)
