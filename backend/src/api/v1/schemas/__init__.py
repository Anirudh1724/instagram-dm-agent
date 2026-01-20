"""
Schemas package - exports all Pydantic models.
"""

from .auth import (
    LoginRequest,
    LoginResponse,
    AdminLoginResponse,
    TokenVerifyResponse,
    LogoutResponse,
)

from .dashboard import (
    DashboardStats,
    ActivityItem,
    ActivityResponse,
)

from .leads import (
    LeadSummary,
    LeadsListResponse,
    LeadDetail,
    FollowupLead,
    FollowupLeadsResponse,
    BookingLead,
    BookingLeadsResponse,
)

__all__ = [
    # Auth
    "LoginRequest",
    "LoginResponse", 
    "AdminLoginResponse",
    "TokenVerifyResponse",
    "LogoutResponse",
    # Dashboard
    "DashboardStats",
    "ActivityItem",
    "ActivityResponse",
    # Leads
    "LeadSummary",
    "LeadsListResponse",
    "LeadDetail",
    "FollowupLead",
    "FollowupLeadsResponse",
    "BookingLead",
    "BookingLeadsResponse",
]
