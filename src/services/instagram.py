"""
Instagram Graph API client for sending DMs.
"""

import asyncio
import httpx
from typing import Optional
from src.config import get_settings
from src.utils import get_logger

logger = get_logger("instagram")

# Retry configuration
MAX_RETRIES = 3
INITIAL_BACKOFF = 1.0  # seconds
TIMEOUT_SECONDS = 30.0


class InstagramClient:
    """Client for Instagram Messaging API."""
    
    BASE_URL = "https://graph.instagram.com/v21.0"
    
    def __init__(self, access_token: str = None):
        """
        Initialize Instagram client.
        
        Args:
            access_token: Optional per-client access token. If not provided,
                         falls back to META_ACCESS_TOKEN from settings/.env
        """
        settings = get_settings()
        raw_token = access_token or settings.meta_access_token
        # Strip whitespace/newlines from token to prevent "Illegal header value" errors
        self._access_token = raw_token.strip() if raw_token else ""
        self._account_id = settings.instagram_account_id
        self._timeout = httpx.Timeout(TIMEOUT_SECONDS, connect=10.0)
    
    async def _request_with_retry(
        self,
        method: str,
        url: str,
        **kwargs,
    ) -> httpx.Response:
        """
        Make an HTTP request with retry logic and exponential backoff.
        
        Args:
            method: HTTP method (get, post, etc.)
            url: Request URL
            **kwargs: Additional arguments for httpx request
            
        Returns:
            httpx.Response
            
        Raises:
            httpx.HTTPError: If all retries fail
        """
        last_exception = None
        
        for attempt in range(MAX_RETRIES):
            try:
                async with httpx.AsyncClient(timeout=self._timeout) as client:
                    if method.lower() == "post":
                        response = await client.post(url, **kwargs)
                    elif method.lower() == "get":
                        response = await client.get(url, **kwargs)
                    else:
                        raise ValueError(f"Unsupported method: {method}")
                    return response
            except (httpx.ConnectTimeout, httpx.ReadTimeout, httpx.ConnectError) as e:
                last_exception = e
                backoff = INITIAL_BACKOFF * (2 ** attempt)
                logger.warning(
                    "request_retry",
                    attempt=attempt + 1,
                    max_retries=MAX_RETRIES,
                    backoff=backoff,
                    error=str(e),
                    url=url,
                )
                if attempt < MAX_RETRIES - 1:
                    await asyncio.sleep(backoff)
        
        # All retries failed
        logger.error(
            "request_failed_all_retries",
            max_retries=MAX_RETRIES,
            error=str(last_exception),
            url=url,
        )
        raise last_exception
    
    async def send_message(self, recipient_id: str, message: str) -> dict:
        """
        Send a DM to a user using Instagram Messaging API.
        
        Args:
            recipient_id: Instagram-scoped user ID (IGSID)
            message: Message text to send
            
        Returns:
            API response dict
        """
        # Instagram Messaging API endpoint
        url = f"{self.BASE_URL}/me/messages"
        
        payload = {
            "recipient": {"id": recipient_id},
            "message": {"text": message},
        }
        
        headers = {
            "Authorization": f"Bearer {self._access_token}",
            "Content-Type": "application/json",
        }
        
        try:
            response = await self._request_with_retry(
                "post", url, json=payload, headers=headers
            )
            result = response.json()
            
            if response.status_code == 200:
                logger.info(
                    "message_sent_success",
                    recipient_id=recipient_id,
                    message_id=result.get("message_id"),
                )
            else:
                logger.error(
                    "message_send_failed",
                    recipient_id=recipient_id,
                    status=response.status_code,
                    error=result,
                )
            
            return result
        except Exception as e:
            logger.error(
                "message_send_exception",
                recipient_id=recipient_id,
                error=str(e),
            )
            return {"error": str(e)}
    
    async def send_sender_action(self, recipient_id: str, action: str) -> dict:
        """
        Send a sender action (mark_seen, typing_on, typing_off).
        
        Args:
            recipient_id: Instagram-scoped user ID (IGSID)
            action: One of 'mark_seen', 'typing_on', 'typing_off'
            
        Returns:
            API response dict
        """
        url = f"{self.BASE_URL}/me/messages"
        
        payload = {
            "recipient": {"id": recipient_id},
            "sender_action": action,
        }
        
        headers = {
            "Authorization": f"Bearer {self._access_token}",
            "Content-Type": "application/json",
        }
        
        try:
            response = await self._request_with_retry(
                "post", url, json=payload, headers=headers
            )
            result = response.json()
            
            if response.status_code == 200:
                logger.debug(
                    "sender_action_sent",
                    recipient_id=recipient_id,
                    action=action,
                )
            else:
                logger.warning(
                    "sender_action_failed",
                    recipient_id=recipient_id,
                    action=action,
                    status=response.status_code,
                    error=result,
                )
            
            return result
        except Exception as e:
            logger.warning(
                "sender_action_exception",
                recipient_id=recipient_id,
                action=action,
                error=str(e),
            )
            return {"error": str(e)}
    
    async def mark_seen(self, recipient_id: str) -> dict:
        """Mark the conversation as seen (read receipt)."""
        return await self.send_sender_action(recipient_id, "mark_seen")
    
    async def typing_on(self, recipient_id: str) -> dict:
        """Show typing indicator to the user."""
        return await self.send_sender_action(recipient_id, "typing_on")
    
    async def typing_off(self, recipient_id: str) -> dict:
        """Hide typing indicator."""
        return await self.send_sender_action(recipient_id, "typing_off")
    
    async def get_user_profile(self, user_id: str) -> Optional[dict]:
        """
        Get user profile information.
        
        Args:
            user_id: Instagram user ID
            
        Returns:
            User profile dict or None
        """
        url = f"{self.BASE_URL}/{user_id}"
        params = {
            "fields": "name,username,profile_pic",
        }
        headers = {
            "Authorization": f"Bearer {self._access_token}",
        }
        
        try:
            response = await self._request_with_retry(
                "get", url, params=params, headers=headers
            )
            
            if response.status_code == 200:
                return response.json()
            
            logger.warning("profile_fetch_failed", user_id=user_id)
            return None
        except Exception as e:
            logger.warning("profile_fetch_exception", user_id=user_id, error=str(e))
            return None


# Global instance
_instagram_client: Optional[InstagramClient] = None


def get_instagram_client() -> InstagramClient:
    """Get the global Instagram client instance."""
    global _instagram_client
    if _instagram_client is None:
        _instagram_client = InstagramClient()
    return _instagram_client
