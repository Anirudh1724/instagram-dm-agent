"""
Voice Agent Dashboard endpoints.
Provides analytics and activity data for voice calls (inbound/outbound).
"""

from datetime import datetime
from fastapi import APIRouter, Query, Depends

from src.core.voice_conversation_store import get_voice_conversation_store
from src.api.deps import get_current_client, ClientSession
from src.utils import get_logger

logger = get_logger("api.voice")

router = APIRouter(prefix="/api/client/voice", tags=["voice"])


@router.get("/dashboard")
async def get_voice_dashboard(
    period: str = Query("daily", pattern="^(daily|weekly|monthly)$"),
    client: ClientSession = Depends(get_current_client)
):
    """
    Get voice dashboard analytics for the authenticated client.
    
    - **period**: Time period - daily, weekly, or monthly
    
    Returns statistics and chart data for voice calls.
    """
    client_id = client.client_id
    logger.info("fetching_voice_dashboard", client_id=client_id, period=period)
    
    voice_store = get_voice_conversation_store()
    analytics = voice_store.get_voice_analytics(client_id, period)
    
    # Map to frontend expected format
    return {
        "total_leads": analytics["calls_received"],  # calls_received -> leadsContacted
        "leads_change": _parse_change(analytics["calls_change"]),
        "unique_leads": analytics["unique_callers"],  # unique_callers -> uniqueLeads
        "unique_leads_change": _parse_change(analytics["unique_change"]),
        "messages_sent": analytics["calls_answered"],  # calls_answered -> messagesSent
        "messages_change": _parse_change(analytics["answered_change"]),
        "response_rate": analytics["answer_rate"],  # answer_rate -> responseRate
        "response_rate_change": _parse_change(analytics["answer_rate_change"]),
        "bookings": analytics["bookings"],
        "bookings_change": _parse_change(analytics["bookings_change"]),
        "chart_data": [
            {
                "name": item["label"],
                "leads": item["received"],
                "messages": item["answered"],
                "conversions": 0,
            }
            for item in analytics.get("chart_data", [])
        ],
        "funnel_data": [
            {"name": "Total Calls", "value": analytics["calls_received"], "fill": "#8884d8"},
            {"name": "Answered", "value": analytics["calls_answered"], "fill": "#83a6ed"},
            {"name": "Qualified", "value": max(0, analytics["calls_answered"] - analytics["bookings"]), "fill": "#8dd1e1"},
            {"name": "Booked", "value": analytics["bookings"], "fill": "#82ca9d"},
        ],
    }


@router.get("/activity")
async def get_voice_activity(
    limit: int = Query(10, ge=1, le=50),
    client: ClientSession = Depends(get_current_client)
):
    """
    Get recent voice call activity for the authenticated client.
    
    - **limit**: Maximum number of calls to return (1-50)
    
    Returns a list of recent voice calls.
    """
    client_id = client.client_id
    logger.info("fetching_voice_activity", client_id=client_id, limit=limit)
    
    voice_store = get_voice_conversation_store()
    conversations = voice_store.list_voice_conversations(client_id, limit=limit)
    
    # Format for frontend
    activities = []
    for conv in conversations:
        # Format time ago
        created_at = conv.get("created_at", "")
        time_ago = _format_time_ago(created_at)
        
        # Determine last message based on status
        status = conv.get("status", "answered")
        if status == "missed":
            last_message = "Missed Call"
        elif status == "voicemail":
            last_message = "Voicemail"
        else:
            duration = conv.get("duration", "0:00")
            last_message = f"Duration: {duration}"
        
        activities.append({
            "customer_id": conv.get("id", ""),
            "username": "Voice Caller",
            "name": conv.get("phone_number", "Unknown"),
            "last_interaction": created_at,
            "message_count": conv.get("message_count", 0),
            "status": status,
            "call_type": conv.get("call_type", "inbound"),
            "duration": conv.get("duration", "0:00"),
        })
    
    return {
        "conversations": activities,
        "total": len(activities),
    }


@router.get("/conversations/{call_id}")
async def get_voice_conversation(
    call_id: str,
    client: ClientSession = Depends(get_current_client)
):
    """
    Get a specific voice conversation with transcript.
    
    - **call_id**: The call/conversation ID
    
    Returns the call details and message transcript.
    """
    client_id = client.client_id
    logger.info("fetching_voice_conversation", client_id=client_id, call_id=call_id)
    
    voice_store = get_voice_conversation_store()
    conversation = voice_store.get_voice_conversation(client_id, call_id)
    
    if not conversation:
        return {"error": "Conversation not found", "messages": []}
    
    # Format messages for frontend
    messages = []
    for msg in conversation.get("messages", []):
        messages.append({
            "id": f"msg-{len(messages)}",
            "content": msg.get("content", ""),
            "role": msg.get("role", "user"),
            "timestamp": msg.get("timestamp", ""),
        })
    
    return {
        "id": conversation.get("id", call_id),
        "phone_number": conversation.get("phone_number", ""),
        "call_type": conversation.get("call_type", "inbound"),
        "status": conversation.get("status", "answered"),
        "duration": conversation.get("duration", "0:00"),
        "created_at": conversation.get("created_at", ""),
        "messages": messages,
    }


def _parse_change(change_str: str) -> int:
    """Parse change string (e.g., '+5' or '-3' or '+5%') to integer."""
    try:
        clean = change_str.replace("%", "").replace("+", "")
        return int(float(clean))
    except:
        return 0


def _format_time_ago(timestamp: str) -> str:
    """Format timestamp as 'X min ago' style string."""
    if not timestamp:
        return ""
    
    try:
        # Handle Unix timestamp
        if timestamp.replace(".", "").isdigit():
            dt = datetime.fromtimestamp(float(timestamp))
        else:
            dt = datetime.fromisoformat(timestamp.replace("Z", "+00:00"))
            dt = dt.replace(tzinfo=None)
        
        now = datetime.utcnow()
        diff = now - dt
        
        minutes = int(diff.total_seconds() / 60)
        hours = int(diff.total_seconds() / 3600)
        days = int(diff.total_seconds() / 86400)
        
        if minutes < 1:
            return "Just now"
        elif minutes < 60:
            return f"{minutes}m ago"
        elif hours < 24:
            return f"{hours}h ago"
        elif days < 7:
            return f"{days}d ago"
        else:
            return dt.strftime("%b %d")
    except:
        return ""
