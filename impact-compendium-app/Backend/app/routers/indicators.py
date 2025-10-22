"""
Indicators router with simplified responses
"""

from typing import Dict, Any
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from sqlalchemy import text

from app.db.connection import get_db
import logging

logger = logging.getLogger(__name__)
router = APIRouter()

@router.get("/", response_model=Dict[str, Any])
async def list_indicators(db: Session = Depends(get_db)):
    """
    List all study indicators
    """
    try:
        query = text("""
            SELECT indicator_id, study_id, indicator_measure, unit_of_measure, 
                   result_reported, is_active, created_at
            FROM studies_indicators 
            WHERE is_active = 1
            ORDER BY created_at DESC
            LIMIT 100
        """)
        
        result = db.execute(query)
        indicators = result.fetchall()
        
        return {
            "success": True,
            "data": [
                {
                    "indicator_id": row[0],
                    "study_id": row[1],
                    "indicator_measure": row[2],
                    "unit_of_measure": row[3],
                    "result_reported": row[4],
                    "is_active": bool(row[5]),
                    "created_at": row[6].isoformat() if row[6] else None
                }
                for row in indicators
            ],
            "count": len(indicators)
        }
        
    except Exception as e:
        logger.error(f"Error listing indicators: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to retrieve indicators: {str(e)}"
        )

@router.get("/study/{study_id}", response_model=Dict[str, Any])
async def get_study_indicators(
    study_id: int,
    db: Session = Depends(get_db)
):
    """
    Get indicators for a specific study
    """
    try:
        query = text("""
            SELECT indicator_id, study_id, indicator_measure, unit_of_measure, 
                   result_reported, is_active, created_at
            FROM studies_indicators 
            WHERE study_id = :study_id AND is_active = 1
            ORDER BY created_at DESC
        """)
        
        result = db.execute(query, {"study_id": study_id})
        indicators = result.fetchall()
        
        return {
            "success": True,
            "study_id": study_id,
            "data": [
                {
                    "indicator_id": row[0],
                    "study_id": row[1],
                    "indicator_measure": row[2],
                    "unit_of_measure": row[3],
                    "result_reported": row[4],
                    "is_active": bool(row[5]),
                    "created_at": row[6].isoformat() if row[6] else None
                }
                for row in indicators
            ],
            "count": len(indicators)
        }
        
    except Exception as e:
        logger.error(f"Error getting indicators for study {study_id}: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to retrieve study indicators: {str(e)}"
        )
