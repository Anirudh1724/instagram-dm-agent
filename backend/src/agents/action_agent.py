"""
Action Agent - Executes the planner's decisions.
"""

import asyncio
from typing import Any
from src.agents.base_agent import BaseAgent
from src.core.state import ConversationState
from src.core.memory import get_memory
from src.services import InstagramClient


class ActionAgent(BaseAgent):
    """
    Executes the planner's decision.
    
    Possible actions:
    - Send DM reply
    - Store lead data
    
    Note: Booking links are included in LLM responses via client config prompts.
    This agent performs the real-world actions.
    """
    
    def __init__(self):
        super().__init__("action")
        self.memory = get_memory()
    
    def _get_instagram_client(self, client_id: str = None) -> InstagramClient:
        """
        Get Instagram client with client-specific access token.
        
        Args:
            client_id: The client's ID for multi-tenant support
            
        Returns:
            InstagramClient configured with the appropriate access token
        """
        access_token = None
        
        if client_id:
            try:
                from src.config.redis_config import get_redis_store
                store = get_redis_store()
                
                # Use smart lookup that searches by various ID fields
                client_config = store.find_client_by_instagram_id(client_id)
                
                if client_config:
                    access_token = client_config.get("meta_access_token")
                    self.logger.debug("using_client_token", client_id=client_id)
            except Exception as e:
                self.logger.warning("client_token_lookup_failed", error=str(e))
        
        return InstagramClient(access_token=access_token)
    
    def process(self, state: ConversationState) -> dict[str, Any]:
        actions_taken = []
        planned_action = state.get("planned_action", "respond")
        user_id = state["user_id"]
        client_id = state.get("client_id")  # Get client_id from state
        
        # Check if we should respond at all
        if not state.get("should_respond", True):
            self.logger.info("action_skipped", reason="should_respond=False")
            return {"actions_taken": ["paused"]}
        
        # Check safety
        if not state.get("is_safe", True):
            self.logger.warning("action_modified", reason="safety_flags")
            # Still send but log the concern
        
        # Note: Response is stored by the webhook handler after this agent runs
        # We don't need to store it here to avoid duplicate storage
        response_text = state.get("response_text", "")
        
        # INJECT CUSTOMER REF INTO BOOKING LINKS
        # This allows us to link Cal.com bookings back to Instagram conversations
        if response_text:
            response_text = self._inject_booking_ref(response_text, user_id)
        
        # ACTUALLY SEND THE DM TO INSTAGRAM
        if response_text:
            try:
                # Get client-specific Instagram client
                instagram = self._get_instagram_client(client_id)
                
                # Run the async send_message in sync context
                loop = asyncio.get_event_loop()
                if loop.is_running():
                    # We're already in an async context, create a task
                    asyncio.create_task(self._send_dm(instagram, user_id, response_text))
                else:
                    loop.run_until_complete(self._send_dm(instagram, user_id, response_text))
                
                self.logger.info(
                    "dm_sent",
                    user_id=user_id,
                    response=response_text[:50] + "..." if len(response_text) > 50 else response_text,
                )
                actions_taken.append("dm_sent")
            except Exception as e:
                self.logger.error("dm_send_failed", error=str(e), user_id=user_id)
                actions_taken.append(f"dm_failed:{str(e)}")
        
        # Update lead data in memory
        self.memory.set_metadata(user_id, "last_action", planned_action)
        self.memory.set_metadata(user_id, "last_intent", state.get("intent"))
        actions_taken.append("updated_lead_data")
        
        self.logger.info("actions_completed", actions=actions_taken)
        
        return {
            "actions_taken": actions_taken,
        }
    
    def _inject_booking_ref(self, text: str, customer_id: str) -> str:
        """
        Inject customer ref parameter into booking URLs.
        
        This converts:
          https://mojo.page/appointment → https://mojo.page/appointment?ref=877935...
          https://cal.com/user/30min → https://cal.com/user/30min?ref=877935...
        
        So when customer books, Cal.com/Mojo sends the ref back and we can
        link the booking to this Instagram conversation.
        """
        import re
        
        # Common booking URL patterns
        booking_patterns = [
            r'(https?://[^\s]*mojo\.page/[^\s\?\)]+)',
            r'(https?://[^\s]*cal\.com/[^\s\?\)]+)',
            r'(https?://[^\s]*calendly\.com/[^\s\?\)]+)',
        ]
        
        for pattern in booking_patterns:
            def add_ref(match):
                url = match.group(1)
                # Check if URL already has parameters
                separator = '&' if '?' in url else '?'
                return f"{url}{separator}ref={customer_id}"
            
            text = re.sub(pattern, add_ref, text)
        
        return text
    
    async def _send_dm(self, instagram: InstagramClient, user_id: str, message: str) -> None:
        """Send DM to Instagram user with error handling."""
        try:
            result = await instagram.send_message(user_id, message)
            if "error" in result:
                self.logger.error(
                    "dm_send_api_error",
                    user_id=user_id,
                    error=result.get("error"),
                )
        except Exception as e:
            self.logger.error(
                "dm_send_exception",
                user_id=user_id,
                error=str(e),
            )

