"""
Admin API for managing client configurations.
Protected by API key authentication.
"""

from fastapi import APIRouter, HTTPException, Header, Depends
from pydantic import BaseModel
from typing import Optional
import httpx
from src.config import get_settings
from src.config.redis_config import get_redis_store
from src.utils import get_logger

logger = get_logger("admin")

router = APIRouter(prefix="/admin", tags=["admin"])


async def fetch_instagram_account_id(access_token: str) -> Optional[str]:
    """
    Fetch the Instagram Graph API Account ID (IGSID) from an access token.
    
    This calls the /me endpoint to get the actual Instagram account ID
    that Meta uses in webhook payloads.
    
    Args:
        access_token: A valid Instagram/Meta access token
        
    Returns:
        The Instagram-Scoped ID (IGSID) or None if failed
    """
    if not access_token:
        return None
    
    try:
        async with httpx.AsyncClient(timeout=10.0) as client:
            response = await client.get(
                "https://graph.instagram.com/v21.0/me",
                params={"fields": "id,username", "access_token": access_token.strip()}
            )
            
            if response.status_code == 200:
                data = response.json()
                instagram_id = data.get("id")
                username = data.get("username", "")
                logger.info("instagram_id_fetched", instagram_id=instagram_id, username=username)
                return instagram_id
            else:
                logger.warning("instagram_id_fetch_failed", status=response.status_code, response=response.text)
                return None
    except Exception as e:
        logger.error("instagram_id_fetch_error", error=str(e))
        return None


# --- Auth ---

def verify_admin_key(x_admin_key: str = Header(None)) -> bool:
    """Verify the admin API key from header."""
    settings = get_settings()
    
    # If no key configured, allow access (development mode)
    if not settings.admin_api_key:
        logger.warning("admin_no_key_configured")
        return True
    
    if x_admin_key != settings.admin_api_key:
        raise HTTPException(status_code=401, detail="Invalid admin key")
    
    return True


# --- Models ---

class ServiceModel(BaseModel):
    name: str
    price: str = ""
    duration: str = ""
    description: str = ""


class BookingSlotModel(BaseModel):
    duration: str
    price: str
    link: str


class ClientCreateRequest(BaseModel):
    """Request model for creating/updating a client."""
    client_id: str
    
    # Meta/Instagram credentials (full set)
    meta_verify_token: str = ""
    meta_app_secret: str = ""
    meta_access_token: str = ""
    instagram_account_id: str = ""
    
    # Login credentials for client dashboard
    login_email: str = ""
    login_password: str = ""
    
    # Agent configuration
    agent_type: str
    mobile_number: str = ""
    instagram_handle: str = ""
    
    # Business info
    business_name: str = ""
    industry: str = "general"
    tagline: str = ""
    
    # Greeting
    greeting_style: str = "Hello! 👋"
    first_message: str = "Hello! How can I help you today?"
    
    # Personality
    tone: str = "friendly, professional"
    language: str = "English"
    emoji_style: str = "use sparingly"
    
    # Services
    services: list[ServiceModel] = []
    
    # Booking
    booking_slots: list[BookingSlotModel] = []
    availability: str = ""
    
    # Custom prompts
    response_style: str = ""
    special_instructions: str = ""
    
    # Source-specific prompts
    dm_prompt: str = ""
    story_prompt: str = ""
    ad_prompt: str = ""
    
    # Follow-up and recovery prompt
    followup_prompt: str = ""
    
    # Lead qualification prompt (used to classify leads as qualified/unqualified/freebie)
    qualification_prompt: str = ""
    
    # Notification settings (for booking alerts)
    notification_email: str = ""
    notification_whatsapp: str = ""
    
    # Cal.com integration (per-client)
    calcom_api_key: str = ""


class ClientResponse(BaseModel):
    """Response model for client data."""
    client_id: str
    business_name: str = ""
    industry: str = ""
    tagline: str = ""
    greeting_style: str = ""
    first_message: str = ""
    tone: str = ""
    language: str = ""
    emoji_style: str = ""
    services: list[dict] = []
    booking_slots: list[dict] = []
    availability: str = ""
    response_style: str = ""
    special_instructions: str = ""
    # Note: meta_access_token is NOT returned for security


class TestChatRequest(BaseModel):
    """Request model for testing client chat."""
    message: str


# --- Endpoints ---

@router.get("/clients")
async def list_clients(_: bool = Depends(verify_admin_key)):
    """List all clients stored in Redis."""
    store = get_redis_store()
    
    try:
        clients = store.list_clients()
        with open("debug_agent_type.log", "a") as f:
             f.write(f"LIST: {json.dumps(clients, default=str)}\n")
        logger.info("list_clients_raw", count=len(clients), sample=clients[0] if clients else None)
        
        # Return summary info only (no tokens)
        return {
            "count": len(clients),
            "clients": [
                {
                    "client_id": c.get("client_id"),
                    "business_name": c.get("business_name", ""),
                    "industry": c.get("industry", ""),
                    "login_email": c.get("login_email", ""),
                    "agent_type": c.get("agent_type", "text"),
                    "mobile_number": c.get("mobile_number", ""),
                    "instagram_handle": c.get("instagram_handle", ""),
                    "status": c.get("status", "active"),
                    "login_password": c.get("login_password", ""),
                    "has_token": bool(c.get("meta_access_token")),
                }
                for c in clients
            ]
        }
    except Exception as e:
        logger.error("list_clients_failed", error=str(e))
        raise HTTPException(status_code=500, detail=f"Redis error: {str(e)}")


async def _register_calcom_webhook_for_client(
    client_id: str,
    calcom_api_key: str,
) -> dict:
    """
    Register Cal.com webhook for a client using their API key.
    
    This allows each client to have their own Cal.com account
    while all bookings flow to our single webhook endpoint.
    """
    from src.services.calcom import CalcomService
    
    settings = get_settings()
    
    # Get the webhook URL from settings or construct it
    # In production, this should be your deployed domain
    base_url = settings.webhook_base_url if hasattr(settings, 'webhook_base_url') else ""
    
    if not base_url:
        # Try to construct from any available config
        logger.warning("webhook_base_url_not_set", 
            message="Set WEBHOOK_BASE_URL in .env for auto-registration")
        return {
            "status": "skipped",
            "reason": "WEBHOOK_BASE_URL not configured in .env",
            "instructions": "Client should manually add webhook URL in Cal.com settings"
        }
    
    webhook_url = f"{base_url.rstrip('/')}/webhook/booking"
    
    # Create CalcomService with client's API key
    calcom = CalcomService(api_key=calcom_api_key)
    
    result = await calcom.register_webhook(
        subscriber_url=webhook_url,
        triggers=["BOOKING_CREATED", "BOOKING_CANCELLED", "BOOKING_RESCHEDULED"],
    )
    
    if "error" in result:
        logger.warning(
            "calcom_webhook_auto_registration_failed",
            client_id=client_id,
            error=result.get("error"),
        )
        return {
            "status": "failed",
            "error": result.get("error"),
            "instructions": "Client should manually add webhook URL in Cal.com settings",
        }
    
    logger.info(
        "calcom_webhook_auto_registered",
        client_id=client_id,
        webhook_url=webhook_url,
    )
    
    return {
        "status": "registered",
        "webhook_url": webhook_url,
        "triggers": ["BOOKING_CREATED", "BOOKING_CANCELLED", "BOOKING_RESCHEDULED"],
    }

@router.post("/clients")
async def create_client(
    request: ClientCreateRequest,
    _: bool = Depends(verify_admin_key),
):
    """Create a new client configuration."""
    logger.info("create_client_request", agent_type=request.agent_type, client_id=request.client_id)
    store = get_redis_store()
    
    # Check if already exists
    if store.client_exists(request.client_id):
        raise HTTPException(status_code=409, detail="Client already exists")
    
    # Convert to dict for storage
    config = request.model_dump()
    with open("debug_agent_type.log", "a") as f:
        f.write(f"CREATE: {json.dumps(config)}\n")
    logger.info("create_client_config_dump", config=config)
    
    # NOTE: We don't auto-fetch the Instagram Graph API ID here because
    # the /me endpoint often returns a different ID than what webhooks send.
    # Instead, the webhook handler uses a fallback mechanism:
    # 1. Finds the first client with a valid access token
    # 2. Caches the mapping from webhook recipient_id to client_id
    # This is more reliable for production use.
    
    # Save to Redis
    if store.save_client(request.client_id, config):
        logger.info("client_created", client_id=request.client_id)
        
        # Auto-register Cal.com webhook if API key provided
        webhook_result = None
        if config.get("calcom_api_key"):
            webhook_result = await _register_calcom_webhook_for_client(
                client_id=request.client_id,
                calcom_api_key=config["calcom_api_key"],
            )
        
        return {
            "status": "created",
            "client_id": request.client_id,
            "message": "Graph API ID will be auto-detected on first webhook",
            "calcom_webhook": webhook_result,
        }
    
    raise HTTPException(status_code=500, detail="Failed to save client")



@router.get("/clients/{client_id}")
async def get_client(client_id: str, _: bool = Depends(verify_admin_key)):
    """Get a client configuration by ID."""
    store = get_redis_store()
    
    config = store.get_client(client_id)
    if not config:
        raise HTTPException(status_code=404, detail="Client not found")
    
    # Remove sensitive data
    config.pop("meta_access_token", None)
    
    return config


@router.put("/clients/{client_id}")
async def update_client(
    client_id: str,
    request: ClientCreateRequest,
    _: bool = Depends(verify_admin_key),
):
    """Update an existing client configuration."""
    logger.info("update_client_request", agent_type=request.agent_type, client_id=client_id)
    store = get_redis_store()
    
    # Check if exists
    if not store.client_exists(client_id):
        raise HTTPException(status_code=404, detail="Client not found")
    
    # Get existing config to preserve token if not provided
    existing = store.get_client(client_id) or {}
    
    # Convert to dict for storage
    config = request.model_dump()
    
    # If no new token provided, keep existing
    if not config.get("meta_access_token") and existing.get("meta_access_token"):
        config["meta_access_token"] = existing["meta_access_token"]
    
    # If no new password provided, keep existing
    if not config.get("login_password") and existing.get("login_password"):
        config["login_password"] = existing["login_password"]
    
    # Preserve any cached instagram_graph_id from webhook auto-detection
    if existing.get("instagram_graph_id"):
        config["instagram_graph_id"] = existing["instagram_graph_id"]
    
    # Save to Redis
    if store.save_client(client_id, config):
        logger.info("client_updated", client_id=client_id)
        return {"status": "updated", "client_id": client_id}
    
    raise HTTPException(status_code=500, detail="Failed to update client")



@router.delete("/clients/{client_id}")
async def delete_client(client_id: str, _: bool = Depends(verify_admin_key)):
    """Delete a client configuration."""
    store = get_redis_store()
    
    if not store.client_exists(client_id):
        raise HTTPException(status_code=404, detail="Client not found")
    
    if store.delete_client(client_id):
        logger.info("client_deleted", client_id=client_id)
        return {"status": "deleted", "client_id": client_id}
    
    raise HTTPException(status_code=500, detail="Failed to delete client")


@router.post("/clients/{client_id}/test")
async def test_client_chat(
    client_id: str,
    request: TestChatRequest,
    _: bool = Depends(verify_admin_key),
):
    """Test a client's chat response."""
    store = get_redis_store()
    
    config = store.get_client(client_id)
    if not config:
        raise HTTPException(status_code=404, detail="Client not found")
    
    # Import here to avoid circular imports
    from src.config.client_config import set_current_config, _parse_config_from_dict
    from src.core import process_message
    
    # Parse config and set as current
    parsed_config = _parse_config_from_dict(config)
    set_current_config(parsed_config)
    
    # Process the test message
    try:
        result = await process_message(
            user_id=f"test_{client_id}",
            message=request.message,
        )
        
        return {
            "client_id": client_id,
            "input": request.message,
            "response": result.get("response_text", ""),
        }
    except Exception as e:
        logger.error("test_chat_failed", client_id=client_id, error=str(e))
        raise HTTPException(status_code=500, detail=f"Chat error: {str(e)}")


@router.post("/import-yaml/{client_name}")
async def import_yaml_client(
    client_name: str,
    _: bool = Depends(verify_admin_key),
):
    """Import a client from YAML file into Redis."""
    from src.config.client_config import load_config_by_name
    
    config = load_config_by_name(client_name)
    if not config:
        raise HTTPException(status_code=404, detail=f"YAML config '{client_name}' not found")
    
    store = get_redis_store()
    
    # Convert ClientConfig to dict
    config_dict = {
        "client_id": config.client_id,
        "business_name": config.business_name,
        "industry": config.industry,
        "tagline": config.tagline,
        "greeting_style": config.greeting_style,
        "first_message": config.first_message,
        "tone": config.tone,
        "language": config.language,
        "emoji_style": config.emoji_style,
        "services": [
            {"name": s.name, "price": s.price, "duration": s.duration, "description": s.description}
            for s in config.services
        ],
        "booking_link": config.booking_link,
        "availability": config.availability,
        "response_style": config.response_style,
        "special_instructions": config.special_instructions,
    }
    
    if store.save_client(config.client_id, config_dict):
        return {"status": "imported", "client_id": config.client_id, "from": client_name}
    
    raise HTTPException(status_code=500, detail="Failed to import client")


# ============================================
# CAL.COM WEBHOOK MANAGEMENT
# ============================================

class WebhookSetupRequest(BaseModel):
    """Request to set up Cal.com webhook."""
    webhook_url: str  # Your public URL for receiving webhooks


@router.post("/calcom/setup-webhook")
async def setup_calcom_webhook(
    request: WebhookSetupRequest,
    _: bool = Depends(verify_admin_key),
):
    """
    Register a webhook with Cal.com to receive booking notifications.
    
    When a customer books on Cal.com, you'll receive:
    - Customer name, email, phone
    - Booking time and duration
    - Event type (which service they booked)
    - Custom fields (like customer ref for linking to DM)
    
    Example webhook_url: https://your-ngrok-url.ngrok.io/webhook/booking
    """
    from src.services.calcom import get_calcom_service
    
    calcom = get_calcom_service()
    
    result = await calcom.register_webhook(
        subscriber_url=request.webhook_url,
        triggers=[
            "BOOKING_CREATED",
            "BOOKING_CANCELLED", 
            "BOOKING_RESCHEDULED",
        ],
    )
    
    if "error" in result:
        logger.error("calcom_webhook_setup_failed", error=result["error"])
        raise HTTPException(status_code=400, detail=result["error"])
    
    logger.info("calcom_webhook_setup_success", webhook_url=request.webhook_url)
    
    return {
        "status": "success",
        "message": "Cal.com webhook registered successfully",
        "webhook_url": request.webhook_url,
        "triggers": ["BOOKING_CREATED", "BOOKING_CANCELLED", "BOOKING_RESCHEDULED"],
        "details": result,
    }


@router.get("/calcom/webhooks")
async def list_calcom_webhooks(_: bool = Depends(verify_admin_key)):
    """List all registered Cal.com webhooks."""
    from src.services.calcom import get_calcom_service
    
    calcom = get_calcom_service()
    result = await calcom.list_webhooks()
    
    if "error" in result:
        raise HTTPException(status_code=400, detail=result["error"])
    
    return result


@router.delete("/calcom/webhooks/{webhook_id}")
async def delete_calcom_webhook(
    webhook_id: int,
    _: bool = Depends(verify_admin_key),
):
    """Delete a Cal.com webhook by ID."""
    from src.services.calcom import get_calcom_service
    
    calcom = get_calcom_service()
    result = await calcom.delete_webhook(webhook_id)
    
    if "error" in result:
        raise HTTPException(status_code=400, detail=result["error"])
    
    return result


@router.get("/calcom/bookings")
async def get_calcom_bookings(
    status: str = None,
    _: bool = Depends(verify_admin_key),
):
    """
    Get bookings from Cal.com.
    
    Args:
        status: Filter by ACCEPTED, PENDING, CANCELLED, REJECTED
    """
    from src.services.calcom import get_calcom_service
    
    calcom = get_calcom_service()
    result = await calcom.get_bookings(status=status)
    
    if "error" in result:
        raise HTTPException(status_code=400, detail=result["error"])
    
    return result


@router.get("/calcom/event-types")
async def get_calcom_event_types(_: bool = Depends(verify_admin_key)):
    """Get all event types (booking types) from Cal.com."""
    from src.services.calcom import get_calcom_service
    
    calcom = get_calcom_service()
    result = await calcom.get_event_types()
    
    if "error" in result:
        raise HTTPException(status_code=400, detail=result["error"])
    
    return result
