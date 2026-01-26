"""
Redis-based client configuration storage.
Stores client configs in Redis for real-time updates without redeployment.
"""

import json
from typing import Optional
import redis
from src.config import get_settings
from src.utils import get_logger

logger = get_logger("redis_config")

# Redis key prefix for client configs
CLIENT_PREFIX = "client_config:"


class RedisConfigStore:
    """Store and retrieve client configurations from Redis."""
    
    def __init__(self):
        settings = get_settings()
        self._redis: Optional[redis.Redis] = None
        self._redis_url = settings.redis_url
    
    def _get_redis(self) -> redis.Redis:
        """Lazy initialize Redis connection."""
        if self._redis is None:
            try:
                self._redis = redis.from_url(self._redis_url, decode_responses=True)
                # Test connection
                self._redis.ping()
                logger.info("redis_connected", url=self._redis_url)
            except redis.ConnectionError as e:
                logger.warning("redis_connection_failed", error=str(e))
                raise
        return self._redis
    
    def save_client(self, client_id: str, config: dict) -> bool:
        """
        Save a client configuration to Redis.
        
        Args:
            client_id: Instagram Account ID
            config: Full client configuration dict
            
        Returns:
            True if saved successfully
        """
        try:
            r = self._get_redis()
            key = f"{CLIENT_PREFIX}{client_id}"
            r.set(key, json.dumps(config))
            logger.info("client_saved", client_id=client_id)
            return True
        except Exception as e:
            logger.error("client_save_failed", client_id=client_id, error=str(e))
            return False
    
    def get_client(self, client_id: str) -> Optional[dict]:
        """
        Get a client configuration from Redis.
        
        Args:
            client_id: Instagram Account ID
            
        Returns:
            Config dict or None if not found
        """
        try:
            r = self._get_redis()
            key = f"{CLIENT_PREFIX}{client_id}"
            data = r.get(key)
            if data:
                return json.loads(data)
            return None
        except Exception as e:
            logger.error("client_get_failed", client_id=client_id, error=str(e))
            return None
    
    def delete_client(self, client_id: str) -> bool:
        """Delete a client configuration from Redis."""
        try:
            r = self._get_redis()
            key = f"{CLIENT_PREFIX}{client_id}"
            r.delete(key)
            logger.info("client_deleted", client_id=client_id)
            return True
        except Exception as e:
            logger.error("client_delete_failed", client_id=client_id, error=str(e))
            return False
    
    def list_clients(self) -> list[dict]:
        """
        List all client configurations.
        
        Returns:
            List of client config dicts with their IDs
        """
        try:
            r = self._get_redis()
            keys = r.keys(f"{CLIENT_PREFIX}*")
            clients = []
            
            for key in keys:
                data = r.get(key)
                if data:
                    config = json.loads(data)
                    client_id = key.replace(CLIENT_PREFIX, "")
                    clients.append({
                        "client_id": client_id,
                        **config
                    })
            
            return clients
        except Exception as e:
            logger.error("client_list_failed", error=str(e))
            return []
    
    def client_exists(self, client_id: str) -> bool:
        """Check if a client exists in Redis."""
        try:
            r = self._get_redis()
            key = f"{CLIENT_PREFIX}{client_id}"
            return r.exists(key) > 0
        except Exception:
            return False
    
    def find_client_by_instagram_id(self, instagram_id: str) -> Optional[dict]:
        """
        Find a client configuration by Instagram account ID.
        
        This searches through all clients and returns the first one
        that has a matching instagram_account_id, instagram_graph_id,
        or client_id. If no match found, returns the first client
        with a valid access token (single-tenant fallback).
        
        Args:
            instagram_id: The Instagram account ID to search for
            
        Returns:
            Client config dict or None if not found
        """
        # First, try direct lookup
        direct = self.get_client(instagram_id)
        if direct:
            return direct
        
        # Search all clients for a match
        try:
            clients = self.list_clients()
            client_with_token = None
            
            for client in clients:
                # Check various ID fields
                if client.get("instagram_account_id") == instagram_id:
                    return client
                if client.get("instagram_graph_id") == instagram_id:
                    return client
                if client.get("client_id") == instagram_id:
                    return client
                
                # Remember first client with a token as fallback
                if not client_with_token and client.get("meta_access_token"):
                    client_with_token = client
            
            # FALLBACK: If no ID match found but we have a client with a token,
            # return it (assumes single-tenant or the token owner is correct)
            # This handles the case where Meta returns different IDs from different endpoints
            if client_with_token:
                logger.info("client_fallback_to_token", 
                           instagram_id=instagram_id, 
                           client_id=client_with_token.get("client_id"))
                return client_with_token
            
            return None
        except Exception as e:
            logger.error("find_client_failed", instagram_id=instagram_id, error=str(e))
            return None
    
    def store_instagram_mapping(self, instagram_id: str, client_id: str) -> bool:
        """
        Store a mapping from Instagram ID to client ID.
        
        This allows fast lookups when a webhook arrives with an
        Instagram ID that doesn't directly match a client_id.
        """
        try:
            r = self._get_redis()
            key = f"instagram_mapping:{instagram_id}"
            r.set(key, client_id)
            logger.info("instagram_mapping_stored", instagram_id=instagram_id, client_id=client_id)
            return True
        except Exception as e:
            logger.error("instagram_mapping_failed", error=str(e))
            return False
    
    def get_client_id_from_instagram(self, instagram_id: str) -> Optional[str]:
        """
        Get the client_id for a given Instagram ID from the mapping.
        """
        try:
            r = self._get_redis()
            key = f"instagram_mapping:{instagram_id}"
            return r.get(key)
        except Exception:
            return None



# Mock Redis for fallback
class MockRedis:
    def __init__(self):
        self._data = {}
        self._expiries = {}
        logger.warning("using_mock_redis_fallback", message="Redis not available. Using in-memory storage. Data will be lost on restart.")

    def get(self, key):
        return self._data.get(key)

    def set(self, key, value):
        self._data[key] = value
        return True
    
    def setex(self, key, time, value):
        self._data[key] = value
        # Note: Expiry not implemented for mock, but that's fine for simple sessions
        return True

    def delete(self, key):
        if key in self._data:
            del self._data[key]
            return 1
        return 0

    def keys(self, pattern="*"):
        # Simple pattern matching (only supports prefix*)
        if pattern.endswith("*"):
            prefix = pattern[:-1]
            return [k for k in self._data.keys() if k.startswith(prefix)]
        return list(self._data.keys())

    def exists(self, key):
        return 1 if key in self._data else 0
        
    def ping(self):
        return True

# Global instance
_redis_store: Optional[RedisConfigStore] = None


def get_redis_store() -> RedisConfigStore:
    """Get the global Redis config store instance."""
    global _redis_store
    
    # If store exists but redis connection failed previously, allow retrying (handled in _get_redis)
    if _redis_store is None:
        _redis_store = RedisConfigStore()
    return _redis_store

# Patch RedisConfigStore._get_redis to use fallback
def _patched_get_redis(self):
    """Lazy initialize Redis connection with fallback."""
    if self._redis is None:
        try:
            r = redis.from_url(self._redis_url, decode_responses=True)
            # Test connection
            r.ping()
            self._redis = r
            logger.info("redis_connected", url=self._redis_url)
        except (redis.ConnectionError, redis.TimeoutError) as e:
            logger.warning("redis_connection_failed_fallback", error=str(e))
            self._redis = MockRedis()
    return self._redis

RedisConfigStore._get_redis = _patched_get_redis
