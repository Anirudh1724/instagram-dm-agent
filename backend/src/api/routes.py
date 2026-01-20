"""
API Routes - Health check, testing, and utility endpoints.
"""

from fastapi import APIRouter
from pydantic import BaseModel
from src.core import process_message, get_memory
from src.utils import get_logger

logger = get_logger("routes")

router = APIRouter(tags=["api"])


class TestMessageRequest(BaseModel):
    """Request body for test message endpoint."""
    user_id: str
    message: str


class TestMessageResponse(BaseModel):
    """Response from test message endpoint."""
    user_id: str
    message: str
    response: str
    intent: str
    emotion: str
    lead_score: int
    planned_action: str
    actions_taken: list[str]


@router.get("/")
async def root():
    """Root endpoint - welcome message."""
    return {
        "service": "Instagram DM Agent",
        "status": "running",
        "docs": "/docs",
        "health": "/health",
        "test": "POST /test-message",
    }


@router.get("/health")
async def health_check():
    """Health check endpoint."""
    return {
        "status": "healthy",
        "service": "instagram-dm-agent",
        "version": "1.0.0",
    }


@router.post("/test-message", response_model=TestMessageResponse)
async def test_message(request: TestMessageRequest):
    """
    Test endpoint for development.
    Sends a message through the full agent pipeline without Instagram.
    """
    logger.info("test_message_received", user_id=request.user_id)
    
    # Process through the pipeline
    result = await process_message(request.user_id, request.message)
    
    return TestMessageResponse(
        user_id=request.user_id,
        message=request.message,
        response=result.get("response_text", ""),
        intent=result.get("intent", "unknown"),
        emotion=result.get("emotion", "unknown"),
        lead_score=result.get("lead_score", 0),
        planned_action=result.get("planned_action", ""),
        actions_taken=result.get("actions_taken", []),
    )


@router.get("/conversations/{user_id}")
async def get_conversation_history(user_id: str):
    """Get conversation history for a user."""
    memory = get_memory()
    history = memory.get_history(user_id)
    metadata = memory.get_metadata(user_id)
    
    return {
        "user_id": user_id,
        "history": history,
        "metadata": metadata,
    }


@router.delete("/conversations/{user_id}")
async def clear_conversation(user_id: str):
    """Clear conversation history for a user (for testing)."""
    memory = get_memory()
    memory.clear_history(user_id)
    
    return {
        "status": "cleared",
        "user_id": user_id,
    }


# ============================================
# DEMO ENDPOINTS - For client demonstrations
# ============================================

class DemoMessageRequest(BaseModel):
    """Request for demo chat using YAML client config."""
    message: str
    client_config: str = "astrologer_maya"  # Name of YAML file (without .yaml)
    user_id: str = "demo_user"


class DemoMessageResponse(BaseModel):
    """Response from demo chat."""
    response: str
    business_name: str
    industry: str
    greeting_style: str


@router.get("/demo/clients")
async def list_demo_clients():
    """List all available client configurations."""
    from src.config.client_config import list_available_clients
    
    clients = list_available_clients()
    return {
        "clients": clients,
        "usage": "POST /demo/chat with client_config name (e.g., 'astrologer_maya')"
    }


@router.post("/demo/chat", response_model=DemoMessageResponse)
async def demo_chat(request: DemoMessageRequest):
    """
    Demo endpoint for client demonstrations using YAML configs.
    
    Each client has a YAML config file in /clients/ with their:
    - Greeting style (Namaste, Hello, Hey, etc.)
    - Services and pricing
    - Personality and tone
    - Custom prompts
    
    Example:
    - Astrologer: {"message": "Hi", "client_config": "astrologer_maya"}
    - Real Estate: {"message": "Hi", "client_config": "realestate_raj"}
    - Fashion: {"message": "Hi", "client_config": "fashion_studio"}
    """
    from src.config.client_config import load_config_by_name, set_current_config, get_current_config
    
    # Load the client config
    config = load_config_by_name(request.client_config)
    
    if not config:
        return DemoMessageResponse(
            response=f"Client config '{request.client_config}' not found. Use /demo/clients to see available configs.",
            business_name="Error",
            industry="none",
            greeting_style=""
        )
    
    # Set as current config for this request
    original_config = get_current_config()
    set_current_config(config)
    
    try:
        # Process message through fast pipeline
        result = await process_message(request.user_id, request.message)
        
        return DemoMessageResponse(
            response=result.get("response_text", "Hello! How can I help?"),
            business_name=config.business_name,
            industry=config.industry,
            greeting_style=config.greeting_style,
        )
    finally:
        # Restore original config
        if original_config:
            set_current_config(original_config)


# ============================================
# BLOCK/UNBLOCK CUSTOMER ENDPOINTS
# ============================================

class BlockCustomerRequest(BaseModel):
    """Request to block/unblock a customer."""
    customer_id: str
    blocked: bool


@router.post("/api/clients/{client_id}/customers/{customer_id}/block")
async def block_customer(client_id: str, customer_id: str):
    """
    Block a customer - agent will not respond to their messages.
    Client handles the conversation personally.
    """
    from src.core.conversation_store import get_conversation_store
    
    conv_store = get_conversation_store()
    
    # Update customer metadata with blocked status
    conv_store.update_customer_metadata(
        client_id=client_id,
        customer_id=customer_id,
        agent_blocked=True,
        blocked_at=__import__('datetime').datetime.utcnow().isoformat(),
    )
    
    logger.info("customer_blocked", client_id=client_id, customer_id=customer_id)
    
    return {
        "status": "blocked",
        "client_id": client_id,
        "customer_id": customer_id,
        "message": "Agent will not respond to this customer. You can handle the conversation manually.",
    }


@router.post("/api/clients/{client_id}/customers/{customer_id}/unblock")
async def unblock_customer(client_id: str, customer_id: str):
    """
    Unblock a customer - agent will resume responding to their messages.
    """
    from src.core.conversation_store import get_conversation_store
    
    conv_store = get_conversation_store()
    
    # Update customer metadata to remove blocked status
    conv_store.update_customer_metadata(
        client_id=client_id,
        customer_id=customer_id,
        agent_blocked=False,
        unblocked_at=__import__('datetime').datetime.utcnow().isoformat(),
    )
    
    logger.info("customer_unblocked", client_id=client_id, customer_id=customer_id)
    
    return {
        "status": "unblocked",
        "client_id": client_id,
        "customer_id": customer_id,
        "message": "Agent will now respond to this customer.",
    }


@router.get("/api/clients/{client_id}/customers/{customer_id}/status")
async def get_customer_status(client_id: str, customer_id: str):
    """
    Get the block status of a customer.
    """
    from src.core.conversation_store import get_conversation_store
    
    conv_store = get_conversation_store()
    
    # Get customer metadata
    metadata = conv_store.get_customer_metadata(client_id, customer_id)
    
    return {
        "client_id": client_id,
        "customer_id": customer_id,
        "agent_blocked": metadata.get("agent_blocked", False),
        "blocked_at": metadata.get("blocked_at"),
        "unblocked_at": metadata.get("unblocked_at"),
        "lead_score": metadata.get("lead_score"),
        "lead_status": metadata.get("lead_status"),
        "booking_completed": metadata.get("booking_completed", False),
        "booking_time": metadata.get("booking_time"),
        "booking_service": metadata.get("booking_service"),
    }


# ============================================
# BOOKINGS ENDPOINTS
# ============================================

@router.get("/api/clients/{client_id}/bookings")
async def get_client_bookings(client_id: str, limit: int = 50):
    """
    Get all bookings for a client.
    
    Returns list of bookings with customer info, time, and service.
    """
    from src.config.redis_config import get_redis_store
    import json
    
    try:
        r = get_redis_store()._get_redis()
        
        bookings_key = f"bookings:{client_id}"
        raw_bookings = r.lrange(bookings_key, 0, limit - 1)
        
        bookings = []
        for raw in raw_bookings:
            try:
                raw_str = raw.decode() if isinstance(raw, bytes) else raw
                booking = json.loads(raw_str)
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
        logger.error("get_bookings_failed", client_id=client_id, error=str(e))
        return {"client_id": client_id, "count": 0, "bookings": [], "error": str(e)}


@router.get("/api/clients/{client_id}/bookings/{booking_id}")
async def get_booking_detail(client_id: str, booking_id: str):
    """
    Get detailed booking info including the pre-call brief.
    """
    from src.config.redis_config import get_redis_store
    from fastapi import HTTPException
    import json
    
    try:
        r = get_redis_store()._get_redis()
        
        booking_key = f"booking:{booking_id}"
        raw = r.get(booking_key)
        
        if not raw:
            raise HTTPException(status_code=404, detail="Booking not found")
        
        raw_str = raw.decode() if isinstance(raw, bytes) else raw
        booking = json.loads(raw_str)
        
        return booking
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error("get_booking_detail_failed", error=str(e))
        raise HTTPException(status_code=500, detail=str(e))
