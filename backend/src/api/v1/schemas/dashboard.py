"""
Pydantic schemas for dashboard and activity endpoints.
"""

from pydantic import BaseModel
from typing import List, Optional


class DashboardStats(BaseModel):
    """Dashboard analytics statistics."""
    leads_contacted: int
    unique_leads: int
    messages_sent: int
    response_rate: float
    leads_change: str
    unique_change: str
    messages_change: str
    response_change: str
    chart_data: List[dict]


class ActivityMessage(BaseModel):
    """A single message in an activity feed."""
    content: str
    role: str
    timestamp: str


class ActivityItem(BaseModel):
    """A single conversation in the activity feed."""
    customer_id: str
    username: str
    name: str
    last_interaction: str
    message_count: int
    messages: List[dict]


class ActivityResponse(BaseModel):
    """Response for activity endpoint."""
    conversations: List[ActivityItem]
    total: int
