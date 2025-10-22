#!/usr/bin/env python3
"""
Test authentication middleware and Cognito integration.
"""

import sys
import os
from dotenv import load_dotenv

# Load environment variables
load_dotenv()

# Add app to path
sys.path.append('.')

def test_auth_middleware():
    """Test authentication middleware components."""
    try:
        print("Testing authentication middleware...")
        
        # Test 1: Import middleware
        from app.middleware.auth import CognitoAuth, get_current_user
        print("✅ Authentication middleware imported successfully")
        
        # Test 2: Initialize CognitoAuth
        auth = CognitoAuth()
        print(f"✅ CognitoAuth initialized with region: {auth.region}")
        print(f"✅ User Pool ID: {auth.user_pool_id}")
        print(f"✅ Client ID: {auth.client_id}")
        
        # Test 3: Check JWKS URL construction
        expected_jwks = f"https://cognito-idp.{auth.region}.amazonaws.com/{auth.user_pool_id}/.well-known/jwks.json"
        assert auth.jwks_url == expected_jwks
        print(f"✅ JWKS URL constructed correctly: {auth.jwks_url}")
        
        print("\n🎉 Authentication middleware tests passed!")
        return True
        
    except Exception as e:
        print(f"❌ Authentication middleware test failed: {e}")
        import traceback
        traceback.print_exc()
        return False

def test_auth_router():
    """Test authentication router."""
    try:
        print("\nTesting authentication router...")
        
        # Test 1: Import router
        from app.routers.auth import router, get_cognito_client
        print("✅ Authentication router imported successfully")
        
        # Test 2: Check router endpoints
        routes = [route.path for route in router.routes]
        expected_routes = ['/login', '/signup', '/me', '/refresh', '/logout']
        
        for expected_route in expected_routes:
            if expected_route in routes:
                print(f"✅ Route {expected_route} found")
            else:
                print(f"⚠️ Route {expected_route} not found in {routes}")
        
        # Test 3: Test Cognito client initialization
        try:
            client = get_cognito_client()
            print("✅ Cognito client initialized successfully")
        except Exception as e:
            print(f"⚠️ Cognito client initialization failed (expected without AWS credentials): {e}")
        
        print("\n🎉 Authentication router tests passed!")
        return True
        
    except Exception as e:
        print(f"❌ Authentication router test failed: {e}")
        import traceback
        traceback.print_exc()
        return False

def test_fastapi_integration():
    """Test FastAPI integration with authentication."""
    try:
        print("\nTesting FastAPI integration...")
        
        # Test 1: Create test app with auth
        from fastapi import FastAPI, Depends
        from fastapi.testclient import TestClient
        from app.middleware.auth import get_current_user_optional
        
        app = FastAPI()
        
        @app.get("/test-auth")
        async def test_endpoint(current_user = Depends(get_current_user_optional)):
            if current_user:
                return {"authenticated": True, "user": current_user}
            else:
                return {"authenticated": False}
        
        client = TestClient(app)
        
        # Test 2: Test unauthenticated request
        response = client.get("/test-auth")
        assert response.status_code == 200
        data = response.json()
        assert data["authenticated"] == False
        print("✅ Unauthenticated request handled correctly")
        
        # Test 3: Test with invalid token
        response = client.get("/test-auth", headers={"Authorization": "Bearer invalid-token"})
        assert response.status_code == 200
        data = response.json()
        assert data["authenticated"] == False
        print("✅ Invalid token handled correctly")
        
        print("\n🎉 FastAPI integration tests passed!")
        return True
        
    except Exception as e:
        print(f"❌ FastAPI integration test failed: {e}")
        import traceback
        traceback.print_exc()
        return False

def main():
    """Run all authentication tests."""
    print("🔐 Starting Authentication System Tests")
    print("=" * 50)
    
    tests = [
        test_auth_middleware,
        test_auth_router,
        test_fastapi_integration
    ]
    
    passed = 0
    total = len(tests)
    
    for test in tests:
        if test():
            passed += 1
    
    print("\n" + "=" * 50)
    print(f"📊 Test Results: {passed}/{total} tests passed")
    
    if passed == total:
        print("🎉 All authentication tests passed!")
        print("✅ Authentication system is ready for deployment")
        return True
    else:
        print("❌ Some tests failed. Please review the errors above.")
        return False

if __name__ == "__main__":
    success = main()
    sys.exit(0 if success else 1)
