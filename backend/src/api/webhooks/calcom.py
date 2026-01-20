"""
Cal.com Booking Webhook Handler.
Receives booking notifications and generates pre-call briefs.
"""

import json
import hashlib
from datetime import datetime, timedelta
from fastapi import APIRouter, Request, HTTPException
from pydantic import BaseModel

from src.core.conversation_store import get_conversation_store
from src.config.redis_config import get_redis_store
from src.utils import get_logger

logger = get_logger("api.webhooks.calcom")

router = APIRouter(prefix="/webhook", tags=["booking"])


class BookingPayload(BaseModel):
    """Cal.com webhook payload structure."""
    triggerEvent: str
    createdAt: str
    payload: dict


@router.post("/booking")
async def receive_booking_webhook(request: Request):
    """
    Receive booking notifications from Cal.com.
    
    When a customer books a consultation, Cal.com sends a webhook.
    We extract the customer reference and generate a pre-call brief.
    """
    try:
        data = await request.json()
        logger.info("booking_webhook_received", event=data.get("triggerEvent"))
        
        trigger_event = data.get("triggerEvent", "")
        payload = data.get("payload", {})
        
        # Only process new bookings
        if trigger_event not in ["BOOKING_CREATED", "BOOKING_CONFIRMED"]:
            return {"status": "ok", "message": f"Event {trigger_event} ignored"}
        
        # Extract attendee info
        attendees = payload.get("attendees", [])
        if not attendees:
            return {"status": "ok", "message": "No attendees found"}
        
        attendee = attendees[0]
        customer_name = attendee.get("name", "Unknown")
        customer_email = attendee.get("email", "")
        customer_phone = attendee.get("phone", "")
        
        # Get customer reference
        responses = payload.get("responses", {})
        metadata = payload.get("metadata", {})
        
        customer_ref = (
            responses.get("ref", {}).get("value") or
            responses.get("customer_ref", {}).get("value") or
            metadata.get("ref") or
            metadata.get("customer_ref") or
            ""
        )
        
        # Fallback: lookup by email
        client_id_from_email = ""
        if not customer_ref and customer_email:
            try:
                from src.utils.email_utils import lookup_customer_by_email
                lookup_result = lookup_customer_by_email(customer_email)
                if lookup_result:
                    customer_ref = lookup_result["customer_id"]
                    client_id_from_email = lookup_result["client_id"]
            except Exception as e:
                logger.warning("email_lookup_failed", error=str(e))
        
        # Extract booking details
        event_title = payload.get("title", "Consultation")
        start_time = payload.get("startTime", "")
        end_time = payload.get("endTime", "")
        
        logger.info("booking_details", customer_name=customer_name, customer_ref=customer_ref)
        
        # Generate brief
        brief = await _generate_precall_brief(
            customer_ref, customer_name, customer_email, 
            customer_phone, event_title, start_time
        )
        
        # Determine client_id
        client_id = client_id_from_email
        if not client_id and customer_ref:
            client_id = await _find_client_for_customer(customer_ref)
        
        # Store booking
        _store_booking_record(
            customer_ref, customer_name, customer_email, customer_phone,
            event_title, start_time, end_time, brief, client_id
        )
        
        return {
            "status": "ok",
            "message": "Booking processed",
            "customer_ref": customer_ref,
            "client_id": client_id,
        }
        
    except Exception as e:
        logger.error("booking_webhook_error", error=str(e))
        raise HTTPException(status_code=500, detail=str(e))


async def _generate_precall_brief(
    customer_ref: str,
    customer_name: str,
    customer_email: str,
    customer_phone: str,
    event_title: str,
    start_time: str,
) -> str:
    """Generate a pre-call brief from conversation history."""
    if not customer_ref:
        return f"""
📞 UPCOMING CONSULTATION

👤 Customer: {customer_name}
📧 Email: {customer_email}
📱 Phone: {customer_phone}
📅 Time: {start_time}
📋 Service: {event_title}

⚠️ Note: Could not link to Instagram DM history.
"""
    
    conv_store = get_conversation_store()
    
    try:
        r = conv_store._get_redis()
        pattern = f"conversation:*:{customer_ref}"
        keys = r.keys(pattern)
        
        conversation_history = []
        client_id = None
        
        if keys:
            key = keys[0]
            data = r.get(key)
            if data:
                conv = json.loads(data)
                conversation_history = conv.get("messages", [])
                client_id = conv.get("client_id")
        
        # Get customer metadata
        customer_metadata = {}
        if client_id:
            customer_metadata = conv_store.get_customer_metadata(client_id, customer_ref)
        
        instagram_username = customer_metadata.get("username", "Unknown")
        lead_score = customer_metadata.get("lead_score", "N/A")
        lead_status = customer_metadata.get("lead_status", "warm")
        
        # Format conversation summary
        conv_summary = ""
        if conversation_history:
            recent_msgs = conversation_history[-10:]
            for msg in recent_msgs:
                role = "Customer" if msg.get("role") == "customer" else "Agent"
                content = msg.get("content", "")[:100]
                conv_summary += f"  {role}: {content}\n"
        else:
            conv_summary = "  No DM conversation found.\n"
        
        # Parse time
        try:
            dt = datetime.fromisoformat(start_time.replace("Z", "+00:00"))
            formatted_time = dt.strftime("%B %d, %Y at %I:%M %p")
        except:
            formatted_time = start_time
        
        return f"""
📞 PRE-CALL BRIEF
{'='*45}

👤 CUSTOMER INFO
   Name: {customer_name}
   Instagram: @{instagram_username}
   Email: {customer_email}
   Phone: {customer_phone}

📅 BOOKING DETAILS
   Service: {event_title}
   Time: {formatted_time}

🎯 LEAD STATUS
   Score: {lead_score}
   Status: {lead_status.upper()}

💬 RECENT CONVERSATION:
{conv_summary}
{'='*45}
"""
        
    except Exception as e:
        logger.error("brief_generation_failed", error=str(e))
        return f"Error generating brief: {str(e)}"


async def _find_client_for_customer(customer_ref: str) -> str:
    """Find the client_id for a customer reference."""
    try:
        r = get_redis_store()._get_redis()
        pattern = f"conversation:*:{customer_ref}"
        keys = r.keys(pattern)
        if keys:
            key_parts = keys[0].decode() if isinstance(keys[0], bytes) else keys[0]
            return key_parts.split(":")[1]
    except:
        pass
    return ""


def _store_booking_record(
    customer_ref: str,
    customer_name: str,
    customer_email: str,
    customer_phone: str,
    event_title: str,
    start_time: str,
    end_time: str,
    brief: str,
    client_id: str,
) -> None:
    """Store booking record in Redis."""
    try:
        r = get_redis_store()._get_redis()
        
        booking_id = hashlib.md5(f"{customer_ref}:{start_time}".encode()).hexdigest()[:12]
        
        booking_data = {
            "booking_id": booking_id,
            "customer_ref": customer_ref,
            "customer_name": customer_name,
            "customer_email": customer_email,
            "customer_phone": customer_phone,
            "event_title": event_title,
            "start_time": start_time,
            "end_time": end_time,
            "brief": brief,
            "client_id": client_id,
            "status": "confirmed",
            "created_at": datetime.utcnow().isoformat(),
        }
        
        # Store globally
        r.setex(f"booking:{booking_id}", timedelta(days=90), json.dumps(booking_data))
        
        # Store in client's list
        if client_id:
            r.lpush(f"bookings:{client_id}", json.dumps(booking_data))
            r.expire(f"bookings:{client_id}", timedelta(days=90))
        
        # Update customer metadata
        if customer_ref and client_id:
            conv_store = get_conversation_store()
            conv_store.update_customer_metadata(
                client_id=client_id,
                customer_id=customer_ref,
                booking_completed=True,
                booking_time=start_time,
            )
        
        logger.info("booking_stored", booking_id=booking_id)
        
    except Exception as e:
        logger.error("booking_store_failed", error=str(e))


# Booking list endpoints
@router.get("/bookings/{client_id}")
async def get_client_bookings(client_id: str, limit: int = 50):
    """Get all bookings for a client."""
    try:
        r = get_redis_store()._get_redis()
        raw_bookings = r.lrange(f"bookings:{client_id}", 0, limit - 1)
        
        bookings = []
        for raw in raw_bookings:
            try:
                booking = json.loads(raw)
                if "brief" in booking:
                    booking["has_brief"] = True
                    del booking["brief"]
                bookings.append(booking)
            except:
                continue
        
        return {"client_id": client_id, "count": len(bookings), "bookings": bookings}
        
    except Exception as e:
        logger.error("get_bookings_failed", error=str(e))
        return {"client_id": client_id, "count": 0, "bookings": []}


@router.get("/bookings/{client_id}/{booking_id}")
async def get_booking_detail(client_id: str, booking_id: str):
    """Get detailed booking info including brief."""
    try:
        r = get_redis_store()._get_redis()
        raw = r.get(f"booking:{booking_id}")
        
        if not raw:
            raise HTTPException(status_code=404, detail="Booking not found")
        
        return json.loads(raw)
        
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
