"""
Users router with AWS Cognito integration and JWT authentication
"""

from typing import Dict, Any, List
from fastapi import APIRouter, Depends, HTTPException, status
from pydantic import BaseModel, EmailStr
import logging

from app.middleware.auth import require_admin
from app.services.cognito_user_service import CognitoUserService

logger = logging.getLogger(__name__)
router = APIRouter()

# Initialize Cognito User Service
cognito_service = CognitoUserService()

class CreateUserRequest(BaseModel):
    email: EmailStr
    name: str
    role: str = "researcher"

class UpdateUserRequest(BaseModel):
    name: str
    role: str

@router.get("/", response_model=Dict[str, Any])
async def list_users(current_user: Dict[str, Any] = Depends(require_admin)):
    """
    List all users in Cognito User Pool
    """
    try:
        users = cognito_service.list_users()
        return {
            "success": True,
            "data": users,
            "total": len(users)
        }
    except Exception as e:
        logger.error(f"Error listing users: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to list users: {str(e)}"
        )

@router.post("/", response_model=Dict[str, Any])
async def create_user(
    user_data: CreateUserRequest,
    current_user: Dict[str, Any] = Depends(require_admin)
):
    """
    Create a new user in Cognito User Pool
    """
    try:
        result = cognito_service.create_user(
            email=user_data.email,
            name=user_data.name,
            role=user_data.role
        )
        return {
            "success": True,
            "message": "User created successfully",
            "data": result
        }
    except Exception as e:
        logger.error(f"Error creating user: {e}")
        if "UsernameExistsException" in str(e):
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="User with this email already exists"
            )
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to create user: {str(e)}"
        )

@router.put("/{username}", response_model=Dict[str, Any])
async def update_user(
    username: str,
    user_data: UpdateUserRequest,
    current_user: Dict[str, Any] = Depends(require_admin)
):
    """
    Update user information in Cognito User Pool
    """
    try:
        result = cognito_service.update_user(
            username=username,
            name=user_data.name,
            role=user_data.role
        )
        return {
            "success": True,
            "message": "User updated successfully",
            "data": result
        }
    except Exception as e:
        logger.error(f"Error updating user: {e}")
        if "UserNotFoundException" in str(e):
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="User not found"
            )
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to update user: {str(e)}"
        )

@router.delete("/{username}", response_model=Dict[str, Any])
async def delete_user(
    username: str,
    current_user: Dict[str, Any] = Depends(require_admin)
):
    """
    Delete user from Cognito User Pool
    """
    try:
        result = cognito_service.delete_user(username)
        return {
            "success": True,
            "message": "User deleted successfully",
            "data": result
        }
    except Exception as e:
        logger.error(f"Error deleting user: {e}")
        if "UserNotFoundException" in str(e):
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="User not found"
            )
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to delete user: {str(e)}"
        )

@router.post("/{username}/reset-password", response_model=Dict[str, Any])
async def reset_user_password(
    username: str,
    current_user: Dict[str, Any] = Depends(require_admin)
):
    """
    Reset user password in Cognito User Pool
    """
    try:
        result = cognito_service.reset_password(username)
        return {
            "success": True,
            "message": "Password reset successfully",
            "data": result
        }
    except Exception as e:
        logger.error(f"Error resetting password: {e}")
        if "UserNotFoundException" in str(e):
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="User not found"
            )
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to reset password: {str(e)}"
        )

# Group Management Endpoints
@router.get("/groups", response_model=Dict[str, Any])
async def list_groups(current_user: Dict[str, Any] = Depends(require_admin)):
    """
    List all groups in Cognito User Pool
    """
    try:
        groups = cognito_service.list_groups()
        return {
            "success": True,
            "data": groups,
            "total": len(groups)
        }
    except Exception as e:
        logger.error(f"Error listing groups: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to list groups: {str(e)}"
        )

class CreateGroupRequest(BaseModel):
    group_name: str
    description: str = ""

@router.post("/groups", response_model=Dict[str, Any])
async def create_group(
    group_data: CreateGroupRequest,
    current_user: Dict[str, Any] = Depends(require_admin)
):
    """
    Create a new group in Cognito User Pool
    """
    try:
        result = cognito_service.create_group(
            group_name=group_data.group_name,
            description=group_data.description
        )
        return {
            "success": True,
            "message": "Group created successfully",
            "data": result
        }
    except Exception as e:
        logger.error(f"Error creating group: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to create group: {str(e)}"
        )

class UserGroupRequest(BaseModel):
    group_name: str

@router.post("/{username}/groups", response_model=Dict[str, Any])
async def add_user_to_group(
    username: str,
    group_data: UserGroupRequest,
    current_user: Dict[str, Any] = Depends(require_admin)
):
    """
    Add user to a group
    """
    try:
        result = cognito_service.add_user_to_group(username, group_data.group_name)
        return {
            "success": True,
            "message": f"User added to group {group_data.group_name}",
            "data": result
        }
    except Exception as e:
        logger.error(f"Error adding user to group: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to add user to group: {str(e)}"
        )

@router.delete("/{username}/groups/{group_name}", response_model=Dict[str, Any])
async def remove_user_from_group(
    username: str,
    group_name: str,
    current_user: Dict[str, Any] = Depends(require_admin)
):
    """
    Remove user from a group
    """
    try:
        result = cognito_service.remove_user_from_group(username, group_name)
        return {
            "success": True,
            "message": f"User removed from group {group_name}",
            "data": result
        }
    except Exception as e:
        logger.error(f"Error removing user from group: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to remove user from group: {str(e)}"
        )
