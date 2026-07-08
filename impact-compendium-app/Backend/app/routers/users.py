"""
User Management Router

Provides comprehensive REST API endpoints for managing AWS Cognito users and groups.
All endpoints require admin authentication and include proper error handling.

Features:
- User CRUD operations (list, delete, update status, reset password)
- Group CRUD operations (list, create, delete)
- User-group assignment management
- Comprehensive error handling and logging
- Pydantic models for request validation

Author: Impact Compendium Team
Version: 1.0.0
"""

import logging
import os

from fastapi import APIRouter, Depends, HTTPException
from pydantic import BaseModel

from app.middleware.auth import require_admin
from app.services.cognito_user_service import CognitoUserService

logger = logging.getLogger(__name__)
router = APIRouter()
cognito_service = CognitoUserService()

# Force service initialization
logger.info("🔧 Forcing CognitoUserService initialization...")
try:
    # This will trigger the __init__ method
    test_result = cognito_service.user_pool_id
    logger.info(f"✅ CognitoUserService initialized with pool: {test_result}")
except Exception as e:
    logger.error(f"❌ CognitoUserService initialization failed: {e}")


# Request models
class CreateGroupRequest(BaseModel):
    """Request model for creating a new group"""

    name: str
    description: str


class AssignUserRequest(BaseModel):
    """Request model for assigning a user to a group"""

    username: str
    group_name: str


class UpdateUserStatusRequest(BaseModel):
    """Request model for updating user enabled/disabled status"""

    enabled: bool


class CreateUserRequest(BaseModel):
    """Request model for creating a new user"""

    email: str
    temporary_password: str
    send_email: bool = True


# User endpoints
@router.get("/", include_in_schema=False)
@router.get("")
async def list_users(current_user: dict = Depends(require_admin)):
    """
    List all users from Cognito User Pool

    Returns:
        List of users with their attributes, groups, and metadata

    Raises:
        HTTPException: 500 if user retrieval fails
    """
    try:
        users = cognito_service.list_users()
        return users
    except Exception as e:
        logger.error(f"Failed to list users: {e}")
        raise HTTPException(status_code=500, detail="Failed to retrieve users")


@router.post("/")
async def create_user(
    user_data: CreateUserRequest, current_user: dict = Depends(require_admin)
):
    """
    Create a new user in Cognito User Pool

    Args:
        user_data: User email, temporary password, and email settings

    Returns:
        Created user information with username and status

    Raises:
        HTTPException: 500 if user creation fails
    """
    try:
        import boto3

        # Use email as username (required by Cognito User Pool configuration)
        username = user_data.email

        # Use boto3 instead of AWS CLI
        user_pool_id = os.getenv("COGNITO_USER_POOL_ID", "us-east-1_yFLIp9zBk")
        cognito_client = boto3.client("cognito-idp", region_name="us-east-1")

        # Create user with conditional email sending
        create_user_params = {
            "UserPoolId": user_pool_id,
            "Username": username,
            "UserAttributes": [
                {"Name": "email", "Value": user_data.email},
                {"Name": "name", "Value": user_data.email.split("@")[0]},
                {"Name": "email_verified", "Value": "true"},
            ],
            "TemporaryPassword": user_data.temporary_password,
        }

        # Only add MessageAction if we want to suppress the email
        if not user_data.send_email:
            create_user_params["MessageAction"] = "SUPPRESS"

        response = cognito_client.admin_create_user(**create_user_params)

        return {
            "username": response["User"]["Username"],
            "email": user_data.email,
            "status": response["User"]["UserStatus"],
            "created": response["User"]["UserCreateDate"],
        }

    except Exception as e:
        logger.error(f"Failed to create user: {e}")
        raise HTTPException(status_code=500, detail="Failed to create user")


@router.put("/{username}/status")
async def update_user_status(
    username: str,
    status_data: UpdateUserStatusRequest,
    current_user: dict = Depends(require_admin),
):
    """
    Update user enabled/disabled status

    Args:
        username: Username to update
        status_data: New status (enabled/disabled)

    Returns:
        Success confirmation with status message

    Raises:
        HTTPException: 500 if status update fails
    """
    try:
        cognito_service.update_user_status(username, status_data.enabled)
        status_text = "enabled" if status_data.enabled else "disabled"
        return {
            "success": True,
            "message": f"User {username} {status_text} successfully",
        }
    except Exception as e:
        logger.error(f"Failed to update user status: {e}")
        raise HTTPException(status_code=500, detail="Failed to update user status")


@router.post("/{username}/reset-password")
async def reset_user_password(
    username: str, current_user: dict = Depends(require_admin)
):
    """
    Send password reset email to user

    Args:
        username: Username to send reset email to

    Returns:
        Success confirmation with instructions

    Raises:
        HTTPException: 500 if password reset fails
    """
    try:
        import boto3

        user_pool_id = os.getenv("COGNITO_USER_POOL_ID", "us-east-1_yFLIp9zBk")
        cognito_client = boto3.client("cognito-idp", region_name="us-east-1")

        # Send password reset email with verification code
        cognito_client.admin_reset_user_password(
            UserPoolId=user_pool_id, Username=username
        )

        return {
            "message": "Password reset email sent successfully",
            "username": username,
            "instructions": "User will receive an email with reset code and instructions",
        }

    except Exception as e:
        logger.error(f"Failed to send password reset email: {e}")
        raise HTTPException(
            status_code=500, detail="Failed to send password reset email"
        )
        return {
            "success": True,
            "message": f"Password reset for user {username}. User will be required to change password on next login.",
        }
    except Exception as e:
        logger.error(f"Failed to reset password: {e}")
        raise HTTPException(status_code=500, detail="Failed to reset password")


@router.delete("/{username}")
async def delete_user(username: str, current_user: dict = Depends(require_admin)):
    """
    Delete a user from Cognito User Pool

    Args:
        username: Username to delete

    Returns:
        Success confirmation

    Raises:
        HTTPException: 500 if user deletion fails
    """
    try:
        cognito_service.delete_user(username)
        return {"success": True, "message": f"User {username} deleted successfully"}
    except Exception as e:
        logger.error(f"Failed to delete user: {e}")
        raise HTTPException(status_code=500, detail="Failed to delete user")


# Group endpoints
@router.get("/groups")
async def list_groups(current_user: dict = Depends(require_admin)):
    """
    List all groups from Cognito User Pool

    Returns:
        List of groups with their descriptions and metadata

    Raises:
        HTTPException: 500 if group retrieval fails
    """
    try:
        groups = cognito_service.list_groups()
        return groups
    except Exception as e:
        logger.error(f"Failed to list groups: {e}")
        raise HTTPException(status_code=500, detail="Failed to retrieve groups")


@router.post("/groups")
async def create_group(
    group_data: CreateGroupRequest, current_user: dict = Depends(require_admin)
):
    """
    Create a new group in Cognito User Pool

    Args:
        group_data: Group name and description

    Returns:
        Created group information

    Raises:
        HTTPException: 500 if group creation fails
    """
    try:
        result = cognito_service.create_group(group_data.name, group_data.description)
        return {"success": True, "group": result}
    except Exception as e:
        logger.error(f"Failed to create group: {e}")
        raise HTTPException(status_code=500, detail="Failed to create group")


@router.delete("/groups/{group_name}")
async def delete_group(group_name: str, current_user: dict = Depends(require_admin)):
    """
    Delete a group from Cognito User Pool

    Args:
        group_name: Name of the group to delete

    Returns:
        Success confirmation

    Raises:
        HTTPException: 500 if group deletion fails
    """
    try:
        cognito_service.delete_group(group_name)
        return {"success": True, "message": f"Group {group_name} deleted successfully"}
    except Exception as e:
        logger.error(f"Failed to delete group: {e}")
        raise HTTPException(status_code=500, detail="Failed to delete group")


# User-group assignment endpoints
@router.post("/groups/assign")
async def assign_user_to_group(
    assignment: AssignUserRequest, current_user: dict = Depends(require_admin)
):
    """
    Assign a user to a group

    Args:
        assignment: Username and group name

    Returns:
        Success confirmation

    Raises:
        HTTPException: 500 if assignment fails
    """
    try:
        cognito_service.add_user_to_group(assignment.username, assignment.group_name)
        return {
            "success": True,
            "message": f"User {assignment.username} added to group {assignment.group_name}",
        }
    except Exception as e:
        logger.error(f"Failed to assign user to group: {e}")
        raise HTTPException(status_code=500, detail="Failed to assign user to group")


@router.delete("/groups/{group_name}/users/{username}")
async def remove_user_from_group(
    group_name: str, username: str, current_user: dict = Depends(require_admin)
):
    """
    Remove a user from a group

    Args:
        group_name: Name of the group
        username: Username to remove

    Returns:
        Success confirmation

    Raises:
        HTTPException: 500 if removal fails
    """
    try:
        cognito_service.remove_user_from_group(username, group_name)
        return {
            "success": True,
            "message": f"User {username} removed from group {group_name}",
        }
    except Exception:
        logger.exception("Failed to remove user from group")
        raise HTTPException(status_code=500, detail="Failed to remove user from group")
