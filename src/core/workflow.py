"""
LangGraph Workflow - Fast response workflow for quick DM replies.
Uses only 4 agents: Context → FastResponse → Action (+ Reflection in background).
"""

import asyncio
from typing import TYPE_CHECKING
from langgraph.graph import StateGraph, END
from src.utils import get_logger

logger = get_logger("workflow")

# Lazy import to avoid circular imports
if TYPE_CHECKING:
    from src.core.state import ConversationState


def _get_agents():
    """Lazy load agents to avoid circular imports."""
    from src.agents import (
        ContextAgent,
        ActionAgent,
        ReflectionAgent,
        FastResponseAgent,
    )
    return {
        "context": ContextAgent(),
        "fast_response": FastResponseAgent(),
        "action": ActionAgent(),
        "reflection": ReflectionAgent(),
    }


# Global cached agents
_agents = None


def get_agents():
    """Get the cached agents dict."""
    global _agents
    if _agents is None:
        _agents = _get_agents()
    return _agents


def create_fast_workflow() -> StateGraph:
    """
    Create the fast workflow for quick responses.
    
    Flow: Context → FastResponse → Action
    
    Speed: ~5-8 seconds
    """
    from src.core.state import ConversationState
    
    agents = get_agents()
    
    workflow = StateGraph(ConversationState)
    
    # Only 3 nodes for speed
    workflow.add_node("context", agents["context"])
    workflow.add_node("fast_response", agents["fast_response"])
    workflow.add_node("action", agents["action"])
    
    # Simple linear flow
    workflow.set_entry_point("context")
    workflow.add_edge("context", "fast_response")
    workflow.add_edge("fast_response", "action")
    workflow.add_edge("action", END)
    
    logger.info("fast_workflow_created")
    
    return workflow.compile()


# Global compiled workflow
_fast_workflow = None


def get_fast_workflow():
    """Get the compiled fast workflow instance."""
    global _fast_workflow
    if _fast_workflow is None:
        _fast_workflow = create_fast_workflow()
    return _fast_workflow


# Alias for backwards compatibility
get_workflow = get_fast_workflow
create_workflow = create_fast_workflow


async def process_message(
    user_id: str, 
    message: str, 
    use_fast: bool = True,
    client_id: str = None,
    user_type: str = None,
    last_summary: str = None,
    message_source: str = "dm",
    username: str = "",
    customer_name: str = "",
) -> dict:
    """
    Process an incoming message through the agent pipeline.
    
    Args:
        user_id: Instagram user ID (customer)
        message: The message text
        use_fast: Ignored, always uses fast workflow
        client_id: The client's Instagram account ID (for multi-tenant)
        user_type: "new", "returning", or "inactive"
        last_summary: Previous conversation summary for context
        message_source: Source of message - "dm", "story", or "ad"
        username: Instagram username of the customer
        customer_name: Display name of the customer
        
    Returns:
        Final state after all agents have processed
    """
    from src.core.state import create_initial_state
    
    # Log with username if available
    display = username or customer_name or user_id
    logger.info("processing_message", customer=display, fast_mode=True, source=message_source)
    
    # Create initial state
    initial_state = create_initial_state(user_id, message)
    
    # Add conversation context
    if client_id:
        initial_state["client_id"] = client_id
    if user_type:
        initial_state["user_type"] = user_type
    if last_summary:
        initial_state["conversation_summary"] = last_summary
    
    # Add message source for prompt selection
    initial_state["message_source"] = message_source
    
    # Add customer identity for personalization
    initial_state["username"] = username
    initial_state["customer_name"] = customer_name
    
    # Use fast workflow
    workflow = get_fast_workflow()
    logger.info("using_fast_workflow")
    
    # Run the workflow
    final_state = workflow.invoke(initial_state)
    
    # Run reflection in background (non-blocking)
    try:
        agents = get_agents()
        asyncio.create_task(_run_background_reflection(agents["reflection"], final_state))
    except RuntimeError:
        # No event loop, skip background reflection
        pass
    
    logger.info(
        "message_processed",
        user_id=user_id,
        response=final_state.get("response_text", "")[:50],
        fast_mode=True,
    )
    
    return final_state


async def _run_background_reflection(reflection_agent, state: dict) -> None:
    """Run reflection agent in background for learning (non-blocking)."""
    try:
        reflection_agent(state)
        logger.debug("background_reflection_completed")
    except Exception as e:
        logger.warning("background_reflection_failed", error=str(e))

