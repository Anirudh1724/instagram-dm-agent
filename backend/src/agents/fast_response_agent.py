"""
Fast Response Agent - Combined intent detection and response generation.
Optimized for speed: single LLM call with client-provided configuration.
"""

from typing import Any
from src.agents.base_agent import BaseAgent
from src.core.state import ConversationState
from src.config.client_config import get_current_config


FAST_RESPONSE_PROMPT = """You are an AI assistant for a business on Instagram DM.

{client_context}

## User Information
- Customer Name: {customer_name}
- Instagram Username: @{username}
- User Type: {user_type} (new = first message ever, returning = has messaged before, inactive = hasn't messaged in 7+ days)
- Last Conversation Summary: {last_summary}
- Greeting Already Sent: {greeting_sent}

## CONVERSATION HISTORY (CRITICAL - READ CAREFULLY)
The following is the recent conversation with this user. You MUST read this and respond contextually:
{history}

## Current Message (User's latest message)
{message}

## CRITICAL RESPONSE RULES
1. **READ THE CONVERSATION HISTORY** - Your response must be contextual and NOT repeat what was already said
2. **NEVER repeat greetings** - If a greeting was already sent, DO NOT greet again
3. **NEVER repeat information** - If you already listed services or pricing, don't list them again unless user asks
4. **Answer the ACTUAL question** - Don't deflect or redirect unless genuinely needed
5. **Be specific** - Give direct answers when possible
6. **Move the conversation forward** - Don't ask clarifying questions if the answer is clear from context
7. Follow the Agent Instructions for exact pricing, links, and behavior
8. Keep messages SHORT (2-4 sentences max)

## Response Format (JSON only)
If Agent Instructions specify {{"reply":"..."}} format, use that.
Otherwise use:
{{
    "intent": "<greeting|question|booking|complaint|pricing|other>",
    "response": "<the actual message to send>",
    "should_offer_booking": <true if user seems ready to book>,
    "lead_type": "<hot|warm|cold>"
}}
"""

# Default context when no client config is loaded
DEFAULT_CONTEXT = """
## Business Information
- Name: Business Assistant
- Industry: General

## Agent Instructions
- Greet users warmly with "Hello! 👋"
- Be friendly and professional
- Respond helpfully to customer inquiries
- Keep responses concise and conversational

## Services
No specific services configured.
"""


class FastResponseAgent(BaseAgent):
    """
    Combined agent for fast responses with client-specific personality.
    
    - Intent detection
    - Response generation using client's configuration
    - All behavior comes from frontend-provided config (dm_prompt, story_prompt, etc.)
    
    Single LLM call for speed.
    """
    
    # Memory limit - use last N messages
    MEMORY_LIMIT = 10
    
    def __init__(self):
        super().__init__("fast_response")
    
    def process(self, state: ConversationState) -> dict[str, Any]:
        user_type = state.get("user_type", "new")
        message_source = state.get("message_source", "dm")  # dm, story, or ad
        
        # Get client configuration (loaded based on Instagram account)
        config = get_current_config()
        
        # Get conversation state from memory
        from src.core.memory import get_memory
        memory = get_memory()
        user_id = state.get("user_id", "")
        
        # Track greeting state (generic - not tied to any specific greeting)
        greeting_sent = memory.get_metadata(user_id).get("greeting_sent", False)
        
        if config:
            # Use source-specific prompt (dm_prompt, story_prompt, or ad_prompt)
            client_context = config.get_full_context(source=message_source)
            self.logger.info("using_client_config", client=config.business_name, source=message_source)
        else:
            client_context = DEFAULT_CONTEXT
            self.logger.warning("no_client_config", message="Using default context")
        
        # Get last summary from state for returning users
        last_summary = state.get("conversation_summary", "No previous conversation")
        
        # Get customer identity for personalization
        username = state.get("username", "")
        customer_name = state.get("customer_name", "")
        
        prompt = FAST_RESPONSE_PROMPT.format(
            client_context=client_context,
            customer_name=customer_name or "Unknown",
            username=username or "unknown",
            user_type=user_type,
            history=self._format_history(state, limit=self.MEMORY_LIMIT),
            last_summary=last_summary,
            message=state["current_message"],
            greeting_sent=greeting_sent,
        )
        
        result = self._handle_response(prompt, user_id, memory)
        
        intent = result.get("intent", "other")
        response = result.get("response", "Hello! How can I help you today?")
        should_book = result.get("should_offer_booking", False)
        lead_type = result.get("lead_type", "warm")
        
        self.logger.info(
            "fast_response_generated",
            intent=intent,
            user_type=user_type,
            client=config.business_name if config else "default",
            length=len(response),
            lead_type=lead_type,
        )
        
        return {
            "intent": intent,
            "response_text": response,
            "should_book": should_book,
            "emotion": "neutral",
            "planned_action": "respond",
            "is_safe": True,
            "should_respond": True,
            "lead_score": self._get_lead_score(lead_type, user_type),
            "lead_status": lead_type,
        }
    
    def _handle_response(self, prompt: str, user_id: str, memory) -> dict:
        """Handle JSON response. Supports both 'reply' and 'response' keys."""
        result = self.llm.invoke_json(prompt)
        
        # Support both 'reply' and 'response' keys
        if "reply" in result and "response" not in result:
            result["response"] = result["reply"]
        
        # Mark greeting as sent if this is likely a greeting response
        response_text = result.get("response", "")
        if result.get("intent") == "greeting" or (user_id and not memory.get_metadata(user_id).get("greeting_sent")):
            # First response to a new user is typically a greeting
            if response_text:
                memory.set_metadata(user_id, "greeting_sent", True)
        
        return result
    
    def _get_lead_score(self, lead_type: str, user_type: str) -> int:
        """Convert lead type to numeric score."""
        base_scores = {"hot": 80, "warm": 50, "cold": 20}
        score = base_scores.get(lead_type, 50)
        
        # Slight boost for returning users
        if user_type == "returning":
            score = min(100, score + 10)
        
        return score
    
    def _format_history(self, state: ConversationState, limit: int = 10) -> str:
        """Format conversation history with limit."""
        history = state.get("conversation_history", [])
        
        if not history:
            return "No prior messages"
        
        # Apply limit
        recent_history = history[-limit:]
        
        lines = []
        for msg in recent_history:
            role = "User" if msg.get("role") == "user" else "Assistant"
            lines.append(f"{role}: {msg.get('content', '')}")
        
        return "\n".join(lines)
