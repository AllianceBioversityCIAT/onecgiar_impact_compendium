"""
Authentication service
Handles AWS Cognito integration and JWT token validation
"""

import boto3
import jwt
from typing import Optional, Dict, Any
from fastapi import Depends, HTTPException, status
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from sqlalchemy.orm import Session
import logging

from app.config.settings import get_settings
from app.config.database import get_database
from app.models.user import User
from app.schemas.user import User as UserSchema

logger = logging.getLogger(__name__)
settings = get_settings()

# Security scheme
security = HTTPBearer()

class AuthService:
    """Authentication service class"""
    
    def __init__(self):
        self.cognito_client = boto3.client('cognito-idp', region_name=settings.cognito_region)
        self.jwks_client = None  # Will be initialized when needed
    
    async def authenticate_user(self, email: str, password: str) -> Optional[Dict[str, Any]]:
        """
        Authenticate user with AWS Cognito
        """
        try:
            # TODO: Implement actual Cognito authentication
            # For now, return mock response for development
            if email == "researcher@cgiar.org" and password == "password":
                return {
                    "access_token": "mock_access_token",
                    "refresh_token": "mock_refresh_token",
                    "expires_in": 3600,
                    "cognito_sub": "mock_user_123"
                }
            
            return None
            
        except Exception as e:
            logger.error(f"Cognito authentication error: {e}")
            return None
    
    async def refresh_token(self, refresh_token: str) -> Optional[Dict[str, Any]]:
        """
        Refresh access token using refresh token
        """
        try:
            # TODO: Implement actual token refresh with Cognito
            return {
                "access_token": "new_mock_access_token",
                "expires_in": 3600
            }
            
        except Exception as e:
            logger.error(f"Token refresh error: {e}")
            return None
    
    async def validate_token(self, token: str) -> Optional[Dict[str, Any]]:
        """
        Validate JWT token and extract user information
        """
        try:
            # TODO: Implement actual JWT validation with Cognito public keys
            # For now, return mock user data for development
            if token == "mock_access_token" or token == "new_mock_access_token":
                return {
                    "sub": "mock_user_123",
                    "email": "researcher@cgiar.org",
                    "cognito:username": "researcher@cgiar.org",
                    "exp": 9999999999  # Far future expiration for testing
                }
            
            return None
            
        except Exception as e:
            logger.error(f"Token validation error: {e}")
            return None

# Global auth service instance
auth_service = AuthService()

# Dependency functions
async def authenticate_user(email: str, password: str) -> Optional[Dict[str, Any]]:
    """Authenticate user dependency"""
    return await auth_service.authenticate_user(email, password)

async def refresh_access_token(refresh_token: str) -> Optional[Dict[str, Any]]:
    """Refresh token dependency"""
    return await auth_service.refresh_token(refresh_token)

async def get_current_user(
    credentials: HTTPAuthorizationCredentials = Depends(security),
    db: Session = Depends(get_database)
) -> UserSchema:
    """
    Get current authenticated user from JWT token
    """
    try:
        # Validate token
        token_data = await auth_service.validate_token(credentials.credentials)
        
        if not token_data:
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="Invalid authentication token",
                headers={"WWW-Authenticate": "Bearer"},
            )
        
        # Get user from database
        user = db.query(User).filter(
            User.cognito_sub == token_data["sub"]
        ).first()
        
        if not user:
            # Create user if not exists (first login)
            user = User(
                email=token_data["email"],
                name=token_data.get("name", token_data["email"].split("@")[0]),
                cognito_sub=token_data["sub"],
                email_verified=True
            )
            db.add(user)
            db.commit()
            db.refresh(user)
            logger.info(f"Created new user from token: {user.email}")
        
        return user
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error getting current user: {e}")
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Could not validate credentials",
            headers={"WWW-Authenticate": "Bearer"},
        )

def create_access_token(data: Dict[str, Any]) -> str:
    """
    Create JWT access token
    """
    # TODO: Implement JWT token creation
    return "mock_access_token"
