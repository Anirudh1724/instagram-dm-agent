"""
Dashboard endpoints.
Provides analytics and activity data for the client dashboard.
"""

import json
from datetime import datetime, timedelta
from fastapi import APIRouter, Query, Depends

from src.core.conversation_store import get_conversation_store
from src.api.deps import get_current_client, ClientSession
from src.api.errors import APIError, ErrorCodes
from src.utils import get_logger

logger = get_logger("api.dashboard")

router = APIRouter(prefix="/api/client", tags=["dashboard"])


@router.get("/dashboard")
async def get_dashboard(
    period: str = Query("daily", regex="^(daily|weekly|monthly)$"),
    client: ClientSession = Depends(get_current_client)
):
    """
    Get dashboard analytics for the authenticated client.
    
    - **period**: Time period - daily, weekly, or monthly
    
    Returns statistics and chart data for the dashboard.
    """
    client_id = client.client_id
    logger.info("fetching_dashboard", client_id=client_id, period=period)
    
    conv_store = get_conversation_store()
    
    try:
        r = conv_store._get_redis()
        now = datetime.utcnow()
        
        # Define time ranges
        if period == "daily":
            current_start = now - timedelta(days=1)
            previous_start = now - timedelta(days=2)
            chart_days = 7
        elif period == "weekly":
            current_start = now - timedelta(weeks=1)
            previous_start = now - timedelta(weeks=2)
            chart_days = 7
        else:  # monthly
            current_start = now - timedelta(days=30)
            previous_start = now - timedelta(days=60)
            chart_days = 30
        
        # Get conversations
        pattern = f"conversation:{client_id}:*"
        keys = r.keys(pattern)
        
        current_stats = {
            "leads_contacted": 0,
            "unique_leads": set(),
            "messages_received": 0,
            "messages_sent": 0,
        }
        
        previous_stats = {
            "leads_contacted": 0,
            "unique_leads": set(),
            "messages_received": 0,
            "messages_sent": 0,
        }
        
        # Chart data
        chart_data = {}
        for i in range(chart_days):
            day = now - timedelta(days=i)
            date_key = day.strftime("%Y-%m-%d")
            label = day.strftime("%b %d") if chart_days <= 7 else day.strftime("%d")
            chart_data[date_key] = {"label": label, "received": 0, "sent": 0}
        
        for key in keys:
            try:
                data = r.get(key)
                if not data:
                    continue
                
                conv = json.loads(data)
                customer_id = conv.get("customer_id", "")
                messages = conv.get("messages", [])
                last_interaction = conv.get("last_interaction", "")
                
                # Parse last interaction time
                if last_interaction:
                    try:
                        conv_time = datetime.fromisoformat(last_interaction.replace("Z", "+00:00"))
                        conv_time = conv_time.replace(tzinfo=None)
                    except:
                        conv_time = now - timedelta(days=365)
                else:
                    conv_time = now - timedelta(days=365)
                
                # Current period stats
                if conv_time >= current_start:
                    current_stats["leads_contacted"] += 1
                    current_stats["unique_leads"].add(customer_id)
                    
                    for msg in messages:
                        msg_time = msg.get("timestamp", "")
                        if msg_time:
                            try:
                                mt = datetime.fromisoformat(msg_time.replace("Z", "+00:00"))
                                mt = mt.replace(tzinfo=None)
                                if mt >= current_start:
                                    if msg.get("role") in ["customer", "user"]:
                                        current_stats["messages_received"] += 1
                                    else:
                                        current_stats["messages_sent"] += 1
                                    
                                    date_key = mt.strftime("%Y-%m-%d")
                                    if date_key in chart_data:
                                        if msg.get("role") in ["customer", "user"]:
                                            chart_data[date_key]["received"] += 1
                                        else:
                                            chart_data[date_key]["sent"] += 1
                            except:
                                pass
                
                # Previous period stats
                elif conv_time >= previous_start:
                    previous_stats["leads_contacted"] += 1
                    previous_stats["unique_leads"].add(customer_id)
                    
                    for msg in messages:
                        if msg.get("role") in ["customer", "user"]:
                            previous_stats["messages_received"] += 1
                        else:
                            previous_stats["messages_sent"] += 1
            
            except Exception as e:
                logger.warning("analytics_parse_error", key=key, error=str(e))
                continue
        
        # Calculate response rate
        if current_stats["messages_received"] > 0:
            response_rate = round(
                (current_stats["messages_sent"] / current_stats["messages_received"]) * 100, 1
            )
        else:
            response_rate = 0
        
        if previous_stats["messages_received"] > 0:
            prev_response_rate = round(
                (previous_stats["messages_sent"] / previous_stats["messages_received"]) * 100, 1
            )
        else:
            prev_response_rate = 0
        
        # Calculate changes
        leads_change = current_stats["leads_contacted"] - previous_stats["leads_contacted"]
        unique_change = len(current_stats["unique_leads"]) - len(previous_stats["unique_leads"])
        messages_change = current_stats["messages_sent"] - previous_stats["messages_sent"]
        response_change = round(response_rate - prev_response_rate, 1)
        
        # Format chart data
        sorted_chart = sorted(chart_data.items(), key=lambda x: x[0])
        chart_list = [v for k, v in sorted_chart]
        
        return {
            "leads_contacted": current_stats["leads_contacted"],
            "unique_leads": len(current_stats["unique_leads"]),
            "messages_sent": current_stats["messages_sent"],
            "response_rate": response_rate,
            "leads_change": f"+{leads_change}" if leads_change >= 0 else str(leads_change),
            "unique_change": f"+{unique_change}" if unique_change >= 0 else str(unique_change),
            "messages_change": f"+{messages_change}" if messages_change >= 0 else str(messages_change),
            "response_change": f"+{response_change}%" if response_change >= 0 else f"{response_change}%",
            "chart_data": chart_list,
        }
    
    except Exception as e:
        logger.error("analytics_fetch_failed", client_id=client_id, error=str(e))
        return {
            "leads_contacted": 0,
            "unique_leads": 0,
            "messages_sent": 0,
            "response_rate": 0,
            "leads_change": "+0",
            "unique_change": "+0",
            "messages_change": "+0",
            "response_change": "+0%",
            "chart_data": [],
        }


@router.get("/activity")
async def get_activity(
    limit: int = Query(10, ge=1, le=50),
    client: ClientSession = Depends(get_current_client)
):
    """
    Get recent conversation activity for the authenticated client.
    
    - **limit**: Maximum number of conversations to return (1-50)
    
    Returns a list of recent conversations with last messages.
    """
    client_id = client.client_id
    conv_store = get_conversation_store()
    
    try:
        r = conv_store._get_redis()
        
        pattern = f"conversation:{client_id}:*"
        keys = r.keys(pattern)
        
        conversations = []
        
        for key in keys:
            try:
                data = r.get(key)
                if not data:
                    continue
                
                conv = json.loads(data)
                customer_id = conv.get("customer_id", "")
                
                # Get customer metadata
                meta_key = f"customer:{client_id}:{customer_id}"
                meta_data = r.get(meta_key)
                
                username = ""
                name = ""
                if meta_data:
                    try:
                        meta = json.loads(meta_data)
                        username = meta.get("username", "")
                        name = meta.get("name", "")
                    except:
                        pass
                
                conversations.append({
                    "customer_id": customer_id,
                    "username": username,
                    "name": name,
                    "last_interaction": conv.get("last_interaction", ""),
                    "message_count": conv.get("message_count", 0),
                    "messages": conv.get("messages", [])[-5:],
                })
            
            except Exception as e:
                logger.warning("activity_parse_error", key=key, error=str(e))
                continue
        
        # Sort by last interaction
        conversations.sort(
            key=lambda x: x.get("last_interaction", ""),
            reverse=True
        )
        
        return {
            "conversations": conversations[:limit],
            "total": len(conversations),
        }
    
    except Exception as e:
        logger.error("activity_fetch_failed", client_id=client_id, error=str(e))
        return {
            "conversations": [],
            "total": 0,
        }
