"""
Redis-backed conversation memory store.
Stores conversations with client_id:customer_id keys to ensure proper isolation.
"""

import json
from typing import Optional
from datetime import datetime, timedelta
from src.config import get_settings
from src.config.redis_config import get_redis_store
from src.utils import get_logger

logger = get_logger("conversation_store")

# Key prefixes
CONVERSATION_PREFIX = "conversation:"
CUSTOMER_PREFIX = "customer:"


class ConversationStore:
    """
    Redis-backed conversation store with client isolation.
    Every conversation is stored under: conversation:{client_id}:{customer_id}
    """
    
    def __init__(self):
        self._redis_store = None
    
    def _get_redis(self):
        """Get Redis connection lazily."""
        if self._redis_store is None:
            self._redis_store = get_redis_store()
        return self._redis_store._get_redis()
    
    def _conversation_key(self, client_id: str, customer_id: str) -> str:
        """Generate Redis key for a conversation."""
        return f"{CONVERSATION_PREFIX}{client_id}:{customer_id}"
    
    def _customer_key(self, client_id: str, customer_id: str) -> str:
        """Generate Redis key for customer metadata."""
        return f"{CUSTOMER_PREFIX}{client_id}:{customer_id}"
    
    # ==========================================
    # Conversation History
    # ==========================================
    
    def add_message(
        self,
        client_id: str,
        customer_id: str,
        role: str,
        content: str,
        timestamp: Optional[str] = None,
    ) -> None:
        """Add a message to the conversation history."""
        try:
            r = self._get_redis()
            key = self._conversation_key(client_id, customer_id)
            
            message = {
                "role": role,
                "content": content,
                "timestamp": timestamp or datetime.utcnow().isoformat(),
            }
            
            # Get existing conversation or create new
            data = r.get(key)
            if data:
                conv = json.loads(data)
            else:
                conv = {
                    "client_id": client_id,
                    "customer_id": customer_id,
                    "messages": [],
                    "created_at": datetime.utcnow().isoformat(),
                }
            
            conv["messages"].append(message)
            conv["last_interaction"] = datetime.utcnow().isoformat()
            conv["message_count"] = len(conv["messages"])
            
            # Save back to Redis (expire after 90 days of inactivity)
            r.setex(key, timedelta(days=90), json.dumps(conv))
            
            logger.debug("message_added", client_id=client_id, customer_id=customer_id, role=role)
            
        except Exception as e:
            logger.error("message_add_failed", error=str(e))
    
    def get_history(
        self,
        client_id: str,
        customer_id: str,
        limit: int = 20,
    ) -> list[dict]:
        """Get conversation history for a customer."""
        try:
            r = self._get_redis()
            key = self._conversation_key(client_id, customer_id)
            
            data = r.get(key)
            if not data:
                return []
            
            conv = json.loads(data)
            messages = conv.get("messages", [])
            
            return messages[-limit:] if messages else []
            
        except Exception as e:
            logger.error("history_get_failed", error=str(e))
            return []
    
    def get_conversation(self, client_id: str, customer_id: str) -> Optional[dict]:
        """Get full conversation data including metadata."""
        try:
            r = self._get_redis()
            key = self._conversation_key(client_id, customer_id)
            
            data = r.get(key)
            if not data:
                return None
            
            return json.loads(data)
            
        except Exception as e:
            logger.error("conversation_get_failed", error=str(e))
            return None
    
    # ==========================================
    # User Type Detection
    # ==========================================
    
    def get_user_type(self, client_id: str, customer_id: str) -> str:
        """
        Determine if customer is new, returning, or inactive.
        
        Returns:
            - "new": First time messaging
            - "returning": Has messaged before, last 7 days
            - "inactive": Has messaged before, but not in 7+ days
        """
        try:
            conv = self.get_conversation(client_id, customer_id)
            
            if not conv or not conv.get("messages"):
                return "new"
            
            # Check last interaction time
            last_interaction = conv.get("last_interaction")
            if last_interaction:
                last_time = datetime.fromisoformat(last_interaction.replace("Z", "+00:00"))
                days_inactive = (datetime.utcnow() - last_time.replace(tzinfo=None)).days
                
                if days_inactive > 7:
                    return "inactive"
            
            return "returning"
            
        except Exception as e:
            logger.error("user_type_check_failed", error=str(e))
            return "new"
    
    def get_last_summary(self, client_id: str, customer_id: str) -> Optional[str]:
        """Get the last conversation summary for context."""
        conv = self.get_conversation(client_id, customer_id)
        if conv:
            return conv.get("summary")
        return None
    
    # ==========================================
    # Customer Metadata
    # ==========================================
    
    def update_customer_metadata(
        self,
        client_id: str,
        customer_id: str,
        **kwargs,
    ) -> None:
        """Update customer metadata (lead score, name, pain points, etc.)."""
        try:
            r = self._get_redis()
            key = self._customer_key(client_id, customer_id)
            
            # Get existing metadata
            data = r.get(key)
            metadata = json.loads(data) if data else {}
            
            # Update with new values
            metadata.update(kwargs)
            metadata["updated_at"] = datetime.utcnow().isoformat()
            
            # Save (expire after 1 year)
            r.setex(key, timedelta(days=365), json.dumps(metadata))
            
            logger.debug("customer_metadata_updated", client_id=client_id, customer_id=customer_id)
            
        except Exception as e:
            logger.error("metadata_update_failed", error=str(e))
    
    def get_customer_metadata(self, client_id: str, customer_id: str) -> dict:
        """Get customer metadata."""
        try:
            r = self._get_redis()
            key = self._customer_key(client_id, customer_id)
            
            data = r.get(key)
            return json.loads(data) if data else {}
            
        except Exception as e:
            logger.error("metadata_get_failed", error=str(e))
            return {}
    
    # ==========================================
    # Conversation Summary (for AI context)
    # ==========================================
    
    def update_summary(
        self,
        client_id: str,
        customer_id: str,
        summary: str,
        pain_points: list[str] = None,
        topics: list[str] = None,
    ) -> None:
        """Update the conversation summary (called by LLM summarizer)."""
        try:
            r = self._get_redis()
            key = self._conversation_key(client_id, customer_id)
            
            data = r.get(key)
            if not data:
                return
            
            conv = json.loads(data)
            conv["summary"] = summary
            if pain_points:
                conv["pain_points"] = pain_points
            if topics:
                conv["topics"] = topics
            conv["summary_updated_at"] = datetime.utcnow().isoformat()
            
            r.setex(key, timedelta(days=90), json.dumps(conv))
            
            logger.info("summary_updated", client_id=client_id, customer_id=customer_id)
            
        except Exception as e:
            logger.error("summary_update_failed", error=str(e))
    
    # ==========================================
    # List Conversations (for dashboard)
    # ==========================================
    
    def list_conversations(self, client_id: str, limit: int = 50) -> list[dict]:
        """List all conversations for a client (for dashboard view)."""
        try:
            r = self._get_redis()
            pattern = f"{CONVERSATION_PREFIX}{client_id}:*"
            keys = r.keys(pattern)
            
            conversations = []
            for key in keys[:limit]:
                data = r.get(key)
                if data:
                    conv = json.loads(data)
                    # Return summary info only
                    conversations.append({
                        "customer_id": conv.get("customer_id"),
                        "message_count": conv.get("message_count", 0),
                        "last_interaction": conv.get("last_interaction"),
                        "summary": conv.get("summary", "")[:100],
                    })
            
            # Sort by last interaction
            conversations.sort(key=lambda x: x.get("last_interaction", ""), reverse=True)
            
            return conversations
            
        except Exception as e:
            logger.error("list_conversations_failed", error=str(e))
            return []
    
    def clear_conversation(self, client_id: str, customer_id: str) -> bool:
        """Clear a conversation (for testing/GDPR)."""
        try:
            r = self._get_redis()
            key = self._conversation_key(client_id, customer_id)
            r.delete(key)
            logger.info("conversation_cleared", client_id=client_id, customer_id=customer_id)
            return True
        except Exception as e:
            logger.error("conversation_clear_failed", error=str(e))
            return False


# Global instance
_conversation_store: Optional[ConversationStore] = None


def get_conversation_store() -> ConversationStore:
    """Get the global conversation store instance."""
    global _conversation_store
    if _conversation_store is None:
        _conversation_store = ConversationStore()
    return _conversation_store
