"""
Conversation state definition for LangGraph.
This TypedDict defines the shared state passed between all agents.
"""

from typing import TypedDict, Literal, Optional
from datetime import datetime


class Message(TypedDict):
    """A single message in the conversation."""
    role: Literal["user", "assistant"]
    content: str
    timestamp: str


class ConversationState(TypedDict, total=False):
    """
    Shared state for the agent workflow.
    All agents read from and write to this state.
    """
    # Core identifiers
    user_id: str
    client_id: str  # The client/business Instagram account ID
    conversation_id: str
    
    # Current message
    current_message: str
    
    # Context Agent outputs
    user_type: Literal["new", "returning", "inactive"]
    conversation_history: list[Message]
    
    # Intent Agent outputs
    intent: str
    intent_confidence: float
    
    # Emotion Agent outputs
    emotion: str
    urgency_level: Literal["low", "medium", "high"]
    
    # Planner Agent outputs
    planned_action: str
    should_book: bool
    should_respond: bool
    should_end: bool
    
    # Lead Qualification outputs
    lead_score: int  # 0-100
    lead_status: Literal["cold", "warm", "hot", "qualified"]
    qualification_reason: str
    
    # Policy Agent outputs
    is_safe: bool
    policy_flags: list[str]
    
    # Response Agent outputs
    response_text: str
    response_tone: str
    
    # Action Agent outputs
    actions_taken: list[str]
    
    # Booking Agent outputs
    booking_link: Optional[str]
    meeting_scheduled: bool
    meeting_time: Optional[str]
    
    # Summarization Agent outputs
    conversation_summary: str
    talking_points: list[str]
    
    # Reminder Agent outputs
    reminder_scheduled: bool
    reminder_times: list[str]
    
    # Reflection Agent outputs
    feedback_score: Optional[float]
    learning_notes: Optional[str]
    
    # Metadata
    timestamp: str
    error: Optional[str]


def create_initial_state(user_id: str, message: str) -> ConversationState:
    """Create a fresh state for a new conversation turn."""
    return ConversationState(
        user_id=user_id,
        conversation_id=f"{user_id}_{datetime.utcnow().strftime('%Y%m%d%H%M%S')}",
        current_message=message,
        user_type="new",
        conversation_history=[],
        intent="",
        intent_confidence=0.0,
        emotion="neutral",
        urgency_level="low",
        planned_action="",
        should_book=False,
        should_respond=True,
        should_end=False,
        lead_score=0,
        lead_status="cold",
        qualification_reason="",
        is_safe=True,
        policy_flags=[],
        response_text="",
        response_tone="friendly",
        actions_taken=[],
        booking_link=None,
        meeting_scheduled=False,
        meeting_time=None,
        conversation_summary="",
        talking_points=[],
        reminder_scheduled=False,
        reminder_times=[],
        feedback_score=None,
        learning_notes=None,
        timestamp=datetime.utcnow().isoformat(),
        error=None,
    )
