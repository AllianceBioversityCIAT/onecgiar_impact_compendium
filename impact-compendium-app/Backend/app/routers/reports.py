"""
Reports router with simplified responses
"""

from typing import Dict, Any
from fastapi import APIRouter, Depends, HTTPException, status, Query
from sqlalchemy.orm import Session
from sqlalchemy import text

from app.db.connection import get_db
import logging

logger = logging.getLogger(__name__)
router = APIRouter()

@router.get("/summary", response_model=Dict[str, Any])
async def get_reports_summary(db: Session = Depends(get_db)):
    """
    Get reports summary with key metrics
    """
    try:
        # Studies by year
        year_query = text("""
            SELECT year, COUNT(*) as count
            FROM studies 
            WHERE is_active = 1 AND year IS NOT NULL
            GROUP BY year 
            ORDER BY year DESC
            LIMIT 10
        """)
        year_result = db.execute(year_query)
        studies_by_year = [{"year": row[0], "count": row[1]} for row in year_result.fetchall()]
        
        # Studies by category
        category_query = text("""
            SELECT sc.name, COUNT(s.study_id) as count
            FROM studies s
            LEFT JOIN studies_categories sc ON s.category_id = sc.study_category_id
            WHERE s.is_active = 1
            GROUP BY sc.name
            ORDER BY count DESC
            LIMIT 10
        """)
        category_result = db.execute(category_query)
        studies_by_category = [{"category": row[0] or "Uncategorized", "count": row[1]} for row in category_result.fetchall()]
        
        return {
            "success": True,
            "data": {
                "studies_by_year": studies_by_year,
                "studies_by_category": studies_by_category
            }
        }
        
    except Exception as e:
        logger.error(f"Error getting reports summary: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to retrieve reports summary: {str(e)}"
        )

@router.get("/export", response_model=Dict[str, Any])
async def export_studies(
    format: str = Query("json", description="Export format: json, csv"),
    limit: int = Query(100, ge=1, le=1000, description="Number of records to export"),
    db: Session = Depends(get_db)
):
    """
    Export studies data
    """
    try:
        query = text("""
            SELECT study_id, title, year, summary, created_at
            FROM studies 
            WHERE is_active = 1
            ORDER BY created_at DESC
            LIMIT :limit
        """)
        
        result = db.execute(query, {"limit": limit})
        studies = result.fetchall()
        
        if format.lower() == "csv":
            # For CSV format, return structured data that can be converted to CSV
            return {
                "success": True,
                "format": "csv",
                "headers": ["study_id", "title", "year", "summary", "created_at"],
                "data": [
                    [row[0], row[1], row[2], row[3], row[4].isoformat() if row[4] else None]
                    for row in studies
                ],
                "count": len(studies)
            }
        else:
            # JSON format (default)
            return {
                "success": True,
                "format": "json",
                "data": [
                    {
                        "study_id": row[0],
                        "title": row[1],
                        "year": row[2],
                        "summary": row[3],
                        "created_at": row[4].isoformat() if row[4] else None
                    }
                    for row in studies
                ],
                "count": len(studies)
            }
        
    except Exception as e:
        logger.error(f"Error exporting studies: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to export studies: {str(e)}"
        )
