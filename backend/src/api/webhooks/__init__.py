"""
Webhooks package - external webhook handlers.
"""

from .instagram import router as instagram_router
from .calcom import router as calcom_router

__all__ = ["instagram_router", "calcom_router"]
