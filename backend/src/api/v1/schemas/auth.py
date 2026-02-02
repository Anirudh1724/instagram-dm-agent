"""
Pydantic schemas for authentication endpoints.
"""

from pydantic import BaseModel, EmailStr
from typing import Optional


class LoginRequest(BaseModel):
    """Request body for client login."""
    email: str
    password: str


class LoginResponse(BaseModel):
    """Response from successful login."""
    success: bool
    client_id: str
    business_name: str
    token: str
    agent_type: str = "text"


class AdminLoginResponse(BaseModel):
    """Response from successful admin login."""
    success: bool
    token: str
    is_admin: bool = True


class TokenVerifyResponse(BaseModel):
    """Response from token verification."""
    valid: bool
    client_id: Optional[str] = None
    business_name: Optional[str] = None
    agent_type: str = "text"


class LogoutResponse(BaseModel):
    """Response from logout."""
    success: bool = True
