import requests
import sys

# Constants
BASE_URL = "http://localhost:8000"
EMAIL = "admin@abc.com" # Using admin creds for simplicity if they work for client auth, wait, admin login gives admin session.
# I need a CLIENT login.
# I need to find a valid client in the system effectively.
# Retrieve a client from Redis?

# Let's try to list clients as admin first, then pick one to login as.

def test_dashboard():
    # 1. Admin Login
    print("Logging in as admin...")
    resp = requests.post(f"{BASE_URL}/api/auth/admin/login", json={
        "email": "admin@abc.com",
        "password": "123456"
    })
    
    if resp.status_code != 200:
        print(f"Admin login failed: {resp.text}")
        return
        
    admin_token = resp.json()["token"]
    admin_headers = {"x-admin-key": "admin"} # Wait, admin endpoints use x-admin-key OR token?
    # src/api/admin.py uses verify_admin_key which checks header x-admin-key.
    # It doesn't use the bearer token from login. The login endpoint is just for the frontend?
    # Let's check verify_admin_key in admin.py.
    # It checks `x_admin_key` header against `settings.admin_api_key`.
    # .env says nothing about admin_api_key? 
    # Let's check .env content from previous turn.
    # It has ADMIN_EMAIL, ADMIN_PASSWORD. 
    # It does NOT have ADMIN_API_KEY.
    # admin.py: if not settings.admin_api_key: logger.warning("admin_no_key_configured"); return True
    # So admin access is open if header is missing? No, default is None.
    # If not settings.admin_api_key, it returns True.
    # So I probably don't need a key.
    
    # 2. Create a test client
    print("Creating test client...")
    client_id = "test_client_dashboard"
    requests.post(f"{BASE_URL}/admin/clients", json={
        "client_id": client_id,
        "login_email": "test@dashboard.com",
        "login_password": "password123",
        "business_name": "Test Biz"
    }) 
    # Ignore error if exists
    
    # 3. Login as Client
    print("Logging in as client...")
    resp = requests.post(f"{BASE_URL}/api/auth/login", json={
        "email": "test@dashboard.com",
        "password": "password123"
    })
    
    if resp.status_code != 200:
        print(f"Client login failed: {resp.text}")
        return
        
    token = resp.json()["token"]
    print(f"Got token: {token[:10]}...")
    
    # 4. Access Dashboard
    print("Accessing /api/client/dashboard...")
    resp = requests.get(f"{BASE_URL}/api/client/dashboard", headers={
        "Authorization": f"Bearer {token}"
    })
    
    print(f"Status: {resp.status_code}")
    print(f"Response: {resp.text[:500]}")

if __name__ == "__main__":
    try:
        test_dashboard()
    except Exception as e:
        print(f"Error: {e}")
