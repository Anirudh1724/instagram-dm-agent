"""
In-memory conversation memory store.
Can be swapped with Redis for production use.
"""

from typing import Optional
from src.core.state import Message
from src.utils import get_logger

logger = get_logger("memory")


class ConversationMemory:
    """
    Simple in-memory conversation store.
    Stores conversation history per user.
    """
    
    def __init__(self):
        self._store: dict[str, list[Message]] = {}
        self._user_metadata: dict[str, dict] = {}
    
    def get_history(self, user_id: str, limit: int = 20) -> list[Message]:
        """Retrieve conversation history for a user."""
        history = self._store.get(user_id, [])
        return history[-limit:] if history else []
    
    def add_message(self, user_id: str, role: str, content: str, timestamp: str) -> None:
        """Add a message to the conversation history."""
        if user_id not in self._store:
            self._store[user_id] = []
        
        self._store[user_id].append(Message(
            role=role,
            content=content,
            timestamp=timestamp,
        ))
        logger.debug("message_added", user_id=user_id, role=role)
    
    def get_user_type(self, user_id: str) -> str:
        """Determine if user is new, returning, or inactive."""
        history = self._store.get(user_id, [])
        
        if not history:
            return "new"
        
        # Check if last message was more than 7 days ago
        # For MVP, we just check if there's any history
        if len(history) > 0:
            return "returning"
        
        return "inactive"
    
    def get_metadata(self, user_id: str) -> dict:
        """Get user metadata (lead score, preferences, etc.)."""
        return self._user_metadata.get(user_id, {})
    
    def set_metadata(self, user_id: str, key: str, value: any) -> None:
        """Store user metadata."""
        if user_id not in self._user_metadata:
            self._user_metadata[user_id] = {}
        self._user_metadata[user_id][key] = value
    
    def clear_history(self, user_id: str) -> None:
        """Clear conversation history for a user."""
        if user_id in self._store:
            del self._store[user_id]
        logger.info("history_cleared", user_id=user_id)


# Global memory instance
memory = ConversationMemory()


def get_memory() -> ConversationMemory:
    """Get the global memory instance."""
    return memory
