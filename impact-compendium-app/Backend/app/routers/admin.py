"""
Admin API router
Handles administrative operations
"""

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session

from app.config.database import get_database
from app.services.auth_service import get_current_user
from app.schemas.user import User as UserSchema
import logging

logger = logging.getLogger(__name__)
router = APIRouter()

@router.get("/users")
async def list_users(
    db: Session = Depends(get_database),
    current_user: UserSchema = Depends(get_current_user)
):
    """
    List all users (admin only)
    """
    if current_user.role != "admin":
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Admin access required"
        )
    
    # TODO: Implement user listing
    return {"message": "Admin user listing - to be implemented in Sprint 6"}

@router.get("/stats")
async def get_admin_stats(
    db: Session = Depends(get_database),
    current_user: UserSchema = Depends(get_current_user)
):
    """
    Get administrative statistics
    """
    if current_user.role != "admin":
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Admin access required"
        )
    
    # TODO: Implement admin statistics
    return {"message": "Admin statistics - to be implemented in Sprint 6"}
