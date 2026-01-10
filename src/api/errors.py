"""
Centralized error handling for the API.
Provides consistent error responses across all endpoints.
"""

from fastapi import HTTPException, Request
from fastapi.responses import JSONResponse
from typing import Any, Optional


class APIError(HTTPException):
    """
    Custom API error with structured error response.
    
    Usage:
        raise APIError("INVALID_TOKEN", "Session has expired", 401)
    """
    def __init__(
        self, 
        code: str, 
        message: str, 
        status_code: int = 400,
        details: Optional[Any] = None
    ):
        self.code = code
        self.message = message
        self.details = details
        super().__init__(
            status_code=status_code, 
            detail={"code": code, "message": message, "details": details}
        )


# Common error codes
class ErrorCodes:
    # Auth errors (401)
    INVALID_CREDENTIALS = "INVALID_CREDENTIALS"
    INVALID_TOKEN = "INVALID_TOKEN"
    TOKEN_EXPIRED = "TOKEN_EXPIRED"
    MISSING_AUTH = "MISSING_AUTH"
    
    # Authorization errors (403)
    ACCESS_DENIED = "ACCESS_DENIED"
    ADMIN_REQUIRED = "ADMIN_REQUIRED"
    
    # Resource errors (404)
    CLIENT_NOT_FOUND = "CLIENT_NOT_FOUND"
    LEAD_NOT_FOUND = "LEAD_NOT_FOUND"
    BOOKING_NOT_FOUND = "BOOKING_NOT_FOUND"
    
    # Validation errors (400)
    VALIDATION_ERROR = "VALIDATION_ERROR"
    INVALID_REQUEST = "INVALID_REQUEST"
    
    # Server errors (500)
    INTERNAL_ERROR = "INTERNAL_ERROR"
    DATABASE_ERROR = "DATABASE_ERROR"


# Pre-defined common errors for convenience
def invalid_credentials():
    return APIError(ErrorCodes.INVALID_CREDENTIALS, "Invalid email or password", 401)

def invalid_token():
    return APIError(ErrorCodes.INVALID_TOKEN, "Invalid or expired token", 401)

def missing_auth():
    return APIError(ErrorCodes.MISSING_AUTH, "Authentication required", 401)

def access_denied():
    return APIError(ErrorCodes.ACCESS_DENIED, "Access denied", 403)

def admin_required():
    return APIError(ErrorCodes.ADMIN_REQUIRED, "Admin access required", 403)

def client_not_found(client_id: str):
    return APIError(ErrorCodes.CLIENT_NOT_FOUND, f"Client '{client_id}' not found", 404)

def lead_not_found(lead_id: str):
    return APIError(ErrorCodes.LEAD_NOT_FOUND, f"Lead '{lead_id}' not found", 404)

def internal_error(message: str = "An internal error occurred"):
    return APIError(ErrorCodes.INTERNAL_ERROR, message, 500)
