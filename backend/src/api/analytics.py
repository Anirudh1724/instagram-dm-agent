"""
Analytics API - Endpoints for client dashboard analytics.
"""

import json
from datetime import datetime, timedelta
from fastapi import APIRouter, Query, Depends
from src.utils import get_logger
from src.core.conversation_store import get_conversation_store
from src.config.redis_config import get_redis_store
from src.api.auth import verify_client_access

logger = get_logger("analytics")

router = APIRouter(prefix="/api/clients", tags=["analytics"])


# --- Core Data Fetching Functions (no FastAPI decorators) ---

async def fetch_analytics_data(client_id: str, period: str):
    """
    Fetch analytics data for a client. This is a pure function for reuse.
    
    Args:
        client_id: The client's Instagram account ID
        period: Time period - daily, weekly, or monthly
    
    Returns:
        Analytics data including stats and chart data
    """
    conv_store = get_conversation_store()
    
    try:
        r = conv_store._get_redis()
        
        # Define time ranges based on period
        now = datetime.utcnow()
        
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
        
        # Get all conversations for this client
        pattern = f"conversation:{client_id}:*"
        keys = r.keys(pattern)
        
        # Calculate stats
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
        
        # Chart data - messages per day
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
                        conv_time = now - timedelta(days=365)  # Very old
                else:
                    conv_time = now - timedelta(days=365)
                
                # Count for current period
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
                                    
                                    # Add to chart data
                                    date_key = mt.strftime("%Y-%m-%d")
                                    if date_key in chart_data:
                                        if msg.get("role") in ["customer", "user"]:
                                            chart_data[date_key]["received"] += 1
                                        else:
                                            chart_data[date_key]["sent"] += 1
                            except:
                                pass
                
                # Count for previous period (for change calculation)
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
        
        # Format chart data (reverse to show oldest first)
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



async def get_client_activity(client_id: str, limit: int = 10):
    """
    Get recent conversation activity for a client. This is a pure function for reuse.
    
    Args:
        client_id: The client's Instagram account ID
        limit: Number of conversations to return
    
    Returns:
        List of recent conversations with messages
    """
    conv_store = get_conversation_store()
    
    try:
        r = conv_store._get_redis()
        
        # Get all conversations for this client
        pattern = f"conversation:{client_id}:*"
        keys = r.keys(pattern)
        
        conversations = []
        
        for key in keys:
            try:
                data = r.get(key)
                if not data:
                    continue
                
                conv = json.loads(data)
                
                # Get customer metadata for username
                customer_id = conv.get("customer_id", "")
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
                    "messages": conv.get("messages", [])[-5:],  # Last 5 messages
                })
            
            except Exception as e:
                logger.warning("activity_parse_error", key=key, error=str(e))
                continue
        
        # Sort by last interaction (most recent first)
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


# --- FastAPI Route Endpoints ---

@router.get("/{client_id}/analytics")
async def get_client_analytics_endpoint(
    client_id: str,
    period: str = Query("daily", regex="^(daily|weekly|monthly)$"),
    _: dict = Depends(verify_client_access),
):
    """
    Get analytics data for a client.
    
    Args:
        client_id: The client's Instagram account ID
        period: Time period - daily, weekly, or monthly
    
    Returns:
        Analytics data including stats and chart data
    """
    return await fetch_analytics_data(client_id, period)


@router.get("/{client_id}/activity")
async def get_client_activity_endpoint(
    client_id: str,
    limit: int = Query(10, ge=1, le=50),
    _: dict = Depends(verify_client_access),
):
    """
    Get recent conversation activity for a client.
    
    Args:
        client_id: The client's Instagram account ID
        limit: Number of conversations to return
    
    Returns:
        List of recent conversations with messages
    """
    return await get_client_activity(client_id, limit)


def _detect_conversation_stage(messages: list) -> str:
    """
    Detect the conversation stage based on message content.
    Returns: greeting, inquiry, pricing, booking, post_booking, or unclear
    """
    if not messages:
        return "unclear"
    
    # Get text from last few messages
    recent_texts = []
    for msg in messages[-5:]:
        content = msg.get("content", "").lower()
        recent_texts.append(content)
    
    combined = " ".join(recent_texts)
    
    # Check for booking-related keywords
    booking_keywords = ["book", "slot", "payment", "confirm", "schedule", "appointment", "calendar"]
    payment_keywords = ["paid", "payment", "upi", "razorpay", "phonepe", "paytm", "gpay"]
    
    has_booking = any(kw in combined for kw in booking_keywords)
    has_payment = any(kw in combined for kw in payment_keywords)
    
    if has_payment:
        return "post_booking"
    if has_booking:
        return "booking"
    
    # Check for pricing
    if any(kw in combined for kw in ["price", "cost", "fee", "charge", "₹", "rs", "rupee"]):
        return "pricing"
    
    # Check for inquiry
    if any(kw in combined for kw in ["what", "how", "tell", "about", "service", "offer"]):
        return "inquiry"
    
    return "greeting"


@router.get("/{client_id}/leads/followup")
async def get_followup_leads(
    client_id: str,
    limit: int = Query(50, ge=1, le=100),
    _: dict = Depends(verify_client_access),
):
    """
    Get leads who have received followup messages.
    
    Returns leads where the agent has sent followup messages to re-engage them.
    """
    conv_store = get_conversation_store()
    
    try:
        r = conv_store._get_redis()
        
        pattern = f"conversation:{client_id}:*"
        keys = r.keys(pattern)
        
        followup_leads = []
        
        for key in keys:
            try:
                data = r.get(key)
                if not data:
                    continue
                
                conv = json.loads(data)
                
                # Check if this conversation has followups
                followup_count = conv.get("followup_count", 0)
                has_followup_messages = any(
                    msg.get("is_followup", False) for msg in conv.get("messages", [])
                )
                
                if followup_count == 0 and not has_followup_messages:
                    continue
                
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
                
                messages = conv.get("messages", [])
                last_message = messages[-1] if messages else {}
                
                followup_leads.append({
                    "customer_id": customer_id,
                    "username": username or f"user_{customer_id[-6:]}",
                    "name": name or "Unknown",
                    "followup_count": followup_count,
                    "last_followup_at": conv.get("last_followup_at", ""),
                    "last_interaction": conv.get("last_interaction", ""),
                    "message_count": len(messages),
                    "last_message": last_message.get("content", "")[:100],
                    "status": "Followup Sent",
                })
            
            except Exception as e:
                logger.warning("followup_lead_parse_error", key=key, error=str(e))
                continue
        
        # Sort by last followup (most recent first)
        followup_leads.sort(
            key=lambda x: x.get("last_followup_at", "") or x.get("last_interaction", ""),
            reverse=True
        )
        
        return {
            "leads": followup_leads[:limit],
            "total": len(followup_leads),
        }
    
    except Exception as e:
        logger.error("followup_leads_fetch_failed", client_id=client_id, error=str(e))
        return {
            "leads": [],
            "total": 0,
        }


@router.get("/{client_id}/leads/booking")
async def get_booking_leads(
    client_id: str,
    limit: int = Query(50, ge=1, le=100),
    _: dict = Depends(verify_client_access),
):
    """
    Get leads who are at booking stage or have booked meetings.
    
    Returns leads who showed booking intent or completed a booking.
    """
    conv_store = get_conversation_store()
    
    try:
        r = conv_store._get_redis()
        
        pattern = f"conversation:{client_id}:*"
        keys = r.keys(pattern)
        
        booking_leads = []
        
        for key in keys:
            try:
                data = r.get(key)
                if not data:
                    continue
                
                conv = json.loads(data)
                messages = conv.get("messages", [])
                
                # Detect conversation stage
                stage = _detect_conversation_stage(messages)
                
                if stage not in ["booking", "post_booking"]:
                    continue
                
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
                
                last_message = messages[-1] if messages else {}
                
                booking_leads.append({
                    "customer_id": customer_id,
                    "username": username or f"user_{customer_id[-6:]}",
                    "name": name or "Unknown",
                    "stage": stage,
                    "last_interaction": conv.get("last_interaction", ""),
                    "message_count": len(messages),
                    "last_message": last_message.get("content", "")[:100],
                    "status": "Meeting Booked" if stage == "post_booking" else "Booking Intent",
                })
            
            except Exception as e:
                logger.warning("booking_lead_parse_error", key=key, error=str(e))
                continue
        
        # Sort by last interaction (most recent first)
        booking_leads.sort(
            key=lambda x: x.get("last_interaction", ""),
            reverse=True
        )
        
        return {
            "leads": booking_leads[:limit],
            "total": len(booking_leads),
        }
    
    except Exception as e:
        logger.error("booking_leads_fetch_failed", client_id=client_id, error=str(e))
        return {
            "leads": [],
            "total": 0,
        }


@router.get("/{client_id}/leads/{customer_id}/conversation")
async def get_lead_conversation(
    client_id: str,
    customer_id: str,
    _: dict = Depends(verify_client_access),
):
    """
    Get full conversation history for a specific lead.
    
    Returns all messages between the customer and the agent.
    """
    conv_store = get_conversation_store()
    
    try:
        r = conv_store._get_redis()
        
        # Get conversation
        conv_key = f"conversation:{client_id}:{customer_id}"
        conv_data = r.get(conv_key)
        
        if not conv_data:
            return {
                "customer_id": customer_id,
                "username": "",
                "name": "",
                "messages": [],
                "message_count": 0,
            }
        
        conv = json.loads(conv_data)
        
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
        
        messages = conv.get("messages", [])
        
        return {
            "customer_id": customer_id,
            "username": username or f"user_{customer_id[-6:]}",
            "name": name or "Unknown",
            "messages": messages,
            "message_count": len(messages),
            "last_interaction": conv.get("last_interaction", ""),
            "followup_count": conv.get("followup_count", 0),
            "stage": _detect_conversation_stage(messages),
        }
    
    except Exception as e:
        logger.error("conversation_fetch_failed", client_id=client_id, customer_id=customer_id, error=str(e))
        return {
            "customer_id": customer_id,
            "username": "",
            "name": "",
            "messages": [],
            "message_count": 0,
        }


@router.get("/{client_id}/leads")
async def get_all_leads(
    client_id: str,
    limit: int = Query(50, ge=1, le=100),
    offset: int = 0,
    search: str = None,
    status: str = None,
    _: dict = Depends(verify_client_access),
):
    """
    Get all leads for a client with filtering options.
    """
    conv_store = get_conversation_store()
    
    try:
        r = conv_store._get_redis()
        
        # Get all conversations for this client
        pattern = f"conversation:{client_id}:*"
        keys = r.keys(pattern)
        
        leads = []
        
        for key in keys:
            try:
                data = r.get(key)
                if not data:
                    continue
                
                conv = json.loads(data)
                customer_id = conv.get("customer_id", "")
                
                # Filter by search
                if search:
                    # Need metadata for name search
                    meta_key = f"customer:{client_id}:{customer_id}"
                    meta_data = r.get(meta_key)
                    
                    matches = False
                    if meta_data:
                        try:
                            meta = json.loads(meta_data)
                            name = meta.get("name", "").lower()
                            username = meta.get("username", "").lower()
                            if search.lower() in name or search.lower() in username:
                                matches = True
                        except:
                            pass
                    
                    if not matches:
                        continue
                        
                # Filter by status (stage)
                messages = conv.get("messages", [])
                stage = _detect_conversation_stage(messages)
                
                if status and status != "all":
                    if status == "qualified" and stage not in ["booking", "post_booking"]:
                        continue
                    if status == "unqualified" and stage in ["booking", "post_booking"]:
                        continue
                
                # Standard metadata fetch
                meta_key = f"customer:{client_id}:{customer_id}"
                meta_data = r.get(meta_key)
                
                username = ""
                name = ""
                profile_pic = ""
                if meta_data:
                    try:
                        meta = json.loads(meta_data)
                        username = meta.get("username", "")
                        name = meta.get("name", "")
                        profile_pic = meta.get("profile_pic", "")
                    except:
                        pass
                
                last_message = messages[-1] if messages else {}
                
                leads.append({
                    "id": customer_id,
                    "customer_id": customer_id,
                    "username": username or f"user_{customer_id[-6:]}",
                    "name": name or "Unknown",
                    "profile_pic": profile_pic,
                    "status": stage, # Map to frontend statuses
                    "last_interaction": conv.get("last_interaction", ""),
                    "message_count": len(messages),
                    "last_message": last_message.get("content", "")[:50],
                    "source": "Instagram",
                    "lead_type": "organic" # Mock or derive
                })
            
            except Exception:
                continue
        
        # Sort by last interaction
        leads.sort(
            key=lambda x: x.get("last_interaction", ""),
            reverse=True
        )
        
        # Slice for pagination
        paginated = leads[offset : offset + limit]
        
        return {
            "leads": paginated,
            "total": len(leads),
            "offset": offset,
            "limit": limit
        }
    
    except Exception as e:
        logger.error("leads_fetch_failed", client_id=client_id, error=str(e))
        return {
            "leads": [],
            "total": 0
        }
