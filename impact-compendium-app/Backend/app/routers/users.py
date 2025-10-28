"""
User Management Router

Provides endpoints for managing Cognito users and groups.
Requires admin authentication for all operations.

Author: Impact Compendium Team
Version: 1.0.0
"""

from fastapi import APIRouter, Depends, HTTPException
from app.middleware.auth import require_admin
from app.services.cognito_user_service import CognitoUserService
import logging

logger = logging.getLogger(__name__)
router = APIRouter()
cognito_service = CognitoUserService()


@router.get("/")
async def list_users(current_user: dict = Depends(require_admin)):
    """
    List all users from Cognito User Pool
    
    Returns:
        List of users with their attributes and group memberships
        
    Raises:
        HTTPException: If user retrieval fails
    """
    try:
        users = cognito_service.list_users()
        return users
    except Exception as e:
        logger.error(f"Failed to list users: {e}")
        raise HTTPException(status_code=500, detail="Failed to retrieve users")


@router.get("/groups")
async def list_groups(current_user: dict = Depends(require_admin)):
    """
    List all groups from Cognito User Pool
    
    Returns:
        List of groups with their descriptions and metadata
        
    Raises:
        HTTPException: If group retrieval fails
    """
    try:
        groups = cognito_service.list_groups()
        return groups
    except Exception as e:
        logger.error(f"Failed to list groups: {e}")
        raise HTTPException(status_code=500, detail="Failed to retrieve groups")
