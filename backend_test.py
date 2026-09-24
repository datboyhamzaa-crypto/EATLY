#!/usr/bin/env python3
"""
Backend API Tests for EATLY - Bug Fix Verification
Tests the CORS fix for login & register "failed to fetch" issue
"""
import requests
import time
import sys

# Backend URL
BACKEND_URL = "http://localhost:8001"
API_BASE = f"{BACKEND_URL}/api"

# Test credentials
DEMO_EMAIL = "andi@eatly.com"
DEMO_PASSWORD = "password123"

# Colors for output
GREEN = "\033[92m"
RED = "\033[91m"
YELLOW = "\033[93m"
RESET = "\033[0m"

def print_test(name, passed, details=""):
    status = f"{GREEN}✓ PASS{RESET}" if passed else f"{RED}✗ FAIL{RESET}"
    print(f"{status} - {name}")
    if details:
        print(f"  {details}")
    return passed

def test_cors_preflight():
    """Test CORS preflight OPTIONS request"""
    print("\n=== Testing CORS Preflight ===")
    
    try:
        response = requests.options(
            f"{API_BASE}/auth/login",
            headers={
                "Origin": "https://some-random-domain.com",
                "Access-Control-Request-Method": "POST",
                "Access-Control-Request-Headers": "content-type,authorization"
            }
        )
        
        # Check status
        status_ok = response.status_code == 200
        
        # Check CORS headers
        allow_origin = response.headers.get("access-control-allow-origin", "")
        allow_methods = response.headers.get("access-control-allow-methods", "")
        allow_headers = response.headers.get("access-control-allow-headers", "")
        
        cors_ok = (
            allow_origin == "*" and
            "POST" in allow_methods and
            "content-type" in allow_headers.lower()
        )
        
        passed = status_ok and cors_ok
        
        details = f"Status: {response.status_code}, Origin: {allow_origin}"
        if not cors_ok:
            details += f"\n  Methods: {allow_methods}, Headers: {allow_headers}"
        
        return print_test("CORS Preflight", passed, details)
        
    except Exception as e:
        return print_test("CORS Preflight", False, f"Error: {str(e)}")

def test_login():
    """Test login endpoint"""
    print("\n=== Testing Login ===")
    
    try:
        response = requests.post(
            f"{API_BASE}/auth/login",
            json={"email": DEMO_EMAIL, "password": DEMO_PASSWORD},
            headers={"Content-Type": "application/json"}
        )
        
        status_ok = response.status_code == 200
        
        if status_ok:
            data = response.json()
            has_token = "token" in data and len(data["token"]) > 0
            has_user = "user" in data and "email" in data["user"]
            user_correct = data["user"]["email"] == DEMO_EMAIL if has_user else False
            
            passed = has_token and has_user and user_correct
            details = f"Status: {response.status_code}, Token: {'✓' if has_token else '✗'}, User: {data['user']['name'] if has_user else 'missing'}"
            
            return print_test("Login", passed, details)
        else:
            return print_test("Login", False, f"Status: {response.status_code}, Response: {response.text[:100]}")
            
    except Exception as e:
        return print_test("Login", False, f"Error: {str(e)}")

def test_register():
    """Test register endpoint with fresh email"""
    print("\n=== Testing Register ===")
    
    try:
        # Generate unique email
        timestamp = int(time.time())
        test_email = f"qa_{timestamp}@eatly.com"
        
        response = requests.post(
            f"{API_BASE}/auth/register",
            json={
                "email": test_email,
                "name": "QA Test User",
                "password": "testpass123"
            },
            headers={"Content-Type": "application/json"}
        )
        
        status_ok = response.status_code == 200
        
        if status_ok:
            data = response.json()
            has_token = "token" in data and len(data["token"]) > 0
            has_user = "user" in data and "email" in data["user"]
            user_correct = data["user"]["email"] == test_email if has_user else False
            
            passed = has_token and has_user and user_correct
            details = f"Status: {response.status_code}, Email: {test_email}, Token: {'✓' if has_token else '✗'}"
            
            return print_test("Register", passed, details)
        else:
            return print_test("Register", False, f"Status: {response.status_code}, Response: {response.text[:100]}")
            
    except Exception as e:
        return print_test("Register", False, f"Error: {str(e)}")

def test_duplicate_register():
    """Test that duplicate email registration fails properly"""
    print("\n=== Testing Duplicate Registration ===")
    
    try:
        response = requests.post(
            f"{API_BASE}/auth/register",
            json={
                "email": DEMO_EMAIL,  # Already exists
                "name": "Duplicate User",
                "password": "testpass123"
            },
            headers={"Content-Type": "application/json"}
        )
        
        # Should return 409 Conflict
        passed = response.status_code == 409
        details = f"Status: {response.status_code} (expected 409)"
        
        if passed:
            data = response.json()
            if "detail" in data:
                details += f", Message: {data['detail']}"
        
        return print_test("Duplicate Registration Handling", passed, details)
        
    except Exception as e:
        return print_test("Duplicate Registration Handling", False, f"Error: {str(e)}")

def test_invalid_login():
    """Test that invalid credentials fail properly"""
    print("\n=== Testing Invalid Login ===")
    
    try:
        response = requests.post(
            f"{API_BASE}/auth/login",
            json={"email": DEMO_EMAIL, "password": "wrongpassword"},
            headers={"Content-Type": "application/json"}
        )
        
        # Should return 401 Unauthorized
        passed = response.status_code == 401
        details = f"Status: {response.status_code} (expected 401)"
        
        if passed:
            data = response.json()
            if "detail" in data:
                details += f", Message: {data['detail']}"
        
        return print_test("Invalid Login Handling", passed, details)
        
    except Exception as e:
        return print_test("Invalid Login Handling", False, f"Error: {str(e)}")

def test_authenticated_endpoint():
    """Test authenticated endpoint with token"""
    print("\n=== Testing Authenticated Endpoint ===")
    
    try:
        # First login to get token
        login_response = requests.post(
            f"{API_BASE}/auth/login",
            json={"email": DEMO_EMAIL, "password": DEMO_PASSWORD}
        )
        
        if login_response.status_code != 200:
            return print_test("Authenticated Endpoint", False, "Failed to get token")
        
        token = login_response.json()["token"]
        
        # Test /auth/me endpoint
        me_response = requests.get(
            f"{API_BASE}/auth/me",
            headers={"Authorization": f"Bearer {token}"}
        )
        
        status_ok = me_response.status_code == 200
        
        if status_ok:
            data = me_response.json()
            has_email = "email" in data and data["email"] == DEMO_EMAIL
            
            passed = has_email
            details = f"Status: {me_response.status_code}, User: {data.get('name', 'unknown')}"
            
            return print_test("Authenticated Endpoint", passed, details)
        else:
            return print_test("Authenticated Endpoint", False, f"Status: {me_response.status_code}")
            
    except Exception as e:
        return print_test("Authenticated Endpoint", False, f"Error: {str(e)}")

def test_restaurants_endpoint():
    """Test restaurants endpoint (regression test)"""
    print("\n=== Testing Restaurants Endpoint (Regression) ===")
    
    try:
        response = requests.get(f"{API_BASE}/restaurants")
        
        status_ok = response.status_code == 200
        
        if status_ok:
            data = response.json()
            has_data = isinstance(data, list) and len(data) > 0
            
            passed = has_data
            details = f"Status: {response.status_code}, Restaurants: {len(data)}"
            
            return print_test("Restaurants Endpoint", passed, details)
        else:
            return print_test("Restaurants Endpoint", False, f"Status: {response.status_code}")
            
    except Exception as e:
        return print_test("Restaurants Endpoint", False, f"Error: {str(e)}")

def main():
    print(f"\n{YELLOW}{'='*60}{RESET}")
    print(f"{YELLOW}EATLY Backend API Tests - CORS Bug Fix Verification{RESET}")
    print(f"{YELLOW}{'='*60}{RESET}")
    
    results = []
    
    # Critical tests for the bug fix
    results.append(test_cors_preflight())
    results.append(test_login())
    results.append(test_register())
    
    # Additional validation tests
    results.append(test_duplicate_register())
    results.append(test_invalid_login())
    results.append(test_authenticated_endpoint())
    
    # Regression test
    results.append(test_restaurants_endpoint())
    
    # Summary
    print(f"\n{YELLOW}{'='*60}{RESET}")
    passed = sum(results)
    total = len(results)
    
    if passed == total:
        print(f"{GREEN}✓ ALL TESTS PASSED ({passed}/{total}){RESET}")
        print(f"\n{GREEN}CORS bug fix verified successfully!{RESET}")
        print(f"{GREEN}Login and Register endpoints are working correctly.{RESET}")
        sys.exit(0)
    else:
        print(f"{RED}✗ SOME TESTS FAILED ({passed}/{total} passed){RESET}")
        sys.exit(1)

if __name__ == "__main__":
    main()
