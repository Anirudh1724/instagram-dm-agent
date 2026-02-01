"""
Script to create a test client account for development/testing.
Run this to quickly add a client account to Redis.
"""

import sys
import os
from pathlib import Path

# Add backend to path
backend_dir = Path(__file__).parent
sys.path.insert(0, str(backend_dir))

from dotenv import load_dotenv
load_dotenv()

from src.config.redis_config import get_redis_store
from src.api.v1.endpoints.auth import hash_password
from src.utils import setup_logging, get_logger

setup_logging()
logger = get_logger("create_test_client")


def create_test_client():
    """Create a test client account in Redis."""
    
    # Test client configuration
    client_config = {
        "client_id": "test_client",
        "business_name": "Test Business",
        "login_email": "test@test.com",
        "login_password": hash_password("test123"),
        "agent_type": "text",
        "first_message": "Hi! 👋 Thanks for reaching out!",
        "qualification_prompt": "Ask about their needs and budget",
        "dm_prompt": "Help them book a meeting",
        "instagram_handle": "@test_business",
        "created_at": "2026-02-01T15:10:00Z",
    }
    
    try:
        redis_store = get_redis_store()
        
        # Check if client already exists
        existing = redis_store.get_client(client_config["client_id"])
        if existing:
            logger.info("client_already_exists", client_id=client_config["client_id"])
            print(f"[OK] Test client already exists: {client_config['client_id']}")
            print(f"  Email: {client_config['login_email']}")
            print(f"  Password: test123")
            return
        
        # Create the client
        redis_store.save_client(client_config["client_id"], client_config)
        
        logger.info("test_client_created", client_id=client_config["client_id"])
        print("[SUCCESS] Test client created successfully!")
        print(f"\n  Client ID: {client_config['client_id']}")
        print(f"  Business: {client_config['business_name']}")
        print(f"  Email: {client_config['login_email']}")
        print(f"  Password: test123")
        print(f"\n  You can now login at http://localhost:5173")
        print(f"  1. Select 'Client Dashboard'")
        print(f"  2. Enter email: test@test.com")
        print(f"  3. Enter password: test123")
        
    except Exception as e:
        logger.error("client_creation_failed", error=str(e))
        print(f"[ERROR] Failed to create test client: {e}")
        sys.exit(1)


if __name__ == "__main__":
    print("Creating test client account...")
    print("-" * 50)
    create_test_client()
    print("-" * 50)

