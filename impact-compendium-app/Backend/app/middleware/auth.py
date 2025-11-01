"""
JWT Authentication middleware for protected routes
"""

from typing import Dict, Any, Optional
from fastapi import HTTPException, status, Depends
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from app.services.cognito_auth import cognito_auth
import logging

logger = logging.getLogger(__name__)
security = HTTPBearer()

async def get_current_user(credentials: HTTPAuthorizationCredentials = Depends(security)) -> Dict[str, Any]:
    """
    Dependency to get current authenticated user from JWT token
    
    Args:
        credentials: HTTP Bearer token from Authorization header
        
    Returns:
        Dict containing user information
        
    Raises:
        HTTPException: If token is invalid or user not authenticated
    """
    try:
        # Verify the JWT token
        token_payload = cognito_auth.verify_token(credentials.credentials)
        
        # Extract user information
        user_info = cognito_auth.get_user_info(token_payload)
        
        logger.debug(f"Authenticated user: {user_info.get('email')}")
        return user_info
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Authentication error: {e}")
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Authentication failed",
            headers={"WWW-Authenticate": "Bearer"},
        )

async def get_current_user_optional(credentials: Optional[HTTPAuthorizationCredentials] = Depends(HTTPBearer(auto_error=False))) -> Optional[Dict[str, Any]]:
    """
    Optional authentication dependency - returns None if no token provided
    
    Args:
        credentials: Optional HTTP Bearer token
        
    Returns:
        Dict containing user information or None if not authenticated
    """
    if not credentials:
        return None
        
    try:
        return await get_current_user(credentials)
    except HTTPException:
        return None

def require_admin(current_user: Dict[str, Any] = Depends(get_current_user)) -> Dict[str, Any]:
    """
    Dependency that requires admin role
    
    Args:
        current_user: Current authenticated user
        
    Returns:
        Dict containing user information
        
    Raises:
        HTTPException: If user is not admin
    """
    user_groups = current_user.get("groups", [])
    logger.debug(f"User {current_user.get('email')} has groups: {user_groups}")
    
    if "admin" not in user_groups and "administrators" not in user_groups:
        logger.warning(f"Access denied for user {current_user.get('email')} - missing admin group")
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Admin access required"
        )
    
    return current_user

def require_researcher(current_user: Dict[str, Any] = Depends(get_current_user)) -> Dict[str, Any]:
    """
    Dependency that requires researcher role or higher
    
    Args:
        current_user: Current authenticated user
        
    Returns:
        Dict containing user information
        
    Raises:
        HTTPException: If user is not researcher or admin
    """
    user_groups = current_user.get("groups", [])
    
    allowed_groups = ["admin", "administrators", "researcher", "researchers"]
    if not any(group in user_groups for group in allowed_groups):
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Researcher access required"
        )
    
    return current_user
