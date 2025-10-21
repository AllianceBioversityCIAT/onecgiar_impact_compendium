"""
User and Authentication Pydantic schemas
"""

from datetime import datetime
from typing import Optional
from pydantic import BaseModel, Field, EmailStr

from app.models.user import UserRole

class UserBase(BaseModel):
    """Base user schema"""
    email: EmailStr
    name: str = Field(..., min_length=1, max_length=255)
    role: UserRole = Field(default=UserRole.RESEARCHER)
    organization: Optional[str] = Field(None, max_length=255)
    center: Optional[str] = Field(None, max_length=255)
    country: Optional[str] = Field(None, max_length=100)

class UserCreate(UserBase):
    """Schema for creating a user"""
    cognito_sub: str = Field(..., description="Cognito user ID")

class UserUpdate(BaseModel):
    """Schema for updating a user"""
    name: Optional[str] = Field(None, min_length=1, max_length=255)
    role: Optional[UserRole] = None
    organization: Optional[str] = Field(None, max_length=255)
    center: Optional[str] = Field(None, max_length=255)
    country: Optional[str] = Field(None, max_length=100)

class User(UserBase):
    """User response schema"""
    id: int
    is_active: bool
    email_verified: bool
    created_at: datetime
    updated_at: datetime
    last_login: Optional[datetime] = None
    
    class Config:
        from_attributes = True

class UserProfile(BaseModel):
    """User profile schema (limited info)"""
    id: int
    email: str
    name: str
    role: UserRole
    organization: Optional[str] = None
    center: Optional[str] = None
    
    class Config:
        from_attributes = True

# Authentication schemas
class LoginRequest(BaseModel):
    """Login request schema"""
    email: EmailStr
    password: str = Field(..., min_length=8)

class LoginResponse(BaseModel):
    """Login response schema"""
    access_token: str
    refresh_token: str
    token_type: str = "bearer"
    expires_in: int
    user: UserProfile

class TokenRefreshRequest(BaseModel):
    """Token refresh request schema"""
    refresh_token: str

class TokenRefreshResponse(BaseModel):
    """Token refresh response schema"""
    access_token: str
    token_type: str = "bearer"
    expires_in: int
