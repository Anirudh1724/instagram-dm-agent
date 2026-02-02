
import asyncio
import json
import sys
import os

# Add backend to path
sys.path.append(os.path.join(os.getcwd(), 'backend'))

from src.config.redis_config import get_redis_store

async def inspect_client(email):
    store = get_redis_store()
    print(f"Searching for client with email: {email}")
    
    clients = store.list_clients()
    target_client = next((c for c in clients if c.get('login_email') == email), None)
    
    if target_client:
        print("Found Client:")
        print(json.dumps(target_client, indent=2, default=str))
        
        # Check specific fields
        print(f"\nAgent Type: {target_client.get('agent_type')}")
        print(f"Voice Direction: {target_client.get('voice_direction')}")
    else:
        print("Client not found.")

if __name__ == "__main__":
    if len(sys.argv) < 2:
        print("Usage: python inspect_redis.py <email>")
    else:
        asyncio.run(inspect_client(sys.argv[1]))
