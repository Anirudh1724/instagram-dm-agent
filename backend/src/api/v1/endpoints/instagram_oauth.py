"""
Instagram OAuth endpoints.
Handles the OAuth flow for connecting Instagram Business accounts.
"""


import secrets
import json
from datetime import datetime, timedelta
from typing import Optional
from urllib.parse import urlencode

import httpx
from fastapi import APIRouter, Query, HTTPException, Request
from fastapi.responses import RedirectResponse
from pydantic import BaseModel

from src.config import get_settings
from src.config.redis_config import get_redis_store
from src.utils import get_logger

logger = get_logger("api.instagram_oauth")

router = APIRouter(prefix="/api/auth/instagram", tags=["instagram-oauth"])

# Instagram OAuth URLs (Instagram API with Instagram Login)
INSTAGRAM_OAUTH_URL = "https://www.instagram.com/oauth/authorize"
INSTAGRAM_TOKEN_URL = "https://api.instagram.com/oauth/access_token"
INSTAGRAM_GRAPH_URL = "https://graph.instagram.com"

# Required permissions for Instagram DM automation
# Uses the new Instagram API with Instagram Login scopes
REQUIRED_SCOPES = [
    "instagram_business_basic",
    "instagram_business_manage_messages",
]


class OAuthState(BaseModel):
    """OAuth state for CSRF protection."""
    state: str
    client_id: Optional[str] = None
    created_at: str
    redirect_after: str = "/admin/clients"


class ConnectionStatus(BaseModel):
    """Instagram connection status response."""
    connected: bool
    instagram_account_id: Optional[str] = None
    business_name: Optional[str] = None
    profile_picture: Optional[str] = None
    connected_at: Optional[str] = None


@router.get("/connect")
async def start_oauth(
    client_id: Optional[str] = Query(None, description="Existing client ID to update"),
    redirect_after: str = Query("/admin/clients", description="URL to redirect after success"),
):
    """
    Start the Instagram OAuth flow.
    Redirects the user to Instagram's OAuth authorization page.
    """
    settings = get_settings()
    
    # Get app credentials from settings
    app_id = settings.meta_app_id
    redirect_uri = settings.oauth_redirect_uri or f"{settings.base_url}/api/auth/instagram/callback"
    
    if not app_id:
        raise HTTPException(status_code=500, detail="META_APP_ID not configured")
    
    # Generate state for CSRF protection
    state_token = secrets.token_urlsafe(32)
    state_data = OAuthState(
        state=state_token,
        client_id=client_id,
        created_at=datetime.utcnow().isoformat(),
        redirect_after=redirect_after,
    )
    
    # Store state in Redis (expires in 10 minutes)
    redis_store = get_redis_store()
    r = redis_store._get_redis()
    r.setex(f"oauth_state:{state_token}", timedelta(minutes=10), state_data.model_dump_json())
    
    # Build Instagram OAuth URL (Instagram API with Instagram Login)
    oauth_params = {
        "client_id": app_id,
        "redirect_uri": redirect_uri,
        "scope": ",".join(REQUIRED_SCOPES),
        "response_type": "code",
        "state": state_token,
        "enable_fb_login": "0",  # Force Instagram-only login, no Facebook option
    }
    
    oauth_url = f"{INSTAGRAM_OAUTH_URL}?{urlencode(oauth_params)}"
    
    logger.info("oauth_started", client_id=client_id, state=state_token[:8])
    
    return RedirectResponse(url=oauth_url)


@router.get("/callback")
async def oauth_callback(
    code: Optional[str] = Query(None),
    state: Optional[str] = Query(None),
    error: Optional[str] = Query(None),
    error_description: Optional[str] = Query(None),
):
    """
    Handle OAuth callback from Instagram.
    Exchanges the authorization code for an access token using Instagram API with Instagram Login.
    """
    settings = get_settings()
    
    # Handle OAuth errors
    if error:
        logger.warning("oauth_error", error=error, description=error_description)
        return RedirectResponse(url=f"/admin/clients?error={error}")
    
    if not code or not state:
        raise HTTPException(status_code=400, detail="Missing code or state parameter")
    
    # Verify state (CSRF protection)
    redis_store = get_redis_store()
    r = redis_store._get_redis()
    state_data_raw = r.get(f"oauth_state:{state}")
    
    if not state_data_raw:
        logger.warning("oauth_invalid_state", state=state[:8] if state else None)
        raise HTTPException(status_code=400, detail="Invalid or expired OAuth state")
    
    state_data = OAuthState.model_validate_json(state_data_raw)
    r.delete(f"oauth_state:{state}")  # Clean up state
    
    # Get app credentials
    app_id = settings.meta_app_id
    app_secret = settings.meta_app_secret
    redirect_uri = settings.oauth_redirect_uri or f"{settings.base_url}/api/auth/instagram/callback"
    
    async with httpx.AsyncClient() as client:
        # Step 1: Exchange code for short-lived token (Instagram requires POST)
        token_response = await client.post(
            INSTAGRAM_TOKEN_URL,
            data={
                "client_id": app_id,
                "client_secret": app_secret,
                "grant_type": "authorization_code",
                "redirect_uri": redirect_uri,
                "code": code,
            }
        )
        
        if token_response.status_code != 200:
            logger.error("oauth_token_exchange_failed", response=token_response.text)
            return RedirectResponse(url=f"{state_data.redirect_after}?error=token_exchange_failed")
        
        token_data = token_response.json()
        short_lived_token = token_data.get("access_token")
        user_id = token_data.get("user_id")  # Instagram user ID is returned directly
        
        if not short_lived_token or not user_id:
            logger.error("oauth_missing_token_or_user_id", response=token_data)
            return RedirectResponse(url=f"{state_data.redirect_after}?error=invalid_token_response")
        
        # Step 2: Exchange for long-lived token (Instagram endpoint)
        long_lived_response = await client.get(
            f"{INSTAGRAM_GRAPH_URL}/access_token",
            params={
                "grant_type": "ig_exchange_token",
                "client_secret": app_secret,
                "access_token": short_lived_token,
            }
        )
        
        if long_lived_response.status_code != 200:
            logger.warning("long_lived_token_failed", using_short_lived=True)
            access_token = short_lived_token
            token_expires_in = 3600  # Short-lived tokens last ~1 hour
        else:
            long_lived_data = long_lived_response.json()
            access_token = long_lived_data.get("access_token", short_lived_token)
            token_expires_in = long_lived_data.get("expires_in", 5184000)  # ~60 days
        
        # Step 3: Get Instagram account details directly (no need for Facebook Pages!)
        ig_details_response = await client.get(
            f"{INSTAGRAM_GRAPH_URL}/me",
            params={
                "fields": "user_id,username,name,profile_picture_url,followers_count,account_type",
                "access_token": access_token,
            }
        )
        
        if ig_details_response.status_code != 200:
            logger.error("ig_details_fetch_failed", response=ig_details_response.text)
            return RedirectResponse(url=f"{state_data.redirect_after}?error=ig_details_failed")
        
        ig_details = ig_details_response.json()
        ig_account_id = ig_details.get("user_id") or str(user_id)
        
        # Step 4: Save client data to Redis
        client_id = state_data.client_id or ig_account_id
        
        client_config = {
            "client_id": client_id,
            "business_name": ig_details.get("name") or ig_details.get("username", ""),
            "instagram_username": ig_details.get("username", ""),
            "instagram_account_id": ig_account_id,
            "instagram_graph_id": ig_account_id,
            "account_type": ig_details.get("account_type", ""),  # BUSINESS or CREATOR
            "meta_access_token": access_token,
            "profile_picture": ig_details.get("profile_picture_url", ""),
            "followers_count": ig_details.get("followers_count", 0),
            "token_expires_at": (datetime.utcnow() + timedelta(seconds=token_expires_in)).isoformat(),
            "connected_at": datetime.utcnow().isoformat(),
            "oauth_connected": True,
        }
        
        # Merge with existing config if updating
        existing_config = redis_store.get_client(client_id)
        if existing_config:
            existing_config.update(client_config)
            client_config = existing_config
        
        redis_store.save_client(client_id, client_config)
        
        # Store Instagram ID mapping
        redis_store.store_instagram_mapping(ig_account_id, client_id)
        
        logger.info("oauth_success", 
                   client_id=client_id, 
                   instagram_username=ig_details.get("username"),
                   account_type=ig_details.get("account_type"),
                   business_name=client_config.get("business_name"))
        
        # Redirect to success page
        return RedirectResponse(
            url=f"{state_data.redirect_after}?success=true&client_id={client_id}"
        )


@router.get("/status/{client_id}", response_model=ConnectionStatus)
async def get_connection_status(client_id: str):
    """Get Instagram connection status for a client."""
    redis_store = get_redis_store()
    client_data = redis_store.get_client(client_id)
    
    if not client_data:
        return ConnectionStatus(connected=False)
    
    return ConnectionStatus(
        connected=bool(client_data.get("oauth_connected") or client_data.get("meta_access_token")),
        instagram_account_id=client_data.get("instagram_account_id"),
        business_name=client_data.get("business_name"),
        profile_picture=client_data.get("profile_picture"),
        connected_at=client_data.get("connected_at"),
    )


@router.post("/disconnect/{client_id}")
async def disconnect_instagram(client_id: str):
    """Disconnect Instagram account from a client."""
    redis_store = get_redis_store()
    client_data = redis_store.get_client(client_id)
    
    if not client_data:
        raise HTTPException(status_code=404, detail="Client not found")
    
    # Clear OAuth-related fields
    fields_to_clear = [
        "meta_access_token",
        "instagram_account_id", 
        "instagram_graph_id",
        "page_id",
        "profile_picture",
        "token_expires_at",
        "connected_at",
        "oauth_connected",
    ]
    
    for field in fields_to_clear:
        client_data.pop(field, None)
    
    redis_store.save_client(client_id, client_data)
    
    logger.info("instagram_disconnected", client_id=client_id)
    
    return {"success": True, "message": "Instagram disconnected"}


@router.post("/deauthorize")
async def deauthorize_callback(request: Request):
    """
    Handle deauthorization callback from Meta.
    
    This endpoint is called when a user removes your app from their
    Facebook/Instagram settings. Meta requires this endpoint to be
    configured in the App Dashboard.
    
    Meta sends a signed_request parameter that contains:
    - user_id: The Facebook user ID
    - algorithm: The hashing algorithm (HMAC-SHA256)
    - issued_at: Timestamp when the request was issued
    """
    try:
        form_data = await request.form()
        signed_request = form_data.get("signed_request")
        
        if not signed_request:
            logger.warning("deauthorize_missing_signed_request")
            raise HTTPException(status_code=400, detail="Missing signed_request")
        
        # Parse signed request (format: encoded_sig.payload)
        parts = signed_request.split(".")
        if len(parts) != 2:
            logger.warning("deauthorize_invalid_format")
            raise HTTPException(status_code=400, detail="Invalid signed_request format")
        
        encoded_sig, payload = parts
        
        # Decode payload
        import base64
        # Add padding if needed
        padding = 4 - len(payload) % 4
        if padding != 4:
            payload += "=" * padding
        
        decoded_payload = base64.urlsafe_b64decode(payload)
        payload_data = json.loads(decoded_payload)
        
        user_id = payload_data.get("user_id")
        
        logger.info("deauthorize_callback_received", 
                   user_id=user_id,
                   issued_at=payload_data.get("issued_at"))
        
        # Find and disconnect any clients associated with this Facebook user
        # Note: In a production system, you'd want to store the FB user ID
        # when connecting and use it to find the client here
        
        # For now, log the event for compliance
        logger.info("deauthorize_processed", user_id=user_id)
        
        return {"success": True}
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error("deauthorize_error", error=str(e))
        return {"success": True}  # Return success to Meta even on error


@router.post("/data-deletion")
async def data_deletion_request(request: Request):
    """
    Handle data deletion request from Meta (GDPR compliance).
    
    This endpoint is called when a user requests deletion of their data
    through Facebook's settings. Meta requires this for GDPR/CCPA compliance.
    
    Returns a confirmation_code and a URL where the user can check
    the status of their deletion request.
    """
    settings = get_settings()
    
    try:
        form_data = await request.form()
        signed_request = form_data.get("signed_request")
        
        if not signed_request:
            logger.warning("data_deletion_missing_signed_request")
            raise HTTPException(status_code=400, detail="Missing signed_request")
        
        # Parse signed request
        parts = signed_request.split(".")
        if len(parts) != 2:
            logger.warning("data_deletion_invalid_format")
            raise HTTPException(status_code=400, detail="Invalid signed_request format")
        
        encoded_sig, payload = parts
        
        # Decode payload
        import base64
        padding = 4 - len(payload) % 4
        if padding != 4:
            payload += "=" * padding
        
        decoded_payload = base64.urlsafe_b64decode(payload)
        payload_data = json.loads(decoded_payload)
        
        user_id = payload_data.get("user_id")
        
        logger.info("data_deletion_request_received", user_id=user_id)
        
        # Generate a confirmation code
        confirmation_code = secrets.token_urlsafe(16)
        
        # Store the deletion request in Redis for tracking
        redis_store = get_redis_store()
        r = redis_store._get_redis()
        
        deletion_data = {
            "user_id": user_id,
            "requested_at": datetime.utcnow().isoformat(),
            "status": "pending",
            "confirmation_code": confirmation_code,
        }
        
        # Store deletion request (keep for 90 days for audit)
        r.setex(
            f"data_deletion:{confirmation_code}",
            timedelta(days=90),
            json.dumps(deletion_data)
        )
        
        # TODO: Implement actual data deletion logic
        # Find all clients/data associated with this Facebook user and delete
        
        logger.info("data_deletion_processed", 
                   user_id=user_id, 
                   confirmation_code=confirmation_code)
        
        # Meta requires a specific response format
        base_url = settings.base_url or "https://your-domain.com"
        return {
            "url": f"{base_url}/api/auth/instagram/data-deletion-status?code={confirmation_code}",
            "confirmation_code": confirmation_code,
        }
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error("data_deletion_error", error=str(e))
        raise HTTPException(status_code=500, detail="Failed to process deletion request")


@router.get("/data-deletion-status")
async def data_deletion_status(code: str = Query(..., description="Confirmation code")):
    """
    Check the status of a data deletion request.
    
    This page can be shown to users who want to verify their
    data deletion request was processed.
    """
    redis_store = get_redis_store()
    r = redis_store._get_redis()
    
    deletion_data_raw = r.get(f"data_deletion:{code}")
    
    if not deletion_data_raw:
        return {
            "status": "not_found",
            "message": "Deletion request not found or already completed.",
        }
    
    deletion_data = json.loads(deletion_data_raw)
    
    return {
        "status": deletion_data.get("status", "pending"),
        "requested_at": deletion_data.get("requested_at"),
        "message": "Your data deletion request has been received and is being processed.",
    }
