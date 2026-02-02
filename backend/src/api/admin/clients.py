"""
Admin client management endpoints.
CRUD operations for managing client configurations.
"""

import httpx
from fastapi import APIRouter, Depends
from pydantic import BaseModel
from typing import Optional, List

from src.config import get_settings
from src.config.redis_config import get_redis_store
from src.api.deps import verify_admin_key
from src.api.errors import APIError, ErrorCodes
from src.utils import get_logger

logger = get_logger("api.admin")

router = APIRouter(prefix="/admin", tags=["admin"])


# --- Schemas ---

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
    meta_verify_token: str = ""
    meta_app_secret: str = ""
    meta_access_token: str = ""
    instagram_account_id: str = ""
    login_email: str = ""
    login_password: str = ""
    business_name: str = ""
    agent_type: str = "text"  # Added agent_type field
    voice_direction: str = "inbound"  # inbound or outbound voice flows
    mobile_number: str = ""  # Added for Voice Agent
    status: str = "active"  # active, inactive
    industry: str = "general"
    tagline: str = ""
    greeting_style: str = "Hello! 👋"
    first_message: str = "Hello! How can I help you today?"
    tone: str = "friendly, professional"
    language: str = "English"
    emoji_style: str = "use sparingly"
    services: List[dict] = []
    booking_slots: List[dict] = []
    availability: str = ""
    response_style: str = ""
    special_instructions: str = ""
    dm_prompt: str = ""
    story_prompt: str = ""
    ad_prompt: str = ""
    followup_prompt: str = ""
    qualification_prompt: str = ""
    notification_email: str = ""
    notification_whatsapp: str = ""
    calcom_api_key: str = ""


class TestChatRequest(BaseModel):
    """Request model for testing client chat."""
    message: str


# --- Helper Functions ---

async def _fetch_instagram_account_id(access_token: str) -> Optional[str]:
    """Fetch Instagram account ID from access token."""
    try:
        async with httpx.AsyncClient() as client:
            response = await client.get(
                "https://graph.instagram.com/v21.0/me",
                params={"access_token": access_token.strip()}
            )
            
            if response.status_code == 200:
                data = response.json()
                return data.get("id")
            else:
                logger.warning("instagram_id_fetch_failed", status=response.status_code)
                return None
    except Exception as e:
        logger.error("instagram_id_fetch_error", error=str(e))
        return None


async def _register_calcom_webhook(client_id: str, calcom_api_key: str):
    """Register Cal.com webhook for a client."""
    if not calcom_api_key:
        return
    
    settings = get_settings()
    
    webhook_url = f"https://{settings.host}:{settings.port}/webhook/booking"
    if hasattr(settings, 'public_url') and settings.public_url:
        webhook_url = f"{settings.public_url}/webhook/booking"
    
    try:
        async with httpx.AsyncClient() as client:
            # Check existing webhooks
            response = await client.get(
                "https://api.cal.com/v1/webhooks",
                headers={"Authorization": f"Bearer {calcom_api_key}"}
            )
            
            if response.status_code == 200:
                webhooks = response.json().get("webhooks", [])
                for wh in webhooks:
                    if wh.get("subscriberUrl") == webhook_url:
                        logger.info("calcom_webhook_exists", client_id=client_id)
                        return
            
            # Create webhook
            await client.post(
                "https://api.cal.com/v1/webhooks",
                headers={"Authorization": f"Bearer {calcom_api_key}"},
                json={
                    "subscriberUrl": webhook_url,
                    "eventTriggers": ["BOOKING_CREATED", "BOOKING_RESCHEDULED", "BOOKING_CANCELLED"],
                    "active": True,
                }
            )
            logger.info("calcom_webhook_registered", client_id=client_id)
    except Exception as e:
        logger.error("calcom_webhook_registration_failed", client_id=client_id, error=str(e))


# --- Endpoints ---

@router.get("/clients")
async def list_clients(_: bool = Depends(verify_admin_key)):
    """List all clients stored in Redis."""
    redis_store = get_redis_store()
    clients = redis_store.list_clients()
    
    client_list = []
    for client_info in clients:
        client_id = client_info.get("client_id")
        if not client_id:
            continue
        
        full_data = redis_store.get_client(client_id)
        if full_data:
            client_list.append({
                "client_id": client_id,
                "business_name": full_data.get("business_name", ""),
                "industry": full_data.get("industry", ""),
                "has_token": bool(full_data.get("meta_access_token")),
                "status": full_data.get("status", "active"),
                "agent_type": full_data.get("agent_type", "text"),
                "voice_direction": full_data.get("voice_direction", "inbound"),
                "mobile_number": full_data.get("mobile_number", ""),
                "instagram_handle": full_data.get("instagram_handle", ""),
                "login_email": full_data.get("login_email", ""),
                "login_password": full_data.get("login_password", ""),
            })
    
    return {"count": len(client_list), "clients": client_list}


@router.post("/clients")
async def create_client(
    request: ClientCreateRequest,
    _: bool = Depends(verify_admin_key)
):
    """Create a new client configuration."""
    redis_store = get_redis_store()
    
    # Check if already exists
    existing = redis_store.get_client(request.client_id)
    if existing:
        raise APIError(ErrorCodes.VALIDATION_ERROR, f"Client {request.client_id} already exists", 400)
    
    # Fetch Instagram account ID if access token provided
    instagram_account_id = request.instagram_account_id
    if request.meta_access_token and not instagram_account_id:
        instagram_account_id = await _fetch_instagram_account_id(request.meta_access_token)
        if instagram_account_id:
            logger.info("instagram_id_auto_fetched", client_id=request.client_id, igsid=instagram_account_id)
    
    # Build client data
    client_data = request.model_dump()
    if instagram_account_id:
        client_data["instagram_account_id"] = instagram_account_id
    
    # Save
    redis_store.save_client(request.client_id, client_data)
    
    # Register Cal.com webhook if API key provided
    if request.calcom_api_key:
        await _register_calcom_webhook(request.client_id, request.calcom_api_key)
    
    logger.info("client_created", client_id=request.client_id)
    
    return {"status": "created", "client_id": request.client_id}


@router.get("/clients/{client_id}")
async def get_client(client_id: str, _: bool = Depends(verify_admin_key)):
    """Get a client configuration by ID."""
    redis_store = get_redis_store()
    client_data = redis_store.get_client(client_id)
    
    if not client_data:
        raise APIError(ErrorCodes.CLIENT_NOT_FOUND, f"Client {client_id} not found", 404)
    
    return client_data


@router.put("/clients/{client_id}")
async def update_client(
    client_id: str,
    request: ClientCreateRequest,
    _: bool = Depends(verify_admin_key)
):
    """Update an existing client configuration."""
    redis_store = get_redis_store()
    
    existing = redis_store.get_client(client_id)
    if not existing:
        raise APIError(ErrorCodes.CLIENT_NOT_FOUND, f"Client {client_id} not found", 404)
    
    # Auto-fetch Instagram ID if token changed
    instagram_account_id = request.instagram_account_id
    if request.meta_access_token and request.meta_access_token != existing.get("meta_access_token"):
        new_id = await _fetch_instagram_account_id(request.meta_access_token)
        if new_id:
            instagram_account_id = new_id
            logger.info("instagram_id_updated", client_id=client_id, igsid=new_id)
    
    # Build updated data
    client_data = request.model_dump()
    if instagram_account_id:
        client_data["instagram_account_id"] = instagram_account_id
    
    # Save
    redis_store.save_client(client_id, client_data)
    
    # Register webhook if Cal.com key changed
    if request.calcom_api_key and request.calcom_api_key != existing.get("calcom_api_key"):
        await _register_calcom_webhook(client_id, request.calcom_api_key)
    
    logger.info("client_updated", client_id=client_id)
    
    return {"status": "updated", "client_id": client_id}


@router.delete("/clients/{client_id}")
async def delete_client(client_id: str, _: bool = Depends(verify_admin_key)):
    """Delete a client configuration."""
    redis_store = get_redis_store()
    
    existing = redis_store.get_client(client_id)
    if not existing:
        raise APIError(ErrorCodes.CLIENT_NOT_FOUND, f"Client {client_id} not found", 404)
    
    redis_store.delete_client(client_id)
    logger.info("client_deleted", client_id=client_id)
    
    return {"status": "deleted", "client_id": client_id}


@router.post("/clients/{client_id}/test-chat")
async def test_client_chat(
    client_id: str,
    request: TestChatRequest,
    _: bool = Depends(verify_admin_key)
):
    """Test a client's chat response."""
    redis_store = get_redis_store()
    
    client_data = redis_store.get_client(client_id)
    if not client_data:
        raise APIError(ErrorCodes.CLIENT_NOT_FOUND, f"Client {client_id} not found", 404)
    
    try:
        from src.core import process_message
        
        result = await process_message(
            sender_id=f"test_user_{client_id}",
            message_text=request.message,
            client_id=client_id,
        )
        
        return {
            "message": request.message,
            "response": result.get("response", ""),
            "client_id": client_id,
            "business_name": client_data.get("business_name", ""),
        }
    except Exception as e:
        logger.error("test_chat_failed", client_id=client_id, error=str(e))
        raise APIError(ErrorCodes.INTERNAL_ERROR, f"Test chat failed: {str(e)}", 500)


@router.post("/import-yaml/{client_name}")
async def import_yaml_client(
    client_name: str,
    _: bool = Depends(verify_admin_key)
):
    """Import a client from YAML file into Redis."""
    import os
    import yaml
    
    yaml_path = os.path.join(
        os.path.dirname(os.path.dirname(os.path.dirname(__file__))),
        "clients",
        f"{client_name}.yaml"
    )
    
    if not os.path.exists(yaml_path):
        raise APIError(ErrorCodes.CLIENT_NOT_FOUND, f"YAML file not found: {client_name}.yaml", 404)
    
    try:
        with open(yaml_path, "r") as f:
            config = yaml.safe_load(f)
        
        redis_store = get_redis_store()
        redis_store.save_client(client_name, config)
        
        logger.info("yaml_client_imported", client_name=client_name)
        
        return {"status": "imported", "client_id": client_name, "config": config}
    except Exception as e:
        logger.error("yaml_import_failed", client_name=client_name, error=str(e))
        raise APIError(ErrorCodes.INTERNAL_ERROR, f"Import failed: {str(e)}", 500)
