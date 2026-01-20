"""
Leads endpoints.
Provides lead management and conversation history.
"""

import json
from fastapi import APIRouter, Query, Depends

from src.core.conversation_store import get_conversation_store
from src.api.deps import get_current_client, ClientSession
from src.api.errors import APIError, ErrorCodes
from src.utils import get_logger

logger = get_logger("api.leads")

router = APIRouter(prefix="/api/clients", tags=["leads"])


def _detect_conversation_stage(messages: list) -> str:
    """Detect the conversation stage based on message content."""
    if not messages:
        return "unclear"
    
    recent_texts = []
    for msg in messages[-5:]:
        content = msg.get("content", "").lower()
        recent_texts.append(content)
    
    combined = " ".join(recent_texts)
    
    booking_keywords = ["book", "slot", "payment", "confirm", "schedule", "appointment", "calendar"]
    payment_keywords = ["paid", "payment", "upi", "razorpay", "phonepe", "paytm", "gpay"]
    
    has_booking = any(kw in combined for kw in booking_keywords)
    has_payment = any(kw in combined for kw in payment_keywords)
    
    if has_payment:
        return "post_booking"
    if has_booking:
        return "booking"
    
    if any(kw in combined for kw in ["price", "cost", "fee", "charge", "₹", "rs", "rupee"]):
        return "pricing"
    
    if any(kw in combined for kw in ["what", "how", "tell", "about", "service", "offer"]):
        return "inquiry"
    
    return "greeting"


@router.get("/{client_id}/leads")
async def get_all_leads(
    client_id: str,
    limit: int = Query(50, ge=1, le=100),
    offset: int = Query(0, ge=0),
    search: str = Query(None),
    status: str = Query(None),
    client: ClientSession = Depends(get_current_client)
):
    """
    Get all leads for a client with filtering options.
    
    - **limit**: Maximum number of leads to return
    - **offset**: Pagination offset
    - **search**: Search by name or username
    - **status**: Filter by status (qualified, unqualified, all)
    """
    # Verify ownership
    if client.client_id != client_id:
        raise APIError(ErrorCodes.ACCESS_DENIED, "Access denied", 403)
    
    conv_store = get_conversation_store()
    
    try:
        r = conv_store._get_redis()
        
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
                
                # Get metadata
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
                
                # Search filter
                if search:
                    search_lower = search.lower()
                    if search_lower not in name.lower() and search_lower not in username.lower():
                        continue
                
                messages = conv.get("messages", [])
                stage = _detect_conversation_stage(messages)
                
                # Status filter
                if status and status != "all":
                    if status == "qualified" and stage not in ["booking", "post_booking"]:
                        continue
                    if status == "unqualified" and stage in ["booking", "post_booking"]:
                        continue
                
                last_message = messages[-1] if messages else {}
                
                leads.append({
                    "id": customer_id,
                    "customer_id": customer_id,
                    "username": username or f"user_{customer_id[-6:]}",
                    "name": name or "Unknown",
                    "profile_pic": profile_pic,
                    "status": stage,
                    "last_interaction": conv.get("last_interaction", ""),
                    "message_count": len(messages),
                    "last_message": last_message.get("content", "")[:50],
                    "source": "Instagram",
                    "lead_type": "organic"
                })
            
            except Exception:
                continue
        
        # Sort by last interaction
        leads.sort(key=lambda x: x.get("last_interaction", ""), reverse=True)
        
        # Paginate
        paginated = leads[offset:offset + limit]
        
        return {
            "leads": paginated,
            "total": len(leads),
            "offset": offset,
            "limit": limit
        }
    
    except Exception as e:
        logger.error("leads_fetch_failed", client_id=client_id, error=str(e))
        return {"leads": [], "total": 0, "offset": offset, "limit": limit}


@router.get("/{client_id}/leads/followup")
async def get_followup_leads(
    client_id: str,
    limit: int = Query(50, ge=1, le=100),
    client: ClientSession = Depends(get_current_client)
):
    """Get leads who have received followup messages."""
    if client.client_id != client_id:
        raise APIError(ErrorCodes.ACCESS_DENIED, "Access denied", 403)
    
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
                followup_count = conv.get("followup_count", 0)
                has_followup = any(msg.get("is_followup", False) for msg in conv.get("messages", []))
                
                if followup_count == 0 and not has_followup:
                    continue
                
                customer_id = conv.get("customer_id", "")
                
                # Get metadata
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
        
        followup_leads.sort(
            key=lambda x: x.get("last_followup_at", "") or x.get("last_interaction", ""),
            reverse=True
        )
        
        return {"leads": followup_leads[:limit], "total": len(followup_leads)}
    
    except Exception as e:
        logger.error("followup_leads_fetch_failed", client_id=client_id, error=str(e))
        return {"leads": [], "total": 0}


@router.get("/{client_id}/leads/booking")
async def get_booking_leads(
    client_id: str,
    limit: int = Query(50, ge=1, le=100),
    client: ClientSession = Depends(get_current_client)
):
    """Get leads who are at booking stage or have booked meetings."""
    if client.client_id != client_id:
        raise APIError(ErrorCodes.ACCESS_DENIED, "Access denied", 403)
    
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
                stage = _detect_conversation_stage(messages)
                
                if stage not in ["booking", "post_booking"]:
                    continue
                
                customer_id = conv.get("customer_id", "")
                
                # Get metadata
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
        
        booking_leads.sort(key=lambda x: x.get("last_interaction", ""), reverse=True)
        
        return {"leads": booking_leads[:limit], "total": len(booking_leads)}
    
    except Exception as e:
        logger.error("booking_leads_fetch_failed", client_id=client_id, error=str(e))
        return {"leads": [], "total": 0}


@router.get("/{client_id}/leads/{customer_id}/conversation")
async def get_lead_conversation(
    client_id: str,
    customer_id: str,
    client: ClientSession = Depends(get_current_client)
):
    """Get full conversation history for a specific lead."""
    if client.client_id != client_id:
        raise APIError(ErrorCodes.ACCESS_DENIED, "Access denied", 403)
    
    conv_store = get_conversation_store()
    
    try:
        r = conv_store._get_redis()
        
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
        
        # Get metadata
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
