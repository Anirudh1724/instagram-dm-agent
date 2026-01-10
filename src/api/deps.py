"""
Authentication and authorization dependencies for API endpoints.
Provides reusable dependency injection for route handlers.
"""

import json
from typing import Optional
from dataclasses import dataclass
from fastapi import Header, Depends
from src.config.redis_config import get_redis_store
from src.config import get_settings
from src.api.errors import APIError, ErrorCodes
from src.utils import get_logger

logger = get_logger("api.deps")


@dataclass
class ClientSession:
    """Represents an authenticated client session."""
    client_id: str
    email: str
    created_at: str


@dataclass  
class AdminSession:
    """Represents an authenticated admin session."""
    email: str
    is_admin: bool = True


async def get_current_client(
    authorization: str = Header(None, description="Bearer token")
) -> ClientSession:
    """
    Dependency to get the current authenticated client.
    
    Usage:
        @router.get("/dashboard")
        async def get_dashboard(client: ClientSession = Depends(get_current_client)):
            return await fetch_data(client.client_id)
    """
    if not authorization:
        raise APIError(ErrorCodes.MISSING_AUTH, "Authorization header required", 401)
    
    if not authorization.startswith("Bearer "):
        raise APIError(ErrorCodes.INVALID_TOKEN, "Invalid authorization scheme. Use 'Bearer <token>'", 401)
    
    token = authorization.split(" ", 1)[1]
    
    try:
        redis_store = get_redis_store()
        r = redis_store._get_redis()
        
        session_data = r.get(f"session:{token}")
        if not session_data:
            raise APIError(ErrorCodes.TOKEN_EXPIRED, "Session expired. Please login again.", 401)
        
        session = json.loads(session_data)
        
        return ClientSession(
            client_id=session["client_id"],
            email=session.get("email", ""),
            created_at=session.get("created_at", "")
        )
        
    except APIError:
        raise
    except Exception as e:
        logger.error("auth_check_failed", error=str(e))
        raise APIError(ErrorCodes.INTERNAL_ERROR, "Authentication check failed", 500)


async def get_optional_client(
    authorization: str = Header(None)
) -> Optional[ClientSession]:
    """
    Dependency for endpoints that work with or without authentication.
    Returns None if not authenticated, ClientSession if authenticated.
    """
    if not authorization:
        return None
    
    try:
        return await get_current_client(authorization)
    except APIError:
        return None


async def verify_admin_key(
    x_admin_key: str = Header(None, description="Admin API key")
) -> bool:
    """
    Dependency to verify admin API key.
    
    Usage:
        @router.get("/clients")
        async def list_clients(_: bool = Depends(verify_admin_key)):
            return await fetch_clients()
    """
    settings = get_settings()
    
    if not x_admin_key:
        raise APIError(ErrorCodes.ADMIN_REQUIRED, "Admin API key required", 401)
    
    if x_admin_key != settings.admin_api_key:
        raise APIError(ErrorCodes.ACCESS_DENIED, "Invalid admin API key", 403)
    
    return True


async def verify_client_owns_resource(
    client_id: str,
    client: ClientSession = Depends(get_current_client)
) -> ClientSession:
    """
    Dependency to ensure the authenticated client owns the requested resource.
    Used for routes like /clients/{client_id}/leads where client_id is in the path.
    """
    if client.client_id != client_id:
        raise APIError(ErrorCodes.ACCESS_DENIED, "You don't have access to this resource", 403)
    
    return client


# Legacy aliases for backwards compatibility during migration
get_current_user = get_current_client
