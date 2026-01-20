"""Services module."""

from .llm import LLMClient, get_llm
from .instagram import InstagramClient, get_instagram_client

# Note: FollowupScheduler is imported lazily to avoid circular imports
# Use: from src.services.followup_scheduler import ...

__all__ = [
    "LLMClient",
    "get_llm",
    "InstagramClient",
    "get_instagram_client",
]

