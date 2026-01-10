"""
Pydantic schemas for leads endpoints.
"""

from pydantic import BaseModel
from typing import List, Optional


class LeadSummary(BaseModel):
    """Summary of a lead for list views."""
    id: str
    customer_id: str
    username: str
    name: str
    profile_pic: Optional[str] = ""
    status: str
    last_interaction: str
    message_count: int
    last_message: str
    source: str = "Instagram"
    lead_type: str = "organic"


class LeadsListResponse(BaseModel):
    """Response for leads list endpoint."""
    leads: List[LeadSummary]
    total: int
    offset: int
    limit: int


class LeadMessage(BaseModel):
    """A single message in a conversation."""
    content: str
    role: str
    timestamp: str
    is_followup: Optional[bool] = False


class LeadDetail(BaseModel):
    """Detailed lead info with full conversation."""
    customer_id: str
    username: str
    name: str
    messages: List[dict]
    message_count: int
    last_interaction: str
    followup_count: int
    stage: str


class FollowupLead(BaseModel):
    """Lead with followup status."""
    customer_id: str
    username: str
    name: str
    followup_count: int
    last_followup_at: str
    last_interaction: str
    message_count: int
    last_message: str
    status: str = "Followup Sent"


class FollowupLeadsResponse(BaseModel):
    """Response for followup leads endpoint."""
    leads: List[FollowupLead]
    total: int


class BookingLead(BaseModel):
    """Lead at booking stage."""
    customer_id: str
    username: str
    name: str
    stage: str
    last_interaction: str
    message_count: int
    last_message: str
    status: str


class BookingLeadsResponse(BaseModel):
    """Response for booking leads endpoint."""
    leads: List[BookingLead]
    total: int
