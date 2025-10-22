"""
Authentication router with AWS Cognito integration
"""

from typing import Dict, Any
from fastapi import APIRouter, HTTPException, status, Depends, Header
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from pydantic import BaseModel
import logging

from app.services.cognito_auth import cognito_auth

logger = logging.getLogger(__name__)
router = APIRouter()
security = HTTPBearer()

class LoginRequest(BaseModel):
    email: str
    password: str

class TokenResponse(BaseModel):
    access_token: str
    token_type: str
    expires_in: int
    user: Dict[str, Any]

@router.post("/login", response_model=Dict[str, Any])
async def login(login_data: LoginRequest):
    """
    Login endpoint - In production, this would redirect to Cognito Hosted UI
    For now, returns mock token for development
    """
    try:
        # In production, this would initiate Cognito authentication flow
        # For development, return mock token
        if login_data.email and login_data.password:
            return {
                "success": True,
                "message": "Login successful",
                "data": {
                    "access_token": "mock_jwt_token_12345",
                    "token_type": "Bearer",
                    "expires_in": 3600,
                    "user": {
                        "email": login_data.email,
                        "name": "Mock User",
                        "role": "researcher"
                    }
                },
                "cognito_info": {
                    "user_pool_id": cognito_auth.user_pool_id or "not-configured",
                    "client_id": cognito_auth.client_id or "not-configured",
                    "region": cognito_auth.region,
                    "mock_mode": cognito_auth.mock_mode
                }
            }
        else:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Email and password are required"
            )
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error during login: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Login failed: {str(e)}"
        )

@router.post("/logout", response_model=Dict[str, Any])
async def logout():
    """Logout endpoint"""
    return {
        "success": True,
        "message": "Logged out successfully"
    }

@router.get("/me", response_model=Dict[str, Any])
async def get_current_user(credentials: HTTPAuthorizationCredentials = Depends(security)):
    """
    Get current user information from JWT token
    """
    try:
        # Verify the token
        token_payload = cognito_auth.verify_token(credentials.credentials)
        
        # Extract user info
        user_info = cognito_auth.get_user_info(token_payload)
        
        return {
            "success": True,
            "data": user_info,
            "token_info": {
                "expires_at": token_payload.get("exp"),
                "issued_at": token_payload.get("iat"),
                "issuer": token_payload.get("iss")
            }
        }
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error getting current user: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to get user info: {str(e)}"
        )

@router.get("/verify-token", response_model=Dict[str, Any])
async def verify_token(credentials: HTTPAuthorizationCredentials = Depends(security)):
    """
    Verify JWT token endpoint
    """
    try:
        token_payload = cognito_auth.verify_token(credentials.credentials)
        
        return {
            "success": True,
            "valid": True,
            "data": {
                "user_id": token_payload.get("sub"),
                "email": token_payload.get("email"),
                "expires_at": token_payload.get("exp"),
                "token_use": token_payload.get("token_use")
            }
        }
        
    except HTTPException as e:
        return {
            "success": False,
            "valid": False,
            "error": e.detail
        }
    except Exception as e:
        logger.error(f"Error verifying token: {e}")
        return {
            "success": False,
            "valid": False,
            "error": str(e)
        }

@router.get("/status", response_model=Dict[str, Any])
async def auth_status():
    """
    Authentication service status
    """
    return {
        "success": True,
        "status": "available",
        "service": "cognito-auth",
        "configuration": {
            "user_pool_id": cognito_auth.user_pool_id or "not-configured",
            "client_id": cognito_auth.client_id or "not-configured", 
            "region": cognito_auth.region,
            "mock_mode": cognito_auth.mock_mode,
            "jwks_url": getattr(cognito_auth, 'jwks_url', 'not-configured')
        },
        "message": "Cognito authentication service" + (" (mock mode)" if cognito_auth.mock_mode else " (production mode)")
    }

# Dependency for protected routes
async def get_current_user_dependency(credentials: HTTPAuthorizationCredentials = Depends(security)) -> Dict[str, Any]:
    """
    Dependency to get current user for protected routes
    """
    token_payload = cognito_auth.verify_token(credentials.credentials)
    return cognito_auth.get_user_info(token_payload)
