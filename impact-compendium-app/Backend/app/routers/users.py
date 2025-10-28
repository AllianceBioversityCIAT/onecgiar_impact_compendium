"""
User Management API Router
"""

from fastapi import APIRouter, HTTPException, Depends
from typing import List, Dict, Any
from pydantic import BaseModel, EmailStr
from app.services.cognito_service import CognitoUserService

router = APIRouter()

class CreateUserRequest(BaseModel):
    email: EmailStr
    temporary_password: str
    send_email: bool = True

class UpdateUserStatusRequest(BaseModel):
    enabled: bool

@router.get("/users", response_model=List[Dict[str, Any]])
async def list_users(limit: int = 60):
    """List all users in Cognito User Pool"""
    try:
        service = CognitoUserService()
        users = await service.list_users(limit=limit)
        return users
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@router.get("/users/{username}", response_model=Dict[str, Any])
async def get_user(username: str):
    """Get a specific user by username"""
    try:
        service = CognitoUserService()
        user = await service.get_user(username)
        return user
    except Exception as e:
        raise HTTPException(status_code=404, detail=str(e))

@router.post("/users", response_model=Dict[str, Any])
async def create_user(request: CreateUserRequest):
    """Create a new user"""
    try:
        service = CognitoUserService()
        result = await service.create_user(
            email=request.email,
            temporary_password=request.temporary_password,
            send_email=request.send_email
        )
        return result
    except Exception as e:
        error_message = str(e)
        if "User account already exists" in error_message:
            raise HTTPException(status_code=400, detail=f"A user with email {request.email} already exists")
        elif "temporarily unavailable" in error_message:
            raise HTTPException(status_code=400, detail=error_message)
        elif "InvalidParameterException" in error_message:
            raise HTTPException(status_code=400, detail="Invalid user data provided")
        else:
            raise HTTPException(status_code=400, detail=str(e))

@router.put("/users/{username}/status")
async def update_user_status(username: str, request: UpdateUserStatusRequest):
    """Enable or disable a user"""
    try:
        service = CognitoUserService()
        success = await service.update_user_status(username, request.enabled)
        return {"success": success, "message": f"User {'enabled' if request.enabled else 'disabled'} successfully"}
    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e))

@router.delete("/users/{username}")
async def delete_user(username: str):
    """Delete a user"""
    try:
        service = CognitoUserService()
        success = await service.delete_user(username)
        return {"success": success, "message": "User deleted successfully"}
    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e))

@router.post("/users/{username}/reset-password")
async def reset_user_password(username: str):
    """Reset user password"""
    try:
        service = CognitoUserService()
        success = await service.reset_user_password(username)
        return {"success": success, "message": "Password reset successfully"}
    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e))
