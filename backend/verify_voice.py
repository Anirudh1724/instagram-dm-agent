"""
Script to verify Voice Agent creation support in backend.
"""

import sys
from pathlib import Path

# Add backend to path
backend_dir = Path(__file__).parent
sys.path.insert(0, str(backend_dir))

from dotenv import load_dotenv
load_dotenv()

from src.config.redis_config import get_redis_store
from src.api.admin.clients import ClientCreateRequest
from src.utils import setup_logging

setup_logging()

def verify_voice_client_creation():
    print("Verifying Voice Client Creation...")
    
    # Mock data with new fields
    client_data = {
        "client_id": "test_voice_agent",
        "business_name": "Voice Test Corp",
        "login_email": "voice@test.com",
        "agent_type": "voice",
        "mobile_number": "+15550009999",
        "qualification_prompt": "This is the main prompt.",
        "followup_prompt": "This is the follow up prompt."
    }
    
    try:
        # 1. Validate against Pydantic schema
        request = ClientCreateRequest(**client_data)
        print("[OK] Pydantic Schema Validation Passed")
        print(f"  - mobile_number: {request.mobile_number}")
        print(f"  - followup_prompt: {request.followup_prompt}")
        
        # 2. Store in Redis
        redis_store = get_redis_store()
        redis_store.save_client(client_data["client_id"], client_data)
        print("[OK] Saved to Redis")
        
        # 3. Retrieve and Verify
        stored = redis_store.get_client(client_data["client_id"])
        
        if stored.get("mobile_number") == "+15550009999":
            print("[OK] Verification Successful: mobile_number stored correctly")
        else:
            print(f"[FAIL] Verification Failed: mobile_number mismatch. Got: {stored.get('mobile_number')}")
            
        if stored.get("followup_prompt") == "This is the follow up prompt.":
             print("[OK] Verification Successful: followup_prompt stored correctly")
        else:
             print(f"[FAIL] Verification Failed: followup_prompt mismatch. Got: {stored.get('followup_prompt')}")

    except Exception as e:
        print(f"[FAIL] Verification Failed: {e}")

if __name__ == "__main__":
    verify_voice_client_creation()
