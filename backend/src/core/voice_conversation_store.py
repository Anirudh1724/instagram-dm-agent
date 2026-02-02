"""
Voice conversation store.
Reads voice agent conversation data from Redis for dashboard display.
"""

import json
from typing import Optional, List, Dict, Any
from datetime import datetime, timedelta
from src.config.redis_config import get_redis_store
from src.utils import get_logger

logger = get_logger("voice_conversation_store")

# Key prefixes for voice conversations
VOICE_CONVERSATION_PREFIX = "voice_conversation:"


class VoiceConversationStore:
    """Redis-backed store for reading voice agent conversation data."""
    
    def __init__(self):
        self._redis_store = None
    
    def _get_redis(self):
        """Get Redis connection lazily."""
        if not self._redis_store:
            self._redis_store = get_redis_store()
        return self._redis_store
    
    def _voice_conversation_key(self, client_id: str, call_id: str) -> str:
        """Generate Redis key for a voice conversation."""
        return f"{VOICE_CONVERSATION_PREFIX}{client_id}:{call_id}"
    
    def list_voice_conversations(
        self,
        client_id: str,
        limit: int = 50,
        call_type: str = None,  # "inbound" or "outbound"
        status: str = None,  # "answered", "missed", "voicemail", "booked"
    ) -> List[Dict[str, Any]]:
        """
        List all voice conversations for a client.
        
        Args:
            client_id: Client identifier
            limit: Maximum number of conversations to return
            call_type: Filter by call type (inbound/outbound)
            status: Filter by call status
            
        Returns:
            List of voice conversation summaries
        """
        r = self._get_redis()
        
        try:
            pattern = f"{VOICE_CONVERSATION_PREFIX}{client_id}:*"
            keys = r.keys(pattern)
            
            conversations = []
            
            for key in keys:
                # Skip message keys (we want metadata keys)
                if key.endswith(":messages"):
                    continue
                    
                try:
                    data = r.hgetall(key)
                    if not data:
                        continue
                    
                    conv = {k.decode() if isinstance(k, bytes) else k: 
                            v.decode() if isinstance(v, bytes) else v 
                            for k, v in data.items()}
                    
                    # Apply filters
                    if call_type and conv.get("call_type") != call_type:
                        continue
                    if status and conv.get("status") != status:
                        continue
                    
                    # Get message count
                    messages_key = f"{key}:messages" if isinstance(key, str) else key.decode() + ":messages"
                    message_count = r.llen(messages_key)
                    
                    conversations.append({
                        "id": conv.get("id", ""),
                        "call_id": conv.get("id", ""),
                        "phone_number": conv.get("phone_number", conv.get("user_id", "")),
                        "call_type": conv.get("call_type", "inbound"),
                        "status": conv.get("status", "answered"),
                        "duration": conv.get("duration", "0:00"),
                        "created_at": conv.get("created_at", ""),
                        "room_name": conv.get("room_name", ""),
                        "message_count": message_count,
                    })
                    
                except Exception as e:
                    logger.warning("voice_conversation_parse_error", key=key, error=str(e))
                    continue
            
            # Sort by created_at descending
            conversations.sort(
                key=lambda x: x.get("created_at", ""),
                reverse=True
            )
            
            return conversations[:limit]
            
        except Exception as e:
            logger.error("list_voice_conversations_failed", client_id=client_id, error=str(e))
            return []
    
    def get_voice_conversation(
        self,
        client_id: str,
        call_id: str,
    ) -> Optional[Dict[str, Any]]:
        """
        Get a specific voice conversation with its messages.
        
        Args:
            client_id: Client identifier
            call_id: Call/conversation identifier
            
        Returns:
            Voice conversation data with messages, or None if not found
        """
        r = self._get_redis()
        
        try:
            key = self._voice_conversation_key(client_id, call_id)
            
            # Get metadata
            data = r.hgetall(key)
            if not data:
                return None
            
            conv = {k.decode() if isinstance(k, bytes) else k: 
                    v.decode() if isinstance(v, bytes) else v 
                    for k, v in data.items()}
            
            # Get messages
            messages_key = f"{key}:messages"
            raw_messages = r.lrange(messages_key, 0, -1)
            
            messages = []
            for msg in raw_messages:
                try:
                    msg_str = msg.decode() if isinstance(msg, bytes) else msg
                    messages.append(json.loads(msg_str))
                except Exception as e:
                    logger.warning("message_parse_error", error=str(e))
                    continue
            
            return {
                "id": conv.get("id", call_id),
                "phone_number": conv.get("phone_number", conv.get("user_id", "")),
                "call_type": conv.get("call_type", "inbound"),
                "status": conv.get("status", "answered"),
                "duration": conv.get("duration", "0:00"),
                "created_at": conv.get("created_at", ""),
                "room_name": conv.get("room_name", ""),
                "messages": messages,
            }
            
        except Exception as e:
            logger.error("get_voice_conversation_failed", 
                        client_id=client_id, call_id=call_id, error=str(e))
            return None
    
    def get_voice_analytics(
        self,
        client_id: str,
        period: str = "daily",
    ) -> Dict[str, Any]:
        """
        Get voice analytics for dashboard.
        
        Args:
            client_id: Client identifier
            period: Time period - daily, weekly, or monthly
            
        Returns:
            Analytics data including calls received, answered, etc.
        """
        r = self._get_redis()
        now = datetime.utcnow()
        
        # Define time ranges
        if period == "daily":
            current_start = now - timedelta(days=1)
            previous_start = now - timedelta(days=2)
            chart_days = 7
        elif period == "weekly":
            current_start = now - timedelta(weeks=1)
            previous_start = now - timedelta(weeks=2)
            chart_days = 7
        else:  # monthly
            current_start = now - timedelta(days=30)
            previous_start = now - timedelta(days=60)
            chart_days = 30
        
        try:
            pattern = f"{VOICE_CONVERSATION_PREFIX}{client_id}:*"
            keys = r.keys(pattern)
            
            current_stats = {
                "calls_received": 0,
                "calls_answered": 0,
                "unique_callers": set(),
                "bookings": 0,
            }
            
            previous_stats = {
                "calls_received": 0,
                "calls_answered": 0,
                "unique_callers": set(),
                "bookings": 0,
            }
            
            # Chart data
            chart_data = {}
            for i in range(chart_days):
                day = now - timedelta(days=i)
                date_key = day.strftime("%Y-%m-%d")
                label = day.strftime("%b %d") if chart_days <= 7 else day.strftime("%d")
                chart_data[date_key] = {"label": label, "received": 0, "answered": 0}
            
            for key in keys:
                # Skip message keys
                key_str = key.decode() if isinstance(key, bytes) else key
                if key_str.endswith(":messages"):
                    continue
                    
                try:
                    data = r.hgetall(key)
                    if not data:
                        continue
                    
                    conv = {k.decode() if isinstance(k, bytes) else k: 
                            v.decode() if isinstance(v, bytes) else v 
                            for k, v in data.items()}
                    
                    created_at = conv.get("created_at", "")
                    phone_number = conv.get("phone_number", conv.get("user_id", ""))
                    status = conv.get("status", "")
                    
                    # Parse created_at
                    if created_at:
                        try:
                            # Handle Unix timestamp
                            if created_at.replace(".", "").isdigit():
                                conv_time = datetime.fromtimestamp(float(created_at))
                            else:
                                conv_time = datetime.fromisoformat(created_at.replace("Z", "+00:00"))
                                conv_time = conv_time.replace(tzinfo=None)
                        except:
                            conv_time = now - timedelta(days=365)
                    else:
                        conv_time = now - timedelta(days=365)
                    
                    # Current period stats
                    if conv_time >= current_start:
                        current_stats["calls_received"] += 1
                        current_stats["unique_callers"].add(phone_number)
                        
                        if status in ["answered", "booked"]:
                            current_stats["calls_answered"] += 1
                        if status == "booked":
                            current_stats["bookings"] += 1
                        
                        # Chart data
                        date_key = conv_time.strftime("%Y-%m-%d")
                        if date_key in chart_data:
                            chart_data[date_key]["received"] += 1
                            if status in ["answered", "booked"]:
                                chart_data[date_key]["answered"] += 1
                    
                    # Previous period stats
                    elif conv_time >= previous_start:
                        previous_stats["calls_received"] += 1
                        previous_stats["unique_callers"].add(phone_number)
                        
                        if status in ["answered", "booked"]:
                            previous_stats["calls_answered"] += 1
                        if status == "booked":
                            previous_stats["bookings"] += 1
                
                except Exception as e:
                    logger.warning("voice_analytics_parse_error", key=key, error=str(e))
                    continue
            
            # Calculate answer rate
            if current_stats["calls_received"] > 0:
                answer_rate = round(
                    (current_stats["calls_answered"] / current_stats["calls_received"]) * 100, 1
                )
            else:
                answer_rate = 0
            
            if previous_stats["calls_received"] > 0:
                prev_answer_rate = round(
                    (previous_stats["calls_answered"] / previous_stats["calls_received"]) * 100, 1
                )
            else:
                prev_answer_rate = 0
            
            # Calculate changes
            calls_change = current_stats["calls_received"] - previous_stats["calls_received"]
            unique_change = len(current_stats["unique_callers"]) - len(previous_stats["unique_callers"])
            answered_change = current_stats["calls_answered"] - previous_stats["calls_answered"]
            answer_rate_change = round(answer_rate - prev_answer_rate, 1)
            bookings_change = current_stats["bookings"] - previous_stats["bookings"]
            
            # Format chart data
            sorted_chart = sorted(chart_data.items(), key=lambda x: x[0])
            chart_list = [v for k, v in sorted_chart]
            
            return {
                "calls_received": current_stats["calls_received"],
                "unique_callers": len(current_stats["unique_callers"]),
                "calls_answered": current_stats["calls_answered"],
                "answer_rate": answer_rate,
                "bookings": current_stats["bookings"],
                "calls_change": f"+{calls_change}" if calls_change >= 0 else str(calls_change),
                "unique_change": f"+{unique_change}" if unique_change >= 0 else str(unique_change),
                "answered_change": f"+{answered_change}" if answered_change >= 0 else str(answered_change),
                "answer_rate_change": f"+{answer_rate_change}%" if answer_rate_change >= 0 else f"{answer_rate_change}%",
                "bookings_change": f"+{bookings_change}" if bookings_change >= 0 else str(bookings_change),
                "chart_data": chart_list,
            }
            
        except Exception as e:
            logger.error("voice_analytics_failed", client_id=client_id, error=str(e))
            return {
                "calls_received": 0,
                "unique_callers": 0,
                "calls_answered": 0,
                "answer_rate": 0,
                "bookings": 0,
                "calls_change": "+0",
                "unique_change": "+0",
                "answered_change": "+0",
                "answer_rate_change": "+0%",
                "bookings_change": "+0",
                "chart_data": [],
            }


# Global instance
_voice_conversation_store: Optional[VoiceConversationStore] = None


def get_voice_conversation_store() -> VoiceConversationStore:
    """Get the global voice conversation store instance."""
    global _voice_conversation_store
    if _voice_conversation_store is None:
        _voice_conversation_store = VoiceConversationStore()
    return _voice_conversation_store
