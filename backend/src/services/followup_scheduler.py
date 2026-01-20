"""
Followup Scheduler - Background task that checks for inactive conversations
and sends personalized followup messages.
"""

import asyncio
from datetime import datetime, timedelta
from typing import Optional
from src.utils import get_logger
from src.core.conversation_store import get_conversation_store
from src.config.client_config import load_client_config, set_current_config
from src.config.redis_config import get_redis_store
from src.services.instagram import InstagramClient

logger = get_logger("followup_scheduler")


class FollowupScheduler:
    """
    Background scheduler that monitors conversations and sends followups.
    
    Followup timing:
    - First followup: After 2-3 hours of inactivity
    - Second followup: After 24 hours of inactivity
    - Maximum 2 followups per conversation
    """
    
    # Timing configuration
    FIRST_FOLLOWUP_HOURS = 2  # Send first followup after 2 hours
    SECOND_FOLLOWUP_HOURS = 24  # Send second followup after 24 hours
    MAX_FOLLOWUPS = 2  # Maximum followups per user
    CHECK_INTERVAL_SECONDS = 900  # Check every 15 minutes
    
    def __init__(self):
        # Lazy import to avoid circular import
        from src.agents.followup_agent import FollowupAgent
        self.agent = FollowupAgent()
        self.conv_store = get_conversation_store()
        self._running = False
        self._task: Optional[asyncio.Task] = None

    
    async def start(self):
        """Start the background scheduler."""
        if self._running:
            logger.warning("scheduler_already_running")
            return
        
        self._running = True
        self._task = asyncio.create_task(self._run_loop())
        logger.info("followup_scheduler_started", interval=self.CHECK_INTERVAL_SECONDS)
    
    async def stop(self):
        """Stop the scheduler gracefully."""
        self._running = False
        if self._task:
            self._task.cancel()
            try:
                await self._task
            except asyncio.CancelledError:
                pass
        logger.info("followup_scheduler_stopped")
    
    async def _run_loop(self):
        """Main scheduler loop."""
        while self._running:
            try:
                await self.check_and_send_followups()
            except Exception as e:
                logger.error("followup_check_failed", error=str(e))
            
            # Wait before next check
            await asyncio.sleep(self.CHECK_INTERVAL_SECONDS)
    
    async def check_and_send_followups(self):
        """
        Check all clients and their conversations for followup eligibility.
        Send followup messages where appropriate.
        """
        try:
            # Get all clients from Redis
            redis_store = get_redis_store()
            clients = redis_store.list_clients()
            
            logger.debug("checking_followups", client_count=len(clients))
            
            for client_info in clients:
                client_id = client_info.get("client_id")
                if not client_id:
                    continue
                
                await self._check_client_conversations(client_id)
        
        except Exception as e:
            logger.error("followup_check_error", error=str(e))
    
    async def _check_client_conversations(self, client_id: str):
        """Check all conversations for a specific client."""
        try:
            # Get inactive conversations for this client
            inactive_convs = self._get_inactive_conversations(client_id)
            
            if not inactive_convs:
                return
            
            # Load client config for personalized followups
            config = load_client_config(client_id)
            if config:
                set_current_config(config)
            
            # Create Instagram client with client's access token
            client_data = get_redis_store().get_client(client_id)
            access_token = client_data.get("meta_access_token") if client_data else None
            instagram = InstagramClient(access_token=access_token)
            
            for conv in inactive_convs:
                await self._process_conversation_followup(
                    conv, client_id, config, instagram
                )
        
        except Exception as e:
            logger.error("client_followup_check_failed", client_id=client_id, error=str(e))
    
    def _get_inactive_conversations(self, client_id: str) -> list:
        """
        Get conversations that need followup for a client.
        
        Criteria:
        - Last message was from agent (user hasn't responded)
        - Inactive for at least FIRST_FOLLOWUP_HOURS
        - Followup count < MAX_FOLLOWUPS
        - Appropriate time gap since last followup
        """
        try:
            r = self.conv_store._get_redis()
            pattern = f"conversation:{client_id}:*"
            keys = r.keys(pattern)
            
            eligible = []
            now = datetime.utcnow()
            
            for key in keys:
                import json
                data = r.get(key)
                if not data:
                    continue
                
                conv = json.loads(data)
                
                # Check last interaction time
                last_interaction = conv.get("last_interaction")
                if not last_interaction:
                    continue
                
                # Parse timestamp
                try:
                    last_time = datetime.fromisoformat(last_interaction.replace("Z", "+00:00"))
                    last_time = last_time.replace(tzinfo=None)  # Make naive for comparison
                except:
                    continue
                
                hours_inactive = (now - last_time).total_seconds() / 3600
                
                # Check if user is inactive long enough
                if hours_inactive < self.FIRST_FOLLOWUP_HOURS:
                    continue
                
                # Check followup count
                followup_count = conv.get("followup_count", 0)
                if followup_count >= self.MAX_FOLLOWUPS:
                    continue
                
                # Check if last message was from agent (user hasn't responded)
                messages = conv.get("messages", [])
                if messages:
                    last_msg = messages[-1]
                    last_role = last_msg.get("role", "")
                    # Only followup if agent sent the last message
                    if last_role not in ["agent", "assistant"]:
                        continue
                
                # Check timing for second followup
                if followup_count == 1:
                    last_followup = conv.get("last_followup_at")
                    if last_followup:
                        try:
                            followup_time = datetime.fromisoformat(last_followup.replace("Z", "+00:00"))
                            followup_time = followup_time.replace(tzinfo=None)
                            hours_since_followup = (now - followup_time).total_seconds() / 3600
                            
                            # Need at least 24 hours since last followup
                            if hours_since_followup < self.SECOND_FOLLOWUP_HOURS:
                                continue
                        except:
                            pass
                
                eligible.append({
                    "customer_id": conv.get("customer_id"),
                    "messages": messages,
                    "hours_inactive": hours_inactive,
                    "followup_count": followup_count,
                    "summary": conv.get("summary", ""),
                })
            
            return eligible
        
        except Exception as e:
            logger.error("get_inactive_failed", client_id=client_id, error=str(e))
            return []
    
    async def _process_conversation_followup(
        self,
        conv: dict,
        client_id: str,
        config,
        instagram: InstagramClient,
    ):
        """Process and send followup for a single conversation."""
        customer_id = conv.get("customer_id")
        messages = conv.get("messages", [])
        hours_inactive = conv.get("hours_inactive", 0)
        followup_count = conv.get("followup_count", 0)
        
        try:
            # Generate followup message using the agent
            result = self.agent.generate_followup_for_conversation(
                customer_id=customer_id,
                history=messages,
                hours_inactive=hours_inactive,
                followup_number=followup_count + 1,
                client_config=config,
            )
            
            if not result.get("should_send", False):
                logger.info(
                    "followup_skipped",
                    client_id=client_id,
                    customer_id=customer_id,
                    reason=result.get("reasoning", "Agent decided not to send"),
                )
                return
            
            followup_message = result.get("followup_message", "")
            if not followup_message:
                logger.warning("empty_followup_message", customer_id=customer_id)
                return
            
            # Send the followup message
            send_result = await instagram.send_message(customer_id, followup_message)
            
            if "error" not in send_result:
                # Update conversation with followup tracking
                self._update_followup_tracking(client_id, customer_id, followup_message)
                
                logger.info(
                    "followup_sent",
                    client_id=client_id,
                    customer_id=customer_id,
                    followup_number=followup_count + 1,
                    stage=result.get("stage", "unknown"),
                )
            else:
                logger.error(
                    "followup_send_failed",
                    client_id=client_id,
                    customer_id=customer_id,
                    error=send_result.get("error"),
                )
        
        except Exception as e:
            logger.error(
                "followup_processing_failed",
                client_id=client_id,
                customer_id=customer_id,
                error=str(e),
            )
    
    def _update_followup_tracking(self, client_id: str, customer_id: str, message: str):
        """Update conversation with followup tracking info."""
        try:
            import json
            r = self.conv_store._get_redis()
            key = f"conversation:{client_id}:{customer_id}"
            
            data = r.get(key)
            if not data:
                return
            
            conv = json.loads(data)
            
            # Increment followup count
            conv["followup_count"] = conv.get("followup_count", 0) + 1
            conv["last_followup_at"] = datetime.utcnow().isoformat()
            
            # Add the followup message to history
            conv["messages"].append({
                "role": "agent",
                "content": message,
                "timestamp": datetime.utcnow().isoformat(),
                "is_followup": True,
            })
            conv["last_interaction"] = datetime.utcnow().isoformat()
            conv["message_count"] = len(conv["messages"])
            
            # Save back
            r.setex(key, timedelta(days=90), json.dumps(conv))
            
        except Exception as e:
            logger.error("followup_tracking_update_failed", error=str(e))


# Global scheduler instance
_scheduler: Optional[FollowupScheduler] = None


def get_followup_scheduler() -> FollowupScheduler:
    """Get the global scheduler instance."""
    global _scheduler
    if _scheduler is None:
        _scheduler = FollowupScheduler()
    return _scheduler


async def start_followup_scheduler():
    """Start the followup scheduler background task."""
    scheduler = get_followup_scheduler()
    await scheduler.start()


async def stop_followup_scheduler():
    """Stop the followup scheduler."""
    scheduler = get_followup_scheduler()
    await scheduler.stop()
