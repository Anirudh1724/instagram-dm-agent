"""
Booking utilities - Helper functions for generating personalized booking links.
"""

from urllib.parse import urlencode
from src.utils import get_logger

logger = get_logger("booking_utils")


def generate_booking_link(
    base_url: str,
    customer_id: str,
    customer_name: str = "",
) -> str:
    """
    Generate a personalized booking link with customer reference.
    
    This adds the customer's Instagram ID to the booking URL so we can
    link the booking back to their DM conversation.
    
    Args:
        base_url: The base booking URL configured by the client
        customer_id: Instagram-scoped user ID (IGSID)
        customer_name: Optional customer name for pre-filling
        
    Returns:
        Personalized booking URL with ref parameter
        
    Example:
        Input: ("https://example.com/book", "877935681554548", "John")
        Output: "https://example.com/book?ref=877935681554548&name=John"
    """
    params = {"ref": customer_id}
    
    if customer_name:
        params["name"] = customer_name
    
    # Check if URL already has query params
    separator = "&" if "?" in base_url else "?"
    
    personalized_url = f"{base_url}{separator}{urlencode(params)}"
    
    logger.debug("booking_link_generated", customer_id=customer_id, url=personalized_url[:50])
    
    return personalized_url


def inject_booking_ref(text: str, customer_id: str) -> str:
    """
    Inject customer ref parameter into any booking URLs found in text.
    
    Supports common booking platforms:
    - mojo.page
    - cal.com
    - calendly.com
    
    Args:
        text: Message text that may contain booking URLs
        customer_id: Instagram-scoped user ID to inject
        
    Returns:
        Text with ref parameters added to booking URLs
    """
    import re
    
    # Common booking URL patterns
    booking_patterns = [
        r'(https?://[^\s]*mojo\.page/[^\s\?\)]+)',
        r'(https?://[^\s]*cal\.com/[^\s\?\)]+)',
        r'(https?://[^\s]*calendly\.com/[^\s\?\)]+)',
    ]
    
    for pattern in booking_patterns:
        def add_ref(match):
            url = match.group(1)
            separator = '&' if '?' in url else '?'
            return f"{url}{separator}ref={customer_id}"
        
        text = re.sub(pattern, add_ref, text)
    
    return text
