"""
Email Extraction Utilities.
Extracts emails from message text and manages email-to-customer mappings.
"""

import re
from typing import Optional
from src.utils import get_logger

logger = get_logger("email_utils")

# Email regex pattern
EMAIL_PATTERN = re.compile(
    r'\b[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Z|a-z]{2,}\b'
)


def extract_email(text: str) -> Optional[str]:
    """
    Extract email address from text message.
    
    Returns the first email found, or None if no email found.
    """
    if not text:
        return None
    
    matches = EMAIL_PATTERN.findall(text)
    
    if matches:
        # Return first email found, normalized to lowercase
        return matches[0].lower()
    
    return None


def store_email_mapping(
    client_id: str,
    customer_id: str,
    email: str,
) -> bool:
    """
    Store email → customer_id mapping in Redis.
    
    This creates an index that allows looking up a customer by their email,
    useful when booking webhooks don't have the ref parameter.
    """
    try:
        from src.config.redis_config import get_redis_store
        from datetime import timedelta
        
        r = get_redis_store()._get_redis()
        
        # Store email → customer mapping
        # Key: email_index:{client_id}:{email}
        # Value: customer_id
        key = f"email_index:{client_id}:{email.lower()}"
        r.setex(key, timedelta(days=90), customer_id)
        
        logger.info(
            "email_mapping_stored",
            client_id=client_id,
            email=email,
            customer_id=customer_id[:8] + "...",
        )
        return True
        
    except Exception as e:
        logger.error("email_mapping_store_failed", error=str(e))
        return False


def lookup_customer_by_email(email: str) -> Optional[dict]:
    """
    Look up a customer ID by email address.
    
    Searches across all clients since we may not know which client
    the booking belongs to when matching by email.
    
    Returns:
        Dict with client_id and customer_id if found, None otherwise.
    """
    try:
        from src.config.redis_config import get_redis_store
        
        r = get_redis_store()._get_redis()
        email_lower = email.lower()
        
        # Search for email across all clients
        pattern = f"email_index:*:{email_lower}"
        keys = r.keys(pattern)
        
        if keys:
            # Get the first match
            key = keys[0]
            key_str = key.decode() if isinstance(key, bytes) else key
            customer_id = r.get(key)
            
            if customer_id:
                customer_id_str = customer_id.decode() if isinstance(customer_id, bytes) else customer_id
                
                # Extract client_id from key format: email_index:{client_id}:{email}
                parts = key_str.split(":")
                if len(parts) >= 2:
                    client_id = parts[1]
                    
                    logger.info(
                        "customer_found_by_email",
                        email=email,
                        client_id=client_id,
                        customer_id=customer_id_str[:8] + "...",
                    )
                    
                    return {
                        "client_id": client_id,
                        "customer_id": customer_id_str,
                    }
        
        logger.debug("customer_not_found_by_email", email=email)
        return None
        
    except Exception as e:
        logger.error("email_lookup_failed", error=str(e))
        return None
