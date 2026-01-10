"""
Internal/demo endpoints for development and testing.
"""

from fastapi import APIRouter
from pydantic import BaseModel

from src.core import process_message, get_memory
from src.utils import get_logger

logger = get_logger("api.internal")

router = APIRouter(tags=["internal"])


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


class DemoMessageRequest(BaseModel):
    """Request for demo chat using YAML client config."""
    message: str
    client_config: str = "astrologer_maya"
    user_id: str = "demo_user"


@router.get("/")
async def root():
    """Root endpoint - redirect to login/dashboard."""
    from fastapi.responses import RedirectResponse
    return RedirectResponse(url="/login", status_code=302)


@router.get("/health")
async def health_check():
    """Health check endpoint."""
    return {
        "status": "healthy",
        "service": "Instagram DM Agent",
        "version": "1.0.0"
    }


@router.post("/test-message", response_model=TestMessageResponse)
async def test_message(request: TestMessageRequest):
    """
    Test endpoint for development.
    Sends a message through the full agent pipeline without Instagram.
    """
    result = await process_message(request.user_id, request.message)
    
    return TestMessageResponse(
        user_id=request.user_id,
        message=request.message,
        response=result.get("response_text", ""),
        intent=result.get("intent", "unknown"),
        emotion=result.get("emotion", "neutral"),
        lead_score=result.get("lead_score", 0),
        planned_action=result.get("planned_action", "none"),
        actions_taken=result.get("actions_taken", []),
    )


@router.get("/conversation/{user_id}")
async def get_conversation_history(user_id: str):
    """Get conversation history for a user."""
    memory = get_memory(user_id)
    return {
        "user_id": user_id,
        "history": memory.get("chat_history", [])
    }


@router.delete("/conversation/{user_id}")
async def clear_conversation(user_id: str):
    """Clear conversation history for a user."""
    memory = get_memory(user_id)
    memory["chat_history"] = []
    return {"status": "cleared", "user_id": user_id}


@router.get("/demo/clients")
async def list_demo_clients():
    """List available YAML client configurations."""
    import os
    import glob
    
    clients_dir = os.path.join(os.path.dirname(os.path.dirname(os.path.dirname(__file__))), "clients")
    
    if not os.path.exists(clients_dir):
        return {"clients": [], "message": "No clients directory found"}
    
    yaml_files = glob.glob(os.path.join(clients_dir, "*.yaml"))
    clients = [os.path.splitext(os.path.basename(f))[0] for f in yaml_files]
    
    return {"clients": clients, "count": len(clients)}


@router.post("/demo/chat")
async def demo_chat(request: DemoMessageRequest):
    """Demo endpoint for client demonstrations using YAML configs."""
    from src.config.client_config import load_client_config, set_current_config
    
    config = load_client_config(request.client_config)
    
    if not config:
        return {"error": f"Client config '{request.client_config}' not found"}
    
    set_current_config(config)
    
    result = await process_message(request.user_id, request.message)
    
    return {
        "response": result.get("response_text", ""),
        "business_name": config.business_name,
        "industry": config.industry,
        "greeting_style": config.greeting_style,
    }


# Block/Unblock customer endpoints
@router.post("/api/clients/{client_id}/leads/{customer_id}/block")
async def block_customer(client_id: str, customer_id: str):
    """Block a customer - agent will not respond to their messages."""
    from src.core.conversation_store import get_conversation_store
    
    conv_store = get_conversation_store()
    conv_store.update_customer_metadata(
        client_id=client_id,
        customer_id=customer_id,
        agent_blocked=True,
    )
    
    logger.info("customer_blocked", client_id=client_id, customer_id=customer_id)
    
    return {"status": "blocked", "client_id": client_id, "customer_id": customer_id}


@router.delete("/api/clients/{client_id}/leads/{customer_id}/block")
async def unblock_customer(client_id: str, customer_id: str):
    """Unblock a customer - agent will resume responding."""
    from src.core.conversation_store import get_conversation_store
    
    conv_store = get_conversation_store()
    conv_store.update_customer_metadata(
        client_id=client_id,
        customer_id=customer_id,
        agent_blocked=False,
    )
    
    logger.info("customer_unblocked", client_id=client_id, customer_id=customer_id)
    
    return {"status": "unblocked", "client_id": client_id, "customer_id": customer_id}


@router.get("/api/clients/{client_id}/leads/{customer_id}/status")
async def get_customer_status(client_id: str, customer_id: str):
    """Get the block status of a customer."""
    from src.core.conversation_store import get_conversation_store
    
    conv_store = get_conversation_store()
    metadata = conv_store.get_customer_metadata(client_id, customer_id)
    
    return {
        "client_id": client_id,
        "customer_id": customer_id,
        "blocked": metadata.get("agent_blocked", False),
        "lead_score": metadata.get("lead_score"),
        "lead_status": metadata.get("lead_status"),
    }
