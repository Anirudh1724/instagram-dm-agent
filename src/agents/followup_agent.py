"""
Followup Agent - Generates personalized followup messages for inactive users.
Analyzes conversation history and stage to create appropriate followups.
"""

import json
from typing import Any
from src.agents.base_agent import BaseAgent
from src.core.state import ConversationState
from src.config.client_config import get_current_config, ClientConfig


FOLLOWUP_PROMPT = """You are an AI assistant generating a followup message for a business on Instagram DM.

{client_context}

## Conversation Context
- Customer ID: {customer_id}
- Hours Inactive: {hours_inactive}
- Followup Number: {followup_number} (1 = first followup, 2 = final followup)
- Conversation Stage: {stage}
- Last 5 Messages:
{history}

## Conversation Stage Details
{stage_description}

## Instructions
Based on the conversation history and how long the user has been inactive, generate a natural, personalized followup message.

1. For FIRST followup (2-3 hours):
   - Be casual, check if they need help
   - Reference what they were discussing
   - Don't be pushy

2. For SECOND/FINAL followup (24 hours):
   - Be warm but give them an easy out
   - Mention you're available when they're ready
   - This is the last automatic message

## Response Format (JSON only)
{{
    "followup_message": "<the followup message to send>",
    "should_send": <true if followup makes sense, false if conversation seems concluded>,
    "reasoning": "<brief reasoning for the message>"
}}
"""


# Stage descriptions for the LLM
STAGE_DESCRIPTIONS = {
    "greeting": "User just said hello or introduced themselves. They haven't asked about specific services yet.",
    "inquiry": "User was asking about services or what you offer. They showed initial interest.",
    "pricing": "User was discussing pricing or asking about costs. They're evaluating options.",
    "booking": "User showed interest in booking or scheduling. They're close to converting.",
    "post_booking": "User has already booked or completed a transaction. May need post-service followup.",
    "freebie_request": "User was asking for free services/predictions. May need gentle redirection.",
    "unclear": "Conversation stage is unclear from the history.",
}


class FollowupAgent(BaseAgent):
    """
    Agent that generates personalized followup messages.
    
    Analyzes:
    - Last 5 conversation messages
    - Time since last activity
    - Conversation stage (greeting, inquiry, pricing, booking, etc.)
    
    Generates contextual followup messages based on where the user stopped.
    """
    
    def __init__(self):
        super().__init__("followup")
    
    def process(self, state: ConversationState) -> dict[str, Any]:
        """
        Generate a followup message based on conversation state.
        
        Expected state keys:
        - customer_id: The user's Instagram ID
        - conversation_history: Last messages
        - hours_inactive: How long since last message
        - followup_number: Which followup this is (1 or 2)
        """
        customer_id = state.get("customer_id", "")
        history = state.get("conversation_history", [])
        hours_inactive = state.get("hours_inactive", 2)
        followup_number = state.get("followup_number", 1)
        
        # Detect conversation stage
        stage = self._detect_stage(history)
        
        # Get client configuration
        config = get_current_config()
        
        # Check if client has custom followup prompt
        custom_followup_prompt = None
        if config:
            # Try to get followup_prompt from config
            client_context = config.get_full_context()
            custom_followup_prompt = getattr(config, 'followup_prompt', None)
            
            # Also check raw data in case attribute doesn't exist
            if not custom_followup_prompt and hasattr(config, '_data'):
                custom_followup_prompt = config._data.get('followup_prompt', '')
        else:
            client_context = "No client context available. Use friendly, professional tone."
        
        # Format history (last 5 messages)
        formatted_history = self._format_history_for_followup(history[-5:])
        
        # Use client's custom followup prompt if available, otherwise use default
        if custom_followup_prompt and custom_followup_prompt.strip():
            # Client has configured their own followup prompt - use it directly
            # Build context variables for the prompt
            prompt = f"""## CONVERSATION CONTEXT
- Customer ID: {customer_id}
- Hours Inactive: {hours_inactive}
- Followup Number: {followup_number} (1 = first followup, 2 = final followup)
- Conversation Stage: {stage}

## CONVERSATION HISTORY
{formatted_history}

## CLIENT'S FOLLOWUP INSTRUCTIONS
{custom_followup_prompt}

Now analyze the conversation and generate the appropriate response following the instructions above.
"""
            self.logger.info(
                "using_custom_followup_prompt",
                customer_id=customer_id,
                prompt_length=len(custom_followup_prompt),
            )
        else:
            # Use default followup prompt
            prompt = FOLLOWUP_PROMPT.format(
                client_context=client_context,
                customer_id=customer_id,
                hours_inactive=hours_inactive,
                followup_number=followup_number,
                stage=stage,
                stage_description=STAGE_DESCRIPTIONS.get(stage, STAGE_DESCRIPTIONS["unclear"]),
                history=formatted_history,
            )
            self.logger.info(
                "using_default_followup_prompt",
                customer_id=customer_id,
            )
        
        # Get LLM response
        result = self._generate_followup(prompt)
        
        # Handle "NO_MESSAGE_NEEDED" response from custom prompts
        followup_message = result.get("followup_message", "") or result.get("reply", "")
        should_send = result.get("should_send", True)
        
        # Check for NO_MESSAGE_NEEDED response
        if followup_message == "NO_MESSAGE_NEEDED" or "NO_MESSAGE_NEEDED" in str(followup_message):
            should_send = False
            followup_message = ""
            self.logger.info(
                "followup_no_message_needed",
                customer_id=customer_id,
                reason=result.get("reason", result.get("reasoning", "Agent decided not to send")),
            )
        
        self.logger.info(
            "followup_generated",
            customer_id=customer_id,
            stage=stage,
            hours_inactive=hours_inactive,
            followup_number=followup_number,
            should_send=should_send,
        )
        
        return {
            "followup_message": followup_message,
            "should_send": should_send,
            "stage": stage,
            "reasoning": result.get("reasoning", result.get("reason", "")),
        }
    
    def _detect_stage(self, history: list) -> str:
        """
        Analyze conversation history to detect the stage where user stopped.
        
        Stages:
        - greeting: Just said hello
        - inquiry: Asked about services
        - pricing: Discussing costs
        - booking: Interest in booking
        - post_booking: Already booked/transacted
        - freebie_request: Asking for free stuff
        """
        if not history:
            return "greeting"
        
        # Get the last few messages
        recent_messages = history[-5:]
        
        # Look at the last assistant message (if any) to understand context
        last_assistant = None
        last_user = None
        
        for msg in reversed(recent_messages):
            role = msg.get("role", "")
            content = msg.get("content", "").lower()
            
            if role in ["assistant", "agent"] and not last_assistant:
                last_assistant = content
            elif role in ["user", "customer"] and not last_user:
                last_user = content
        
        # Check for booking-related keywords
        booking_keywords = ["book", "slot", "payment", "confirm", "schedule", "appointment"]
        pricing_keywords = ["₹", "price", "cost", "rate", "fee", "charge", "how much", "pricing"]
        inquiry_keywords = ["what", "how", "service", "offer", "help", "looking for", "interested"]
        freebie_keywords = ["free", "predict", "quickly", "just tell me", "small doubt"]
        
        combined_text = f"{last_assistant or ''} {last_user or ''}"
        
        # Check for payment links (post-booking or booking stage)
        if "mojo.page" in combined_text or "payment" in combined_text:
            if last_user and any(kw in last_user for kw in ["done", "paid", "completed"]):
                return "post_booking"
            return "booking"
        
        # Check for pricing discussion
        if any(kw in combined_text for kw in pricing_keywords):
            return "pricing"
        
        # Check for freebie requests
        if last_user and any(kw in last_user for kw in freebie_keywords):
            return "freebie_request"
        
        # Check for service inquiry
        if any(kw in combined_text for kw in inquiry_keywords):
            return "inquiry"
        
        # Default: greeting/initial stage
        if len(recent_messages) <= 2:
            return "greeting"
        
        return "inquiry"
    
    def _format_history_for_followup(self, history: list) -> str:
        """Format conversation history for the LLM prompt."""
        if not history:
            return "No previous messages."
        
        lines = []
        for msg in history:
            role = msg.get("role", "unknown")
            content = msg.get("content", "")
            
            # Normalize role names
            if role in ["user", "customer"]:
                role_display = "Customer"
            else:
                role_display = "Agent"
            
            lines.append(f"{role_display}: {content}")
        
        return "\n".join(lines)
    
    def _generate_followup(self, prompt: str) -> dict:
        """Generate followup message using LLM."""
        try:
            result = self.llm.invoke_json(prompt)
            return result
        except Exception as e:
            self.logger.error("followup_generation_failed", error=str(e))
            return {
                "followup_message": "",
                "should_send": False,
                "reasoning": f"Error generating followup: {str(e)}",
            }
    
    def generate_followup_for_conversation(
        self,
        customer_id: str,
        history: list,
        hours_inactive: float,
        followup_number: int,
        client_config: ClientConfig = None,
    ) -> dict:
        """
        Convenience method to generate a followup without full state object.
        
        Args:
            customer_id: Customer's Instagram ID
            history: Conversation history list
            hours_inactive: Hours since last message
            followup_number: Which followup (1 or 2)
            client_config: Optional client config to use
            
        Returns:
            Dict with followup_message, should_send, stage, reasoning
        """
        from src.config.client_config import set_current_config
        
        if client_config:
            set_current_config(client_config)
        
        state = ConversationState(
            customer_id=customer_id,
            conversation_history=history,
            hours_inactive=hours_inactive,
            followup_number=followup_number,
        )
        
        return self.process(state)
