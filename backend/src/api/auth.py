"""
Authentication API - Login endpoints for client dashboard.
"""

import hashlib
import secrets
import json
from datetime import datetime, timedelta
from fastapi import APIRouter, HTTPException
from pydantic import BaseModel
from src.utils import get_logger
from src.config.redis_config import get_redis_store

logger = get_logger("auth")

router = APIRouter(prefix="/api/auth", tags=["auth"])


class LoginRequest(BaseModel):
    email: str
    password: str


class LoginResponse(BaseModel):
    success: bool
    client_id: str = ""
    business_name: str = ""
    token: str = ""
    agent_type: str = "text"


def hash_password(password: str) -> str:
    """Hash a password using SHA256."""
    return hashlib.sha256(password.encode()).hexdigest()


def verify_password(password: str, hashed: str) -> bool:
    """Verify a password against its hash."""
    return hash_password(password) == hashed


def generate_token() -> str:
    """Generate a secure random token."""
    return secrets.token_urlsafe(32)


@router.post("/login", response_model=LoginResponse)
async def login(request: LoginRequest):
    """
    Authenticate a client and return a session token.
    
    Args:
        request: Login credentials (email + password)
        
    Returns:
        Session token and client info if successful
    """
    email = request.email.lower().strip()
    password = request.password
    
    try:
        redis_store = get_redis_store()
        
        # Get all clients and find matching email
        clients = redis_store.list_clients()
        
        for client_info in clients:
            client_id = client_info.get("client_id")
            if not client_id:
                continue
            
            # Get full client data
            client_data = redis_store.get_client(client_id)
            if not client_data:
                continue
            
            # Check email match
            client_email = client_data.get("login_email", "").lower().strip()
            if client_email != email:
                continue
            
            # Check password
            stored_password = client_data.get("login_password", "")
            
            # If password is hashed
            if stored_password.startswith("hashed:"):
                hashed = stored_password[7:]  # Remove "hashed:" prefix
                if not verify_password(password, hashed):
                    continue
            else:
                # Plain text password (for backwards compatibility)
                if stored_password != password:
                    continue
            
            # Login successful!
            token = generate_token()
            
            # Store session in Redis (expires in 7 days)
            session_key = f"session:{token}"
            session_data = {
                "client_id": client_id,
                "email": email,
                "created_at": datetime.utcnow().isoformat(),
            }
            
            r = redis_store._get_redis()
            r.setex(session_key, timedelta(days=7), json.dumps(session_data))
            
            logger.info("client_login_success", email=email, client_id=client_id)
            
            return LoginResponse(
                success=True,
                client_id=client_id,
                business_name=client_data.get("business_name", ""),
                token=token,
                agent_type=client_data.get("agent_type", "text"),
            )
        
        # No matching client found
        logger.warning("client_login_failed", email=email, reason="invalid_credentials")
        raise HTTPException(status_code=401, detail="Invalid email or password")
    
    except HTTPException:
        raise
    except Exception as e:
        logger.error("login_error", error=str(e))
        raise HTTPException(status_code=500, detail="Login failed. Please try again.")


@router.post("/admin/login")
async def admin_login(request: LoginRequest):
    """
    Authenticate admin user using settings-based credentials.
    
    This endpoint works independently of Redis client data,
    so admin can always login even when Redis is empty.
    """
    from src.config import get_settings
    
    settings = get_settings()
    email = request.email.lower().strip()
    password = request.password
    
    # Check against admin credentials from settings
    if email == settings.admin_email.lower() and password == settings.admin_password:
        # Generate a token for the admin session
        token = generate_token()
        
        # Store admin session in Redis
        redis_store = get_redis_store()
        session_key = f"admin_session:{token}"
        session_data = {
            "is_admin": True,
            "email": email,
            "created_at": datetime.utcnow().isoformat(),
        }
        
        r = redis_store._get_redis()
        r.setex(session_key, timedelta(days=7), json.dumps(session_data))
        
        logger.info("admin_login_success", email=email)
        
        return {
            "success": True,
            "token": token,
            "is_admin": True,
        }
    
    logger.warning("admin_login_failed", email=email)
    raise HTTPException(status_code=401, detail="Invalid admin credentials")


@router.post("/logout")
async def logout(token: str = ""):
    """
    Invalidate a session token.
    """
    if token:
        try:
            redis_store = get_redis_store()
            r = redis_store._get_redis()
            r.delete(f"session:{token}")
            logger.info("client_logout", token=token[:8] + "...")
        except Exception as e:
            logger.warning("logout_error", error=str(e))
    
    return {"success": True}


@router.get("/verify")
async def verify_token(token: str):
    """
    Verify a session token is valid.
    """
    if not token:
        raise HTTPException(status_code=401, detail="No token provided")
    
    try:
        redis_store = get_redis_store()
        r = redis_store._get_redis()
        
        session_data = r.get(f"session:{token}")
        if not session_data:
            raise HTTPException(status_code=401, detail="Invalid or expired token")
        
        session = json.loads(session_data)
        
        # Get client info
        client_data = redis_store.get_client(session["client_id"])
        
        return {
            "valid": True,
            "client_id": session["client_id"],
            "business_name": client_data.get("business_name", "") if client_data else "",
            "agent_type": client_data.get("agent_type", "text") if client_data else "text",
        }
    
    except HTTPException:
        raise
    except Exception as e:
        logger.error("verify_error", error=str(e))
    except Exception as e:
        logger.error("verify_error", error=str(e))
        raise HTTPException(status_code=401, detail="Token verification failed")


# --- Dependencies ---

from fastapi import Depends, Header

async def get_current_user(
    authorization: str = Header(None),
) -> dict:
    """
    Dependency to verify session token and return user info.
    Usage: user = Depends(get_current_user)
    """
    if not authorization:
        raise HTTPException(status_code=401, detail="Missing authentication header")
    
    if not authorization.startswith("Bearer "):
        raise HTTPException(status_code=401, detail="Invalid authentication scheme")
    
    token = authorization.split(" ")[1]
    
    try:
        redis_store = get_redis_store()
        r = redis_store._get_redis()
        
        session_data = r.get(f"session:{token}")
        if not session_data:
            raise HTTPException(status_code=401, detail="Invalid or expired token")
        
        return json.loads(session_data)
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error("auth_dependency_error", error=str(e))
        raise HTTPException(status_code=401, detail="Authentication failed")

async def verify_client_access(
    client_id: str,
    user: dict = Depends(get_current_user)
):
    """
    Dependency to ensure the authenticated user matches the requested client_id.
    """
    if user["client_id"] != client_id:
        raise HTTPException(status_code=403, detail="Access denied")
    return user

