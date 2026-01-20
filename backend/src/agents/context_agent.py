"""
Context Agent - First agent in the pipeline.
Loads conversation history and identifies user type.
"""

from typing import Any
from src.agents.base_agent import BaseAgent
from src.core.state import ConversationState
from src.core.conversation_store import get_conversation_store


class ContextAgent(BaseAgent):
    """
    Runs first — always.
    
    Responsibilities:
    - Identify if user is new, returning, or inactive
    - Load previous conversation history from Redis
    - Provide full context to all other agents
    """
    
    def __init__(self):
        super().__init__("context")
        self.conv_store = get_conversation_store()
    
    def process(self, state: ConversationState) -> dict[str, Any]:
        user_id = state["user_id"]
        client_id = state.get("client_id", user_id)  # Use client_id for multi-tenant
        current_message = state["current_message"]
        
        # Get user type from Redis conversation store
        user_type = state.get("user_type") or self.conv_store.get_user_type(client_id, user_id)
        
        # Load conversation history from Redis (includes both customer and agent messages)
        history = self.conv_store.get_history(client_id, user_id, limit=20)
        
        # Convert to the format expected by the response agent
        formatted_history = []
        for msg in history:
            role = "user" if msg.get("role") == "customer" else "assistant"
            formatted_history.append({
                "role": role,
                "content": msg.get("content", ""),
                "timestamp": msg.get("timestamp", ""),
            })
        
        # Get customer metadata for additional context
        customer_metadata = self.conv_store.get_customer_metadata(client_id, user_id)
        
        self.logger.info(
            "context_loaded",
            user_type=user_type,
            history_length=len(formatted_history),
        )
        
        return {
            "user_type": user_type,
            "conversation_history": formatted_history,
            "customer_metadata": customer_metadata,
        }

