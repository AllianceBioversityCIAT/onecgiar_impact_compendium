"""
Authentication API router with AWS Cognito integration.
"""

import os
import boto3
from typing import Dict, Any
from fastapi import APIRouter, HTTPException, Depends, status
from pydantic import BaseModel, EmailStr
from botocore.exceptions import ClientError
from app.middleware.auth import get_current_user, get_current_user_optional
import logging

logger = logging.getLogger(__name__)
router = APIRouter()

# Pydantic models
class LoginRequest(BaseModel):
    email: EmailStr
    password: str

class SignupRequest(BaseModel):
    email: EmailStr
    password: str
    name: str
    organization: str = None

class ChangePasswordRequest(BaseModel):
    old_password: str
    new_password: str

class UserProfile(BaseModel):
    sub: str
    email: str
    name: str = None
    organization: str = None
    groups: list = []

# Cognito client
def get_cognito_client():
    return boto3.client('cognito-idp', region_name=os.getenv('COGNITO_REGION', 'us-east-1'))

@router.post("/login")
async def login(request: LoginRequest):
    """Authenticate user with Cognito."""
    try:
        client = get_cognito_client()
        
        response = client.admin_initiate_auth(
            UserPoolId=os.getenv('COGNITO_USER_POOL_ID'),
            ClientId=os.getenv('COGNITO_CLIENT_ID'),
            AuthFlow='ADMIN_NO_SRP_AUTH',
            AuthParameters={
                'USERNAME': request.email,
                'PASSWORD': request.password
            }
        )
        
        auth_result = response['AuthenticationResult']
        
        return {
            "access_token": auth_result['AccessToken'],
            "id_token": auth_result['IdToken'],
            "refresh_token": auth_result['RefreshToken'],
            "expires_in": auth_result['ExpiresIn'],
            "token_type": auth_result['TokenType']
        }
        
    except ClientError as e:
        error_code = e.response['Error']['Code']
        if error_code == 'NotAuthorizedException':
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="Invalid email or password"
            )
        elif error_code == 'UserNotConfirmedException':
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="User email not verified"
            )
        else:
            logger.error(f"Cognito login error: {e}")
            raise HTTPException(
                status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                detail="Authentication service error"
            )

@router.post("/signup")
async def signup(request: SignupRequest):
    """Register new user with Cognito."""
    try:
        client = get_cognito_client()
        
        response = client.admin_create_user(
            UserPoolId=os.getenv('COGNITO_USER_POOL_ID'),
            Username=request.email,
            UserAttributes=[
                {'Name': 'email', 'Value': request.email},
                {'Name': 'name', 'Value': request.name},
                {'Name': 'email_verified', 'Value': 'true'}
            ] + ([{'Name': 'custom:organization', 'Value': request.organization}] if request.organization else []),
            TemporaryPassword=request.password,
            MessageAction='SUPPRESS'
        )
        
        # Set permanent password
        client.admin_set_user_password(
            UserPoolId=os.getenv('COGNITO_USER_POOL_ID'),
            Username=request.email,
            Password=request.password,
            Permanent=True
        )
        
        # Add to Researcher group by default
        try:
            client.admin_add_user_to_group(
                UserPoolId=os.getenv('COGNITO_USER_POOL_ID'),
                Username=request.email,
                GroupName='Researcher'
            )
        except ClientError:
            pass  # Group might not exist yet
        
        return {"message": "User created successfully", "username": request.email}
        
    except ClientError as e:
        error_code = e.response['Error']['Code']
        if error_code == 'UsernameExistsException':
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="User already exists"
            )
        else:
            logger.error(f"Cognito signup error: {e}")
            raise HTTPException(
                status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                detail="User creation failed"
            )

@router.get("/me", response_model=UserProfile)
async def get_profile(current_user: Dict[str, Any] = Depends(get_current_user)):
    """Get current user profile."""
    try:
        client = get_cognito_client()
        
        response = client.admin_get_user(
            UserPoolId=os.getenv('COGNITO_USER_POOL_ID'),
            Username=current_user['username']
        )
        
        # Extract user attributes
        attributes = {attr['Name']: attr['Value'] for attr in response['UserAttributes']}
        
        return UserProfile(
            sub=current_user['sub'],
            email=current_user['email'],
            name=attributes.get('name'),
            organization=attributes.get('custom:organization'),
            groups=current_user.get('groups', [])
        )
        
    except ClientError as e:
        logger.error(f"Error fetching user profile: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to fetch user profile"
        )

@router.post("/refresh")
async def refresh_token(refresh_token: str):
    """Refresh access token."""
    try:
        client = get_cognito_client()
        
        response = client.admin_initiate_auth(
            UserPoolId=os.getenv('COGNITO_USER_POOL_ID'),
            ClientId=os.getenv('COGNITO_CLIENT_ID'),
            AuthFlow='REFRESH_TOKEN_AUTH',
            AuthParameters={
                'REFRESH_TOKEN': refresh_token
            }
        )
        
        auth_result = response['AuthenticationResult']
        
        return {
            "access_token": auth_result['AccessToken'],
            "id_token": auth_result['IdToken'],
            "expires_in": auth_result['ExpiresIn'],
            "token_type": auth_result['TokenType']
        }
        
    except ClientError as e:
        logger.error(f"Token refresh error: {e}")
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid refresh token"
        )

@router.post("/logout")
async def logout(current_user: Dict[str, Any] = Depends(get_current_user)):
    """Logout user (invalidate tokens)."""
    try:
        client = get_cognito_client()
        
        client.admin_user_global_sign_out(
            UserPoolId=os.getenv('COGNITO_USER_POOL_ID'),
            Username=current_user['username']
        )
        
        return {"message": "Logged out successfully"}
        
    except ClientError as e:
        logger.error(f"Logout error: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Logout failed"
        )
