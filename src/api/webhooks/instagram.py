"""
Instagram/Meta Webhook Handler.
Receives incoming DMs from Instagram.
"""

import hmac
import hashlib
from fastapi import APIRouter, Request, HTTPException, Query

from src.config import get_settings
from src.core import process_message
from src.utils import get_logger

logger = get_logger("api.webhooks.instagram")

router = APIRouter(prefix="/webhook", tags=["webhook"])


def _verify_signature(payload: bytes, signature: str) -> bool:
    """Verify the webhook signature from Meta."""
    settings = get_settings()
    
    if not settings.meta_app_secret:
        logger.warning("meta_app_secret_not_set")
        return True  # Skip validation in development
    
    expected = hmac.new(
        settings.meta_app_secret.encode(),
        payload,
        hashlib.sha256,
    ).hexdigest()
    
    return hmac.compare_digest(f"sha256={expected}", signature)


@router.get("")
async def verify_webhook(
    hub_mode: str = Query(None, alias="hub.mode"),
    hub_verify_token: str = Query(None, alias="hub.verify_token"),
    hub_challenge: str = Query(None, alias="hub.challenge"),
):
    """
    Webhook verification endpoint.
    Meta sends a GET request to verify the webhook URL.
    """
    settings = get_settings()
    
    if hub_mode == "subscribe" and hub_verify_token == settings.meta_verify_token:
        logger.info("webhook_verified")
        return int(hub_challenge)
    
    logger.warning("webhook_verification_failed")
    raise HTTPException(status_code=403, detail="Verification failed")


@router.post("")
async def receive_webhook(request: Request):
    """
    Receive incoming messages from Instagram.
    
    Meta sends a POST request with the message payload.
    Loads the correct client config based on the Instagram account receiving the message.
    """
    # Get raw body for signature verification
    body = await request.body()
    
    # Verify signature
    signature = request.headers.get("X-Hub-Signature-256", "")
    if not _verify_signature(body, signature):
        logger.warning("invalid_signature")
        raise HTTPException(status_code=403, detail="Invalid signature")
    
    # Parse the payload
    data = await request.json()
    logger.debug("webhook_received", data=data)
    
    try:
        # Extract message data from Instagram-specific format
        entry = data.get("entry", [{}])[0]
        messaging = entry.get("messaging", [{}])[0]
        
        sender_id = messaging.get("sender", {}).get("id", "")
        recipient_id = messaging.get("recipient", {}).get("id", "")
        message = messaging.get("message", {})
        text = message.get("text", "")
        
        # Check for echo messages
        is_echo = message.get("is_echo", False)
        if is_echo:
            logger.debug("echo_message_ignored", sender_id=sender_id)
            return {"status": "ok", "message": "Echo message ignored"}
        
        # Check for self-messages
        if sender_id == recipient_id:
            logger.debug("self_message_ignored", sender_id=sender_id)
            return {"status": "ok", "message": "Self-message ignored"}
        
        # Detect message source
        referral = messaging.get("referral", {})
        message_source = "dm"
        
        if referral:
            ref_source = referral.get("source", "").upper()
            ref_type = referral.get("type", "").upper()
            
            if ref_source == "STORY_MENTION" or ref_type == "STORY_REPLY":
                message_source = "story"
            elif ref_source == "ADS" or ref_type == "AD_MESSAGE":
                message_source = "ad"
        
        if message.get("reply_to", {}).get("story"):
            message_source = "story"
        
        if not sender_id or not text:
            logger.info("webhook_no_message")
            return {"status": "ok", "message": "No message to process"}
        
        # Load client config
        from src.config.client_config import load_client_config, set_current_config, _parse_config_from_dict
        from src.config.redis_config import get_redis_store
        from src.core.conversation_store import get_conversation_store
        
        redis_store = get_redis_store()
        config = None
        client_data = None
        
        # Smart client lookup
        cached_client_id = redis_store.get_client_id_from_instagram(recipient_id)
        if cached_client_id:
            client_data = redis_store.get_client(cached_client_id)
        
        if not client_data:
            client_data = redis_store.get_client(recipient_id)
        
        if not client_data:
            client_data = redis_store.find_client_by_instagram_id(recipient_id)
            if client_data:
                redis_store.store_instagram_mapping(recipient_id, client_data.get("client_id", recipient_id))
        
        if not client_data:
            settings = get_settings()
            if settings.instagram_account_id:
                client_data = redis_store.get_client(settings.instagram_account_id)
        
        if client_data:
            config = _parse_config_from_dict(client_data)
        
        client_id = client_data.get("client_id", recipient_id) if client_data else recipient_id
        
        if config:
            set_current_config(config)
            logger.info("client_config_loaded", client=config.business_name, source=message_source)
        else:
            logger.warning("no_client_config", recipient_id=recipient_id)
        
        # Get conversation store
        conv_store = get_conversation_store()
        
        user_type = conv_store.get_user_type(client_id, sender_id)
        customer_meta = conv_store.get_customer_metadata(client_id, sender_id)
        username = customer_meta.get("username", "")
        customer_name = customer_meta.get("name", "")
        
        # Fetch user profile for new users
        if not username:
            try:
                from src.services.instagram import InstagramClient
                access_token = client_data.get("meta_access_token") if client_data else None
                instagram = InstagramClient(access_token=access_token)
                profile = await instagram.get_user_profile(sender_id)
                
                if profile:
                    username = profile.get("username", "")
                    customer_name = profile.get("name", "")
                    if username or customer_name:
                        conv_store.update_customer_metadata(
                            client_id=client_id,
                            customer_id=sender_id,
                            username=username,
                            name=customer_name,
                            profile_pic=profile.get("profile_pic", ""),
                        )
            except Exception as e:
                logger.warning("user_profile_fetch_failed", error=str(e))
        
        display_name = username or customer_name or sender_id
        logger.info("message_received", customer=display_name, user_type=user_type, source=message_source)
        
        last_summary = conv_store.get_last_summary(client_id, sender_id)
        
        # Save incoming message
        conv_store.add_message(
            client_id=client_id,
            customer_id=sender_id,
            role="customer",
            content=text,
        )
        
        # Extract email
        try:
            from src.utils.email_utils import extract_email, store_email_mapping
            email = extract_email(text)
            if email:
                store_email_mapping(client_id, sender_id, email)
                conv_store.update_customer_metadata(
                    client_id=client_id,
                    customer_id=sender_id,
                    email=email,
                )
        except Exception as e:
            logger.warning("email_extraction_failed", error=str(e))
        
        # Check if blocked
        customer_metadata = conv_store.get_customer_metadata(client_id, sender_id)
        is_blocked = customer_metadata.get("agent_blocked", False)
        
        if is_blocked:
            logger.info("customer_blocked_skip_agent", client_id=client_id, customer=display_name)
            return {"status": "ok", "message": "Customer is blocked", "blocked": True}
        
        # Send typing indicator
        try:
            from src.services.instagram import InstagramClient
            access_token = client_data.get("meta_access_token") if client_data else None
            if access_token:
                instagram = InstagramClient(access_token=access_token)
                await instagram.mark_seen(sender_id)
                await instagram.typing_on(sender_id)
        except Exception as e:
            logger.warning("sender_action_failed", error=str(e))
        
        # Process through agent pipeline
        result = await process_message(
            sender_id, 
            text,
            client_id=client_id,
            user_type=user_type,
            last_summary=last_summary,
            message_source=message_source,
            username=username,
            customer_name=customer_name,
        )
        
        # Save agent response
        response_text = result.get("response_text", "")
        if response_text:
            conv_store.add_message(
                client_id=client_id,
                customer_id=sender_id,
                role="agent",
                content=response_text,
            )
        
        # Update metadata
        if result.get("lead_score"):
            conv_store.update_customer_metadata(
                client_id=client_id,
                customer_id=sender_id,
                lead_score=result.get("lead_score"),
                lead_status=result.get("lead_status", "warm"),
                intent=result.get("intent"),
            )
        
        return {
            "status": "ok",
            "user_id": sender_id,
            "user_type": user_type,
            "response": response_text,
            "actions": result.get("actions_taken", []),
            "client": config.business_name if config else "default",
        }
        
    except Exception as e:
        logger.error("webhook_processing_failed", error=str(e))
        raise HTTPException(status_code=500, detail=str(e))
