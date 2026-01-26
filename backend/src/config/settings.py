"""
Configuration settings for the Instagram DM Agent system.
Uses pydantic-settings for environment variable management.
"""

from functools import lru_cache
from pydantic_settings import BaseSettings


class Settings(BaseSettings):
    """Application settings loaded from environment variables."""
    
    # Server
    host: str = "0.0.0.0"
    port: int = 8000
    debug: bool = False
    
    # LLM (OpenAI)
    openai_api_key: str = ""
    llm_model: str = "gpt-4o-mini"
    llm_temperature: float = 0.7
    
    # Meta/Instagram
    meta_app_id: str = ""  # Facebook App ID for OAuth
    meta_verify_token: str = ""
    meta_app_secret: str = ""
    meta_access_token: str = ""
    instagram_account_id: str = ""
    oauth_redirect_uri: str = ""  # OAuth callback URL
    
    # Redis
    redis_url: str = "redis://localhost:6379/0"
    
    # Admin authentication
    admin_api_key: str = ""
    admin_email: str = "admin@lumoscale.in"  # Default admin email
    admin_password: str = "Lumoscale@123"  # Default admin password (change in production!)
    
    # Base URL (for webhook info)
    base_url: str = "http://localhost:8000"
    
    # Cal.com (optional booking integration)
    calcom_api_key: str = ""
    calcom_event_type_id: str = ""
    
    # Webhook base URL (for auto-registering client Cal.com webhooks)
    # Set this to your deployed domain, e.g., https://api.yourdomain.com
    webhook_base_url: str = ""
    
    # Logging
    log_level: str = "INFO"
    
    class Config:
        env_file = ".env"
        env_file_encoding = "utf-8"
        extra = "ignore"  # Ignore extra env vars


@lru_cache
def get_settings() -> Settings:
    """Get cached settings instance."""
    return Settings()
