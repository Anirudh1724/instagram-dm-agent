"""
API Package - Clean, organized API structure.

This package exports all routers for the application:
- v1_router: Client dashboard endpoints (auth, dashboard, leads)
- admin_router: Admin client management
- instagram_router: Instagram webhook handler
- calcom_router: Cal.com booking webhook
- internal_router: Demo and testing endpoints
"""

from fastapi import APIRouter

# Import all routers
from src.api.v1 import v1_router
from src.api.admin import admin_router
from src.api.webhooks import instagram_router, calcom_router
from src.api.internal import internal_router

# Create combined API router
api_router = APIRouter()

# Include all routers
api_router.include_router(v1_router)
api_router.include_router(admin_router)
api_router.include_router(instagram_router)
api_router.include_router(calcom_router)
api_router.include_router(internal_router)

# Legacy imports for backwards compatibility during migration
# These will be removed after migration is complete
webhook_router = instagram_router
booking_router = calcom_router

__all__ = [
    # New structure
    "api_router",
    "v1_router",
    "admin_router",
    "instagram_router",
    "calcom_router",
    "internal_router",
    # Legacy (deprecated)
    "webhook_router",
    "booking_router",
]
