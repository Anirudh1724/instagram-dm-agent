"""
Client API - Singular endpoints for authenticated client dashboard.
"""

from fastapi import APIRouter, Depends, Query, HTTPException
from src.api.auth import get_current_user
from src.api.analytics import fetch_analytics_data, get_client_activity
from src.utils import get_logger

logger = get_logger("client_api")

router = APIRouter(prefix="/api/client", tags=["client"])


@router.get("/dashboard")
async def get_dashboard_data(
    period: str = Query("daily", regex="^(daily|weekly|monthly)$"),
    user: dict = Depends(get_current_user)
):
    """
    Get dashboard analytics for the authenticated client.
    
    This endpoint automatically derives the client_id from the session token,
    fixing the issue where /api/client/dashboard was 404ing.
    """
    client_id = user.get("client_id")
    if not client_id:
        raise HTTPException(status_code=400, detail="User session has no client_id")
        
    logger.info("fetching_dashboard", client_id=client_id, period=period)
    
    return await fetch_analytics_data(client_id, period)


@router.get("/activity")
async def get_activity(
    limit: int = Query(10, ge=1, le=50),
    user: dict = Depends(get_current_user)
):
    """Get recent activity for the authenticated client."""
    client_id = user.get("client_id")
    if not client_id:
        raise HTTPException(status_code=400, detail="User session has no client_id")
        
    return await get_client_activity(client_id, limit)
