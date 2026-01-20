"""
Cal.com Integration Service.
Handles webhook registration and booking management via Cal.com API.
"""

import httpx
from typing import Optional
from src.config import get_settings
from src.utils import get_logger

logger = get_logger("calcom")

CALCOM_API_BASE = "https://api.cal.com/v1"


class CalcomService:
    """
    Service for interacting with Cal.com API.
    
    Handles:
    - Webhook registration for booking events
    - Fetching booking details
    - Managing event types
    """
    
    def __init__(self, api_key: str = None):
        settings = get_settings()
        self.api_key = api_key or settings.calcom_api_key
        
        if not self.api_key:
            logger.warning("calcom_api_key_not_configured")
    
    def _get_headers(self) -> dict:
        """Get API headers."""
        return {
            "Content-Type": "application/json",
        }
    
    def _get_params(self) -> dict:
        """Get API params with API key."""
        return {"apiKey": self.api_key}
    
    async def register_webhook(
        self,
        subscriber_url: str,
        triggers: list[str] = None,
        secret: str = None,
    ) -> dict:
        """
        Register a webhook to receive booking notifications.
        
        Args:
            subscriber_url: Your server's webhook URL (e.g., https://your-domain.com/webhook/booking)
            triggers: List of events to subscribe to (default: BOOKING_CREATED, BOOKING_CANCELLED)
            secret: Optional secret for verifying webhook payloads
            
        Returns:
            Dict with webhook details or error
        """
        if not self.api_key:
            return {"error": "Cal.com API key not configured"}
        
        if triggers is None:
            triggers = [
                "BOOKING_CREATED",
                "BOOKING_CANCELLED",
                "BOOKING_RESCHEDULED",
                "BOOKING_REJECTED",
                "BOOKING_REQUESTED",
            ]
        
        payload = {
            "subscriberUrl": subscriber_url,
            "eventTriggers": triggers,
            "active": True,
        }
        
        if secret:
            payload["secret"] = secret
        
        try:
            async with httpx.AsyncClient() as client:
                response = await client.post(
                    f"{CALCOM_API_BASE}/webhooks",
                    params=self._get_params(),
                    headers=self._get_headers(),
                    json=payload,
                    timeout=30.0,
                )
                
                if response.status_code in [200, 201]:
                    result = response.json()
                    logger.info(
                        "calcom_webhook_registered",
                        subscriber_url=subscriber_url,
                        triggers=triggers,
                        webhook_id=result.get("webhook", {}).get("id"),
                    )
                    return result
                else:
                    error_text = response.text
                    logger.error(
                        "calcom_webhook_registration_failed",
                        status=response.status_code,
                        error=error_text,
                    )
                    return {"error": f"Cal.com API error: {error_text}", "status": response.status_code}
                    
        except Exception as e:
            logger.error("calcom_webhook_error", error=str(e))
            return {"error": str(e)}
    
    async def list_webhooks(self) -> dict:
        """List all registered webhooks."""
        if not self.api_key:
            return {"error": "Cal.com API key not configured"}
        
        try:
            async with httpx.AsyncClient() as client:
                response = await client.get(
                    f"{CALCOM_API_BASE}/webhooks",
                    params=self._get_params(),
                    headers=self._get_headers(),
                    timeout=30.0,
                )
                
                if response.status_code == 200:
                    return response.json()
                else:
                    return {"error": response.text, "status": response.status_code}
                    
        except Exception as e:
            logger.error("calcom_list_webhooks_error", error=str(e))
            return {"error": str(e)}
    
    async def delete_webhook(self, webhook_id: int) -> dict:
        """Delete a webhook by ID."""
        if not self.api_key:
            return {"error": "Cal.com API key not configured"}
        
        try:
            async with httpx.AsyncClient() as client:
                response = await client.delete(
                    f"{CALCOM_API_BASE}/webhooks/{webhook_id}",
                    params=self._get_params(),
                    headers=self._get_headers(),
                    timeout=30.0,
                )
                
                if response.status_code in [200, 204]:
                    logger.info("calcom_webhook_deleted", webhook_id=webhook_id)
                    return {"success": True, "webhook_id": webhook_id}
                else:
                    return {"error": response.text, "status": response.status_code}
                    
        except Exception as e:
            logger.error("calcom_delete_webhook_error", error=str(e))
            return {"error": str(e)}
    
    async def get_event_types(self) -> dict:
        """Get all event types (booking types) for the account."""
        if not self.api_key:
            return {"error": "Cal.com API key not configured"}
        
        try:
            async with httpx.AsyncClient() as client:
                response = await client.get(
                    f"{CALCOM_API_BASE}/event-types",
                    params=self._get_params(),
                    headers=self._get_headers(),
                    timeout=30.0,
                )
                
                if response.status_code == 200:
                    return response.json()
                else:
                    return {"error": response.text, "status": response.status_code}
                    
        except Exception as e:
            logger.error("calcom_get_event_types_error", error=str(e))
            return {"error": str(e)}
    
    async def get_bookings(self, status: str = None) -> dict:
        """
        Get bookings from Cal.com.
        
        Args:
            status: Filter by status (ACCEPTED, PENDING, CANCELLED, REJECTED)
        """
        if not self.api_key:
            return {"error": "Cal.com API key not configured"}
        
        try:
            params = self._get_params()
            if status:
                params["status"] = status
            
            async with httpx.AsyncClient() as client:
                response = await client.get(
                    f"{CALCOM_API_BASE}/bookings",
                    params=params,
                    headers=self._get_headers(),
                    timeout=30.0,
                )
                
                if response.status_code == 200:
                    return response.json()
                else:
                    return {"error": response.text, "status": response.status_code}
                    
        except Exception as e:
            logger.error("calcom_get_bookings_error", error=str(e))
            return {"error": str(e)}


# Singleton instance
_calcom_service: Optional[CalcomService] = None


def get_calcom_service() -> CalcomService:
    """Get the Cal.com service singleton."""
    global _calcom_service
    if _calcom_service is None:
        _calcom_service = CalcomService()
    return _calcom_service
