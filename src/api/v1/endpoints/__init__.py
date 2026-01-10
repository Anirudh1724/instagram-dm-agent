"""
Endpoints package - exports all route handlers.
"""

from .auth import router as auth_router
from .dashboard import router as dashboard_router
from .leads import router as leads_router

__all__ = [
    "auth_router",
    "dashboard_router", 
    "leads_router",
]
