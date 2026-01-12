"""
API v1 package - combines all v1 endpoints.
"""

from fastapi import APIRouter

from .endpoints import auth_router, dashboard_router, leads_router
from .endpoints.instagram_oauth import router as instagram_oauth_router

# Create combined v1 router
v1_router = APIRouter()

# Include all endpoint routers
v1_router.include_router(auth_router)
v1_router.include_router(dashboard_router)
v1_router.include_router(leads_router)
v1_router.include_router(instagram_oauth_router)

__all__ = ["v1_router"]
