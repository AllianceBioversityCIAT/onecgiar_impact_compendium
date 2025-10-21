"""
Authentication API router
Handles user authentication and JWT token management
"""

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session

from app.config.database import get_database
from app.schemas.user import (
    LoginRequest,
    LoginResponse,
    TokenRefreshRequest,
    TokenRefreshResponse,
    UserProfile
)
from app.services.auth_service import (
    authenticate_user,
    create_access_token,
    refresh_access_token,
    get_current_user
)
from app.schemas.user import User as UserSchema
import logging

logger = logging.getLogger(__name__)
router = APIRouter()

@router.post("/login", response_model=LoginResponse)
async def login(
    login_data: LoginRequest,
    db: Session = Depends(get_database)
):
    """
    Authenticate user with email and password
    """
    try:
        # Authenticate with Cognito
        auth_result = await authenticate_user(login_data.email, login_data.password)
        
        if not auth_result:
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="Invalid email or password"
            )
        
        # Get or create user in database
        user = await get_or_create_user_from_cognito(
            auth_result["cognito_sub"],
            login_data.email,
            db
        )
        
        # Create response
        response = LoginResponse(
            access_token=auth_result["access_token"],
            refresh_token=auth_result["refresh_token"],
            expires_in=auth_result["expires_in"],
            user=UserProfile(
                id=user.id,
                email=user.email,
                name=user.name,
                role=user.role,
                organization=user.organization,
                center=user.center
            )
        )
        
        logger.info(f"User {user.email} logged in successfully")
        return response
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Login error: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Authentication failed"
        )

@router.post("/refresh", response_model=TokenRefreshResponse)
async def refresh_token(
    refresh_data: TokenRefreshRequest
):
    """
    Refresh access token using refresh token
    """
    try:
        new_token = await refresh_access_token(refresh_data.refresh_token)
        
        if not new_token:
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="Invalid refresh token"
            )
        
        return TokenRefreshResponse(
            access_token=new_token["access_token"],
            expires_in=new_token["expires_in"]
        )
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Token refresh error: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Token refresh failed"
        )

@router.post("/logout")
async def logout(
    current_user: UserSchema = Depends(get_current_user)
):
    """
    Logout user (invalidate tokens)
    """
    try:
        # TODO: Implement token invalidation with Cognito
        logger.info(f"User {current_user.email} logged out")
        return {"message": "Logged out successfully"}
        
    except Exception as e:
        logger.error(f"Logout error: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Logout failed"
        )

@router.get("/profile", response_model=UserProfile)
async def get_profile(
    current_user: UserSchema = Depends(get_current_user)
):
    """
    Get current user profile
    """
    return UserProfile(
        id=current_user.id,
        email=current_user.email,
        name=current_user.name,
        role=current_user.role,
        organization=current_user.organization,
        center=current_user.center
    )

async def get_or_create_user_from_cognito(cognito_sub: str, email: str, db: Session):
    """
    Get existing user or create new user from Cognito data
    """
    from app.models.user import User
    
    # Try to find existing user
    user = db.query(User).filter(User.cognito_sub == cognito_sub).first()
    
    if not user:
        # Create new user
        user = User(
            email=email,
            name=email.split("@")[0],  # Default name from email
            cognito_sub=cognito_sub,
            email_verified=True
        )
        db.add(user)
        db.commit()
        db.refresh(user)
        logger.info(f"Created new user {user.email} from Cognito")
    
    return user
