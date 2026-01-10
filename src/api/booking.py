"""
Cal.com Booking Webhook Handler.
Receives booking notifications and generates pre-call briefs.
"""

import json
from datetime import datetime
from fastapi import APIRouter, Request, HTTPException
from pydantic import BaseModel
from typing import Optional
from src.config import get_settings
from src.core.conversation_store import get_conversation_store
from src.utils import get_logger

logger = get_logger("booking")

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
    We extract the customer reference (Instagram ID) and generate
    a pre-call brief from their conversation history.
    """
    try:
        data = await request.json()
        logger.info("booking_webhook_received", event=data.get("triggerEvent"))
        
        # Extract booking details
        trigger_event = data.get("triggerEvent", "")
        payload = data.get("payload", {})
        
        # Only process new bookings
        if trigger_event not in ["BOOKING_CREATED", "BOOKING_CONFIRMED"]:
            logger.debug("booking_event_ignored", event=trigger_event)
            return {"status": "ok", "message": f"Event {trigger_event} ignored"}
        
        # Extract attendee info
        attendees = payload.get("attendees", [])
        if not attendees:
            logger.warning("booking_no_attendees")
            return {"status": "ok", "message": "No attendees found"}
        
        attendee = attendees[0]
        customer_name = attendee.get("name", "Unknown")
        customer_email = attendee.get("email", "")
        customer_phone = attendee.get("phone", "")
        
        # Extract ref (Instagram customer ID) from metadata or responses
        responses = payload.get("responses", {})
        metadata = payload.get("metadata", {})
        
        # Try to get customer_ref from various sources
        customer_ref = (
            responses.get("ref", {}).get("value") or
            responses.get("customer_ref", {}).get("value") or
            metadata.get("ref") or
            metadata.get("customer_ref") or
            ""
        )
        
        # FALLBACK: If no ref, try to find customer by email
        # This handles cases where customer came through Instamojo → Cal.com
        client_id_from_email = ""
        if not customer_ref and customer_email:
            try:
                from src.utils.email_utils import lookup_customer_by_email
                
                lookup_result = lookup_customer_by_email(customer_email)
                if lookup_result:
                    customer_ref = lookup_result["customer_id"]
                    client_id_from_email = lookup_result["client_id"]
                    logger.info(
                        "booking_linked_by_email",
                        email=customer_email,
                        customer_ref=customer_ref[:8] + "...",
                        client_id=client_id_from_email,
                    )
            except Exception as e:
                logger.warning("email_lookup_failed", error=str(e))
        
        # Extract booking details
        event_title = payload.get("title", "Consultation")
        start_time = payload.get("startTime", "")
        end_time = payload.get("endTime", "")
        
        # Get organizer (client) info
        organizer = payload.get("organizer", {})
        client_email_organizer = organizer.get("email", "")
        
        logger.info(
            "booking_details",
            customer_name=customer_name,
            customer_ref=customer_ref,
            customer_email=customer_email,
            event=event_title,
            start_time=start_time,
            matched_by="ref" if not client_id_from_email else "email",
        )
        
        # Generate pre-call brief if we have a customer reference
        brief = None
        if customer_ref:
            brief = await generate_precall_brief(
                customer_ref=customer_ref,
                customer_name=customer_name,
                customer_email=customer_email,
                customer_phone=customer_phone,
                event_title=event_title,
                start_time=start_time,
            )
        else:
            logger.warning("booking_no_customer_ref", message="Cannot link to DM history - no ref and email not found")
            brief = f"""
📞 UPCOMING CONSULTATION

👤 Customer: {customer_name}
📧 Email: {customer_email}
📱 Phone: {customer_phone}
📅 Time: {start_time}
📋 Service: {event_title}

⚠️ Note: Could not link to Instagram DM history.
No customer reference (ref) found in booking.
"""
        
        # Log the brief (in production, send via email/WhatsApp)
        logger.info("precall_brief_generated", customer=customer_name)
        print("\n" + "="*50)
        print("PRE-CALL BRIEF")
        print("="*50)
        print(brief)
        print("="*50 + "\n")
        
        # Determine client_id from conversation lookup
        client_id_for_booking = ""
        if customer_ref:
            try:
                from src.config.redis_config import get_redis_store
                r = get_redis_store()._get_redis()
                pattern = f"conversation:*:{customer_ref}"
                keys = r.keys(pattern)
                if keys:
                    # Extract client_id from key format: conversation:{client_id}:{customer_id}
                    key_parts = keys[0].decode() if isinstance(keys[0], bytes) else keys[0]
                    client_id_for_booking = key_parts.split(":")[1]
            except:
                pass
        
        # Store the booking in Redis for dashboard display
        store_booking_record(
            customer_ref=customer_ref,
            customer_name=customer_name,
            customer_email=customer_email,
            customer_phone=customer_phone,
            event_title=event_title,
            start_time=start_time,
            end_time=end_time,
            brief=brief,
            client_id=client_id_for_booking,
        )
        
        return {
            "status": "ok",
            "message": "Booking processed",
            "customer_ref": customer_ref,
            "client_id": client_id_for_booking,
            "brief_generated": bool(brief),
        }
        
    except Exception as e:
        logger.error("booking_webhook_error", error=str(e))
        raise HTTPException(status_code=500, detail=str(e))


async def generate_precall_brief(
    customer_ref: str,
    customer_name: str,
    customer_email: str,
    customer_phone: str,
    event_title: str,
    start_time: str,
) -> str:
    """
    Generate a pre-call brief from conversation history.
    
    Looks up the customer's DM conversation and summarizes
    what was discussed to prepare the client for the call.
    """
    conv_store = get_conversation_store()
    
    # We need to find the client_id for this customer
    # For now, search across all conversations for this customer_ref
    # In production, you might want to store the client_id with the booking
    
    # Try to find conversation using customer_ref as customer_id
    # We'll search for any conversation key matching this customer
    try:
        r = conv_store._get_redis()
        pattern = f"conversation:*:{customer_ref}"
        keys = r.keys(pattern)
        
        conversation_history = []
        client_id = None
        
        if keys:
            # Get the first matching conversation
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
        
        # Format the brief
        instagram_username = customer_metadata.get("username", "Unknown")
        lead_score = customer_metadata.get("lead_score", "N/A")
        lead_status = customer_metadata.get("lead_status", "warm")
        
        # Format conversation summary
        conv_summary = ""
        if conversation_history:
            # Get last 10 messages for summary
            recent_msgs = conversation_history[-10:]
            for msg in recent_msgs:
                role = "Customer" if msg.get("role") == "customer" else "Agent"
                content = msg.get("content", "")[:100]  # Truncate long messages
                conv_summary += f"  {role}: {content}\n"
        else:
            conv_summary = "  No DM conversation found.\n"
        
        # Parse start time for better formatting
        try:
            dt = datetime.fromisoformat(start_time.replace("Z", "+00:00"))
            formatted_time = dt.strftime("%B %d, %Y at %I:%M %p")
        except:
            formatted_time = start_time
        
        brief = f"""
📞 UPCOMING CONSULTATION - PRE-CALL BRIEF
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
        return brief
        
    except Exception as e:
        logger.error("brief_generation_failed", error=str(e))
        return f"""
📞 UPCOMING CONSULTATION

👤 Customer: {customer_name}
📧 Email: {customer_email}
📅 Time: {start_time}
📋 Service: {event_title}

⚠️ Error generating detailed brief: {str(e)}
"""


def store_booking_record(
    customer_ref: str,
    customer_name: str,
    customer_email: str,
    customer_phone: str = "",
    event_title: str = "",
    start_time: str = "",
    end_time: str = "",
    brief: str = "",
    client_id: str = "",
) -> None:
    """Store booking record in Redis for dashboard display."""
    try:
        from src.config.redis_config import get_redis_store
        from datetime import timedelta
        
        r = get_redis_store()._get_redis()
        
        # Generate unique booking ID
        import hashlib
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
        
        # Store by booking ID (global)
        booking_key = f"booking:{booking_id}"
        r.setex(booking_key, timedelta(days=90), json.dumps(booking_data))
        
        # Also add to client's booking list (for dashboard)
        if client_id:
            client_bookings_key = f"bookings:{client_id}"
            r.lpush(client_bookings_key, json.dumps(booking_data))
            r.expire(client_bookings_key, timedelta(days=90))
        
        # Update customer metadata to mark as "booking_completed"
        if customer_ref and client_id:
            conv_store = get_conversation_store()
            conv_store.update_customer_metadata(
                client_id=client_id,
                customer_id=customer_ref,
                booking_completed=True,
                booking_time=start_time,
                booking_service=event_title,
            )
        
        logger.info(
            "booking_stored",
            booking_id=booking_id,
            customer_ref=customer_ref,
            customer_name=customer_name,
            start_time=start_time,
        )
        
    except Exception as e:
        logger.error("booking_store_failed", error=str(e))


# API to list bookings for a client
@router.get("/bookings/{client_id}")
async def get_client_bookings(client_id: str, limit: int = 50):
    """Get all bookings for a client."""
    try:
        from src.config.redis_config import get_redis_store
        
        r = get_redis_store()._get_redis()
        
        bookings_key = f"bookings:{client_id}"
        raw_bookings = r.lrange(bookings_key, 0, limit - 1)
        
        bookings = []
        for raw in raw_bookings:
            try:
                booking = json.loads(raw)
                # Don't include the full brief in the list (too long)
                if "brief" in booking:
                    booking["has_brief"] = True
                    del booking["brief"]
                bookings.append(booking)
            except:
                continue
        
        return {
            "client_id": client_id,
            "count": len(bookings),
            "bookings": bookings,
        }
        
    except Exception as e:
        logger.error("get_bookings_failed", error=str(e))
        return {"client_id": client_id, "count": 0, "bookings": [], "error": str(e)}


@router.get("/bookings/{client_id}/{booking_id}")
async def get_booking_detail(client_id: str, booking_id: str):
    """Get detailed booking info including the pre-call brief."""
    try:
        from src.config.redis_config import get_redis_store
        
        r = get_redis_store()._get_redis()
        
        booking_key = f"booking:{booking_id}"
        raw = r.get(booking_key)
        
        if not raw:
            raise HTTPException(status_code=404, detail="Booking not found")
        
        booking = json.loads(raw)
        
        return booking
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error("get_booking_detail_failed", error=str(e))
        raise HTTPException(status_code=500, detail=str(e))

