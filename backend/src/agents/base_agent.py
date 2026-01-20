"""
Base agent class that all agents inherit from.
Provides standardized interface for LangGraph integration.
"""

from abc import ABC, abstractmethod
from typing import Any
from src.core.state import ConversationState
from src.services import get_llm
from src.utils import get_logger


class BaseAgent(ABC):
    """
    Abstract base class for all agents.
    
    Each agent:
    - Receives the full ConversationState
    - Performs its specific task
    - Returns updated state fields
    """
    
    def __init__(self, name: str):
        self.name = name
        self.logger = get_logger(f"agent.{name}")
        self.llm = get_llm()
    
    def __call__(self, state: ConversationState) -> dict[str, Any]:
        """
        LangGraph node interface.
        
        Args:
            state: Current conversation state
            
        Returns:
            Dict with updated state fields
        """
        self.logger.info(f"{self.name}_started", user_id=state.get("user_id"))
        
        try:
            result = self.process(state)
            self.logger.info(f"{self.name}_completed")
            return result
        except Exception as e:
            self.logger.error(f"{self.name}_failed", error=str(e))
            return {"error": f"{self.name} failed: {str(e)}"}
    
    @abstractmethod
    def process(self, state: ConversationState) -> dict[str, Any]:
        """
        Process the state and return updates.
        
        Args:
            state: Current conversation state
            
        Returns:
            Dict with state fields to update
        """
        pass
    
    def _format_history(self, state: ConversationState) -> str:
        """Format conversation history for LLM context."""
        history = state.get("conversation_history", [])
        if not history:
            return "No previous conversation."
        
        formatted = []
        for msg in history[-10:]:  # Last 10 messages
            role = "User" if msg["role"] == "user" else "Assistant"
            formatted.append(f"{role}: {msg['content']}")
        
        return "\n".join(formatted)
