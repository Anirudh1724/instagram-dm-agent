import redis.asyncio as redis
import json
import time
import uuid
import os
from config import settings

# Default client ID for voice agent (can be overridden per call)
DEFAULT_CLIENT_ID = os.getenv("VOICE_CLIENT_ID", "lumoscale")

class RedisClient:
    def __init__(self):
        self.client = None

    async def connect(self):
        if not self.client:
            self.client = redis.from_url(settings.redis_url)

    async def create_conversation(
        self, 
        user_id: str, 
        metadata: dict = None,
        client_id: str = None,
        call_type: str = "inbound",
        phone_number: str = None,
    ) -> str:
        """
        Create a new voice conversation.
        
        Args:
            user_id: User/participant identifier
            metadata: Additional metadata (room_name, etc.)
            client_id: Client identifier for dashboard isolation
            call_type: "inbound" or "outbound"
            phone_number: Phone number for outbound calls
            
        Returns:
            Conversation ID
        """
        if not self.client:
            await self.connect()
        
        conv_id = str(uuid.uuid4())
        client = client_id or DEFAULT_CLIENT_ID
        
        # Use voice_conversation prefix for dashboard compatibility
        key = f"voice_conversation:{client}:{conv_id}"
        
        parsed_metadata = metadata or {}
        
        data = {
            "id": conv_id,
            "user_id": user_id,
            "client_id": client,
            "call_type": call_type,
            "phone_number": phone_number or user_id,
            "status": "answered",  # Default status
            "duration": "0:00",
            "created_at": str(time.time()),
            "room_name": parsed_metadata.get("room_name", ""),
            "metadata": json.dumps(parsed_metadata)
        }
        
        await self.client.hset(key, mapping=data)
        
        # Store conv_id to key mapping for message lookup
        self._current_conv_key = key
        self._current_conv_id = conv_id
        
        return conv_id

    async def add_message(self, conv_id: str, role: str, content: str, client_id: str = None):
        """
        Add a message to the conversation.
        
        Args:
            conv_id: Conversation ID
            role: "user" or "assistant"
            content: Message content
            client_id: Client identifier (optional, will try to find key)
        """
        if not self.client:
            await self.connect()
        
        # Try to find the key
        client = client_id or DEFAULT_CLIENT_ID
        key = f"voice_conversation:{client}:{conv_id}:messages"
        
        message = {
            "role": role,
            "content": content,
            "timestamp": time.time()
        }
        
        await self.client.rpush(key, json.dumps(message))
    
    async def update_call_status(
        self, 
        conv_id: str, 
        status: str = None, 
        duration: str = None,
        client_id: str = None
    ):
        """
        Update call status and duration.
        
        Args:
            conv_id: Conversation ID
            status: Call status (answered, missed, voicemail, booked)
            duration: Call duration string (e.g., "2:30")
            client_id: Client identifier
        """
        if not self.client:
            await self.connect()
        
        client = client_id or DEFAULT_CLIENT_ID
        key = f"voice_conversation:{client}:{conv_id}"
        
        updates = {}
        if status:
            updates["status"] = status
        if duration:
            updates["duration"] = duration
        
        if updates:
            await self.client.hset(key, mapping=updates)

    async def store_lead_qualification(
        self,
        conv_id: str,
        qualification: str,
        lead_data: dict,
        client_id: str = None
    ):
        """
        Store lead qualification for a conversation.
        
        Args:
            conv_id: Conversation ID
            qualification: 'hot', 'warm', or 'cold'
            lead_data: Dict with name, email, phone, industry, service_interest, notes
            client_id: Client identifier
        """
        if not self.client:
            await self.connect()
        
        client = client_id or DEFAULT_CLIENT_ID
        key = f"voice_conversation:{client}:{conv_id}"
        
        # Update conversation with qualification
        updates = {
            "qualification": qualification,
            "lead_name": lead_data.get("name", ""),
            "lead_email": lead_data.get("email", ""),
            "lead_phone": lead_data.get("phone", ""),
            "lead_industry": lead_data.get("industry", ""),
            "lead_service_interest": lead_data.get("service_interest", ""),
            "qualification_notes": lead_data.get("notes", ""),
            "qualified_at": str(time.time())
        }
        
        await self.client.hset(key, mapping=updates)
        
        # Also store in a separate key for easy lead queries
        lead_key = f"lead:{client}:{conv_id}"
        lead_record = {
            "conv_id": conv_id,
            "client_id": client,
            "qualification": qualification,
            **lead_data,
            "created_at": str(time.time())
        }
        await self.client.hset(lead_key, mapping={k: str(v) for k, v in lead_record.items()})
    
    async def get_leads_by_qualification(
        self,
        client_id: str = None,
        qualification: str = None
    ) -> list:
        """
        Get leads filtered by qualification.
        
        Args:
            client_id: Client identifier
            qualification: Optional filter ('hot', 'warm', 'cold')
            
        Returns:
            List of lead records
        """
        if not self.client:
            await self.connect()
        
        client = client_id or DEFAULT_CLIENT_ID
        pattern = f"lead:{client}:*"
        
        leads = []
        cursor = 0
        while True:
            cursor, keys = await self.client.scan(cursor, match=pattern, count=100)
            for key in keys:
                data = await self.client.hgetall(key)
                if data:
                    lead = {k.decode() if isinstance(k, bytes) else k: v.decode() if isinstance(v, bytes) else v for k, v in data.items()}
                    if qualification is None or lead.get("qualification") == qualification:
                        leads.append(lead)
            if cursor == 0:
                break
        
        return leads

redis_client = RedisClient()


