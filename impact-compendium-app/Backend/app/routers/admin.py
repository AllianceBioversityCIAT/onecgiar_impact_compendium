"""
Admin router with simplified responses
"""

import logging
from typing import Annotated, Any, Dict

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy import text
from sqlalchemy.orm import Session

from app.db.connection import get_db
from app.middleware.auth import require_admin

logger = logging.getLogger(__name__)
router = APIRouter()


@router.get("/stats", response_model=Dict[str, Any])
async def get_admin_stats(
    current_user: Annotated[Dict[str, Any], Depends(require_admin)],
    db: Annotated[Session, Depends(get_db)],
):
    """
    Get admin statistics
    """
    try:
        # Get studies count
        studies_query = text("SELECT COUNT(*) FROM studies WHERE is_active = 1")
        studies_result = db.execute(studies_query)
        studies_count = studies_result.scalar()

        # Get categories count
        categories_query = text("SELECT COUNT(*) FROM categories WHERE is_active = 1")
        categories_result = db.execute(categories_query)
        categories_count = categories_result.scalar()

        # Get indicators count
        indicators_query = text(
            "SELECT COUNT(*) FROM studies_indicators WHERE is_active = 1"
        )
        indicators_result = db.execute(indicators_query)
        indicators_count = indicators_result.scalar()

        # Get recent studies
        recent_query = text(
            """
            SELECT COUNT(*) FROM studies 
            WHERE is_active = 1 AND created_at >= DATE_SUB(NOW(), INTERVAL 30 DAY)
        """
        )
        recent_result = db.execute(recent_query)
        recent_count = recent_result.scalar()

        return {
            "success": True,
            "data": {
                "total_studies": studies_count,
                "total_categories": categories_count,
                "total_indicators": indicators_count,
                "recent_studies_30_days": recent_count,
            },
        }

    except Exception as e:
        logger.error(f"Error getting admin stats: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to retrieve admin statistics: {str(e)}",
        )


@router.get("/health", response_model=Dict[str, Any])
async def admin_health_check(
    current_user: Dict[str, Any] = Depends(require_admin), db: Session = Depends(get_db)
):
    """
    Admin health check endpoint
    """
    try:
        # Test database connection
        test_query = text("SELECT 1")
        db.execute(test_query)

        return {
            "success": True,
            "status": "healthy",
            "database": "connected",
            "timestamp": "2025-01-01T00:00:00Z",  # Will be replaced with actual timestamp
        }

    except Exception as e:
        logger.error(f"Admin health check failed: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Health check failed: {str(e)}",
        )
