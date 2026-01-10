"""
Authentication endpoints.
Handles client and admin login/logout.
"""

import hashlib
import secrets
import json
from datetime import datetime, timedelta
from fastapi import APIRouter, Query

from src.config import get_settings
from src.config.redis_config import get_redis_store
from src.api.errors import APIError, ErrorCodes
from src.api.v1.schemas import LoginRequest, LoginResponse, AdminLoginResponse, TokenVerifyResponse, LogoutResponse
from src.utils import get_logger

logger = get_logger("api.auth")

router = APIRouter(prefix="/api/auth", tags=["auth"])

# Try to import bcrypt, fallback to SHA256 if not available
try:
    import bcrypt
    BCRYPT_AVAILABLE = True
except ImportError:
    BCRYPT_AVAILABLE = False
    logger.warning("bcrypt_not_installed", message="Using SHA256 fallback. Install bcrypt for better security.")


def hash_password(password: str) -> str:
    """Hash a password using bcrypt (preferred) or SHA256 fallback."""
    if BCRYPT_AVAILABLE:
        # bcrypt returns bytes, so we encode/decode
        hashed = bcrypt.hashpw(password.encode('utf-8'), bcrypt.gensalt())
        return f"bcrypt:{hashed.decode('utf-8')}"
    else:
        # SHA256 fallback
        hashed = hashlib.sha256(password.encode()).hexdigest()
        return f"sha256:{hashed}"


def verify_password(password: str, stored_password: str) -> bool:
    """
    Verify a password against stored hash.
    Supports bcrypt, SHA256, and plain text for backwards compatibility.
    """
    if not stored_password:
        return False
    
    # bcrypt hash (preferred)
    if stored_password.startswith("bcrypt:"):
        if not BCRYPT_AVAILABLE:
            logger.error("bcrypt_required", message="Stored password requires bcrypt")
            return False
        hashed = stored_password[7:].encode('utf-8')
        return bcrypt.checkpw(password.encode('utf-8'), hashed)
    
    # SHA256 hash (legacy)
    if stored_password.startswith("sha256:"):
        hashed = stored_password[7:]
        return hashlib.sha256(password.encode()).hexdigest() == hashed
    
    # Old format: "hashed:" prefix (SHA256)
    if stored_password.startswith("hashed:"):
        hashed = stored_password[7:]
        return hashlib.sha256(password.encode()).hexdigest() == hashed
    
    # Plain text (for backwards compatibility - will be migrated on next password update)
    return stored_password == password


def _generate_token() -> str:
    """Generate a secure random token."""
    return secrets.token_urlsafe(32)


@router.post("/login", response_model=LoginResponse)
async def login(request: LoginRequest):
    """
    Authenticate a client and return a session token.
    
    - **email**: Client's registered email
    - **password**: Client's password
    
    Returns a session token valid for 7 days.
    """
    email = request.email.lower().strip()
    password = request.password
    
    try:
        redis_store = get_redis_store()
        clients = redis_store.list_clients()
        
        for client_info in clients:
            client_id = client_info.get("client_id")
            if not client_id:
                continue
            
            client_data = redis_store.get_client(client_id)
            if not client_data:
                continue
            
            # Check email match
            client_email = client_data.get("login_email", "").lower().strip()
            if client_email != email:
                continue
            
            # Check password using the unified verify_password function
            stored_password = client_data.get("login_password", "")
            
            if not verify_password(password, stored_password):
                continue
            

            # Login successful
            token = _generate_token()
            
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
            )
        
        logger.warning("client_login_failed", email=email, reason="invalid_credentials")
        raise APIError(ErrorCodes.INVALID_CREDENTIALS, "Invalid email or password", 401)
    
    except APIError:
        raise
    except Exception as e:
        logger.error("login_error", error=str(e))
        raise APIError(ErrorCodes.INTERNAL_ERROR, "Login failed. Please try again.", 500)


@router.post("/admin/login", response_model=AdminLoginResponse)
async def admin_login(request: LoginRequest):
    """
    Authenticate admin user using settings-based credentials.
    Works independently of Redis client data.
    """
    settings = get_settings()
    email = request.email.lower().strip()
    password = request.password
    
    if email == settings.admin_email.lower() and password == settings.admin_password:
        token = _generate_token()
        
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
        
        return AdminLoginResponse(success=True, token=token, is_admin=True)
    
    logger.warning("admin_login_failed", email=email)
    raise APIError(ErrorCodes.INVALID_CREDENTIALS, "Invalid admin credentials", 401)


@router.post("/logout", response_model=LogoutResponse)
async def logout(token: str = Query("", description="Session token to invalidate")):
    """Invalidate a session token."""
    if token:
        try:
            redis_store = get_redis_store()
            r = redis_store._get_redis()
            r.delete(f"session:{token}")
            logger.info("client_logout", token=token[:8] + "...")
        except Exception as e:
            logger.warning("logout_error", error=str(e))
    
    return LogoutResponse(success=True)


@router.get("/verify", response_model=TokenVerifyResponse)
async def verify_token(token: str = Query(..., description="Session token to verify")):
    """Verify a session token is valid."""
    if not token:
        raise APIError(ErrorCodes.MISSING_AUTH, "No token provided", 401)
    
    try:
        redis_store = get_redis_store()
        r = redis_store._get_redis()
        
        session_data = r.get(f"session:{token}")
        if not session_data:
            raise APIError(ErrorCodes.TOKEN_EXPIRED, "Invalid or expired token", 401)
        
        session = json.loads(session_data)
        client_data = redis_store.get_client(session["client_id"])
        
        return TokenVerifyResponse(
            valid=True,
            client_id=session["client_id"],
            business_name=client_data.get("business_name", "") if client_data else "",
        )
    
    except APIError:
        raise
    except Exception as e:
        logger.error("verify_error", error=str(e))
        raise APIError(ErrorCodes.INTERNAL_ERROR, "Token verification failed", 500)
