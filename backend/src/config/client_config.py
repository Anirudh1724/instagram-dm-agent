"""
Client Configuration System - Multi-tenant config for different businesses.

Each client has a YAML file with their specific:
- Business details (name, industry, tagline)
- Greeting style (Namaste, Hello, Hey, etc.)
- Services and pricing
- Personality/tone settings
- Booking information
- Custom prompts
"""

import os
import yaml
from pathlib import Path
from typing import Optional
from dataclasses import dataclass, field
from src.utils import get_logger

logger = get_logger("client_config")

# Default clients directory
CLIENTS_DIR = Path(__file__).parent.parent.parent / "clients"


@dataclass
class ServiceInfo:
    """Service offered by the client."""
    name: str
    price: str = ""
    duration: str = ""
    description: str = ""


@dataclass
class ClientConfig:
    """Complete client configuration."""
    # Identification
    client_id: str  # Instagram Account ID
    
    # Business Info
    business_name: str = "Business"
    industry: str = "general"
    tagline: str = ""
    
    # Source-specific prompts
    dm_prompt: str = ""  # For regular direct messages
    story_prompt: str = ""  # For story replies
    ad_prompt: str = ""  # For ad click messages
    followup_prompt: str = ""  # For automated followups and recovery messages
    
    # Services
    services: list[ServiceInfo] = field(default_factory=list)
    
    # Booking
    booking_link: str = ""
    availability: str = ""
    
    def get_services_text(self) -> str:
        """Format services for prompt."""
        if not self.services:
            return "No specific services listed."
        
        lines = []
        for svc in self.services:
            line = f"- {svc.name}"
            if svc.price:
                line += f": {svc.price}"
            if svc.duration:
                line += f" ({svc.duration})"
            lines.append(line)
        return "\n".join(lines)
    
    def get_prompt_for_source(self, source: str = "dm") -> str:
        """
        Get the appropriate prompt based on message source.
        
        Args:
            source: Message source - 'dm', 'story', or 'ad'
            
        Returns:
            The appropriate prompt, falling back to dm_prompt if specific one not set
        """
        if source == "story" and self.story_prompt:
            return self.story_prompt
        elif source == "ad" and self.ad_prompt:
            return self.ad_prompt
        # Default to dm_prompt for regular DMs or as fallback
        return self.dm_prompt
    
    def get_full_context(self, source: str = "dm") -> str:
        """
        Get complete context for LLM prompt.
        
        Args:
            source: Message source - 'dm', 'story', or 'ad'
        """
        prompt = self.get_prompt_for_source(source)
        
        # If prompt is provided, use it as the primary context
        if prompt:
            context = f"""
## Business Information
- Name: {self.business_name}
- Industry: {self.industry}
- Tagline: {self.tagline}

## Agent Instructions
{prompt}

## Services & Pricing
{self.get_services_text()}

## Booking
- Link: {self.booking_link or 'Not configured'}
- Hours: {self.availability or 'Contact for availability'}
"""
        else:
            # Fallback to basic context if no prompt provided
            context = f"""
## Business Information
- Name: {self.business_name}
- Industry: {self.industry}
- Tagline: {self.tagline}

## Personality & Tone
- Be friendly and professional
- Respond helpfully to customer inquiries

## Services & Pricing
{self.get_services_text()}

## Booking
- Link: {self.booking_link or 'Not configured'}
- Hours: {self.availability or 'Contact for availability'}
"""
        return context.strip()


def load_client_config(client_id: str) -> Optional[ClientConfig]:
    """
    Load client configuration by Instagram Account ID.
    
    First checks Redis, then falls back to YAML files.
    
    Args:
        client_id: Instagram Account ID
        
    Returns:
        ClientConfig or None if not found
    """
    # Try Redis first
    try:
        from src.config.redis_config import get_redis_store
        store = get_redis_store()
        redis_config = store.get_client(client_id)
        if redis_config:
            logger.info("client_config_from_redis", client_id=client_id)
            return _parse_config_from_dict(redis_config)
    except Exception as e:
        logger.debug("redis_lookup_failed", client_id=client_id, error=str(e))
    
    # Fallback to YAML files
    if not CLIENTS_DIR.exists():
        logger.warning("clients_dir_not_found", path=str(CLIENTS_DIR))
        return None
    
    # Search all YAML files for matching client_id
    for yaml_file in CLIENTS_DIR.glob("*.yaml"):
        try:
            with open(yaml_file, 'r', encoding='utf-8') as f:
                data = yaml.safe_load(f)
            
            if data.get("client_id") == client_id:
                logger.info("client_config_found", file=yaml_file.name, client_id=client_id)
                return _parse_config(data)
                
        except Exception as e:
            logger.error("config_parse_error", file=yaml_file.name, error=str(e))
    
    logger.warning("client_config_not_found", client_id=client_id)
    return None


def load_config_by_name(config_name: str) -> Optional[ClientConfig]:
    """
    Load client configuration by filename (without .yaml extension).
    Useful for demo/testing.
    """
    yaml_file = CLIENTS_DIR / f"{config_name}.yaml"
    
    if not yaml_file.exists():
        logger.warning("config_file_not_found", name=config_name)
        return None
    
    try:
        with open(yaml_file, 'r', encoding='utf-8') as f:
            data = yaml.safe_load(f)
        return _parse_config(data)
    except Exception as e:
        logger.error("config_parse_error", file=yaml_file.name, error=str(e))
        return None


def _parse_config(data: dict) -> ClientConfig:
    """Parse YAML data into ClientConfig object."""
    # Parse services
    services = []
    for svc in data.get("services", []):
        services.append(ServiceInfo(
            name=svc.get("name", ""),
            price=svc.get("price", ""),
            duration=svc.get("duration", ""),
            description=svc.get("description", ""),
        ))
    
    # Get nested values with defaults
    business = data.get("business", {})
    booking = data.get("booking", {})
    
    return ClientConfig(
        client_id=data.get("client_id", ""),
        business_name=business.get("name", data.get("business_name", "Business")),
        industry=business.get("industry", data.get("industry", "general")),
        tagline=business.get("tagline", ""),
        dm_prompt=data.get("dm_prompt", "") or data.get("agent_prompt", ""),
        story_prompt=data.get("story_prompt", ""),
        ad_prompt=data.get("ad_prompt", ""),
        followup_prompt=data.get("followup_prompt", ""),
        services=services,
        booking_link=booking.get("link", ""),
        availability=booking.get("availability", ""),
    )


def _parse_config_from_dict(data: dict) -> ClientConfig:
    """
    Parse flat dict (from Redis/dashboard) into ClientConfig object.
    
    The dashboard saves data in a flat structure, not nested like YAML.
    """
    # Parse services
    services = []
    for svc in data.get("services", []):
        services.append(ServiceInfo(
            name=svc.get("name", ""),
            price=svc.get("price", ""),
            duration=svc.get("duration", ""),
            description=svc.get("description", ""),
        ))
    
    return ClientConfig(
        client_id=data.get("client_id", ""),
        business_name=data.get("business_name", "Business"),
        industry=data.get("industry", "general"),
        tagline=data.get("tagline", ""),
        dm_prompt=data.get("dm_prompt", "") or data.get("agent_prompt", ""),  # Fallback to old field
        story_prompt=data.get("story_prompt", ""),
        ad_prompt=data.get("ad_prompt", ""),
        followup_prompt=data.get("followup_prompt", ""),
        services=services,
        booking_link=data.get("booking_link", ""),
        availability=data.get("availability", ""),
    )


def list_available_clients() -> list[dict]:
    """List all available client configurations."""
    clients = []
    
    if not CLIENTS_DIR.exists():
        return clients
    
    for yaml_file in CLIENTS_DIR.glob("*.yaml"):
        try:
            with open(yaml_file, 'r', encoding='utf-8') as f:
                data = yaml.safe_load(f)
            
            business = data.get("business", {})
            clients.append({
                "filename": yaml_file.stem,
                "client_id": data.get("client_id", ""),
                "name": business.get("name", data.get("business_name", "")),
                "industry": business.get("industry", ""),
            })
        except Exception:
            pass
    
    return clients


# Global cached config (for current Instagram account)
_current_config: Optional[ClientConfig] = None


def get_current_config() -> Optional[ClientConfig]:
    """Get the currently loaded client config."""
    return _current_config


def set_current_config(config: ClientConfig) -> None:
    """Set the current client config (used when processing messages)."""
    global _current_config
    _current_config = config
