"""Core module."""

from .state import ConversationState, Message, create_initial_state
from .memory import ConversationMemory, get_memory
from .conversation_store import ConversationStore, get_conversation_store
from .workflow import (
    create_fast_workflow,
    get_fast_workflow,
    process_message,
    # Aliases for backwards compatibility
    create_workflow,
    get_workflow,
)

__all__ = [
    "ConversationState",
    "Message",
    "create_initial_state",
    "ConversationMemory",
    "get_memory",
    "ConversationStore",
    "get_conversation_store",
    "create_fast_workflow",
    "get_fast_workflow",
    "create_workflow",
    "get_workflow",
    "process_message",
]
