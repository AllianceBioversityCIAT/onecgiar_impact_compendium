"""
Studies router with proper error handling and simplified responses
"""

from typing import List, Dict, Any
from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy.orm import Session
from sqlalchemy import text

from app.db.connection import get_db
from app.models.study import Study
from app.schemas.study import StudyResponse, StudyCreate, StudyUpdate
import logging

logger = logging.getLogger(__name__)
router = APIRouter()

@router.get("/", response_model=Dict[str, Any])
async def list_studies(
    skip: int = Query(0, ge=0, description="Number of records to skip"),
    limit: int = Query(10, ge=1, le=100, description="Number of records to return"),
    db: Session = Depends(get_db)
):
    """
    List studies with pagination - returns simplified data structure
    """
    try:
        # Use raw SQL to avoid model relationship issues
        query = text("""
            SELECT study_id, title, year, summary, is_active, created_at, category_id
            FROM studies 
            WHERE is_active = 1
            ORDER BY created_at DESC
            LIMIT :limit OFFSET :skip
        """)
        
        result = db.execute(query, {"limit": limit, "skip": skip})
        studies = result.fetchall()
        
        # Get total count
        count_query = text("SELECT COUNT(*) FROM studies WHERE is_active = 1")
        total_result = db.execute(count_query)
        total = total_result.scalar()
        
        return {
            "success": True,
            "data": [
                {
                    "study_id": row[0],
                    "title": row[1],
                    "year": row[2],
                    "summary": row[3][:200] + "..." if row[3] and len(row[3]) > 200 else row[3],
                    "is_active": bool(row[4]),
                    "created_at": row[5].isoformat() if row[5] else None,
                    "category_id": row[6]
                }
                for row in studies
            ],
            "pagination": {
                "total": total,
                "count": len(studies),
                "skip": skip,
                "limit": limit
            }
        }
        
    except Exception as e:
        logger.error(f"Error listing studies: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to retrieve studies: {str(e)}"
        )

@router.get("/{study_id}", response_model=Dict[str, Any])
async def get_study(
    study_id: int,
    db: Session = Depends(get_db)
):
    """
    Get a specific study by ID
    """
    try:
        query = text("""
            SELECT study_id, title, year, summary, period_start, period_end, 
                   intervention_details, doi, pdf_filename, is_active, 
                   created_at, category_id
            FROM studies 
            WHERE study_id = :study_id AND is_active = 1
        """)
        
        result = db.execute(query, {"study_id": study_id})
        study = result.fetchone()
        
        if not study:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Study not found"
            )
        
        return {
            "success": True,
            "data": {
                "study_id": study[0],
                "title": study[1],
                "year": study[2],
                "summary": study[3],
                "period_start": study[4].isoformat() if study[4] else None,
                "period_end": study[5].isoformat() if study[5] else None,
                "intervention_details": study[6],
                "doi": study[7],
                "pdf_filename": study[8],
                "is_active": bool(study[9]),
                "created_at": study[10].isoformat() if study[10] else None,
                "category_id": study[11]
            }
        }
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error getting study {study_id}: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to retrieve study: {str(e)}"
        )

@router.get("/categories/", response_model=Dict[str, Any])
async def list_categories(db: Session = Depends(get_db)):
    """
    List all study categories
    """
    try:
        query = text("""
            SELECT study_category_id, name, is_active, created_at
            FROM studies_categories 
            WHERE is_active = 1
            ORDER BY name
        """)
        
        result = db.execute(query)
        categories = result.fetchall()
        
        return {
            "success": True,
            "data": [
                {
                    "study_category_id": row[0],
                    "name": row[1],
                    "is_active": bool(row[2]),
                    "created_at": row[3].isoformat() if row[3] else None
                }
                for row in categories
            ],
            "count": len(categories)
        }
        
    except Exception as e:
        logger.error(f"Error listing categories: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to retrieve categories: {str(e)}"
        )

@router.get("/search/", response_model=Dict[str, Any])
async def search_studies(
    q: str = Query(..., description="Search query"),
    skip: int = Query(0, ge=0, description="Number of records to skip"),
    limit: int = Query(10, ge=1, le=100, description="Number of records to return"),
    db: Session = Depends(get_db)
):
    """
    Search studies by title or summary
    """
    try:
        search_term = f"%{q}%"
        
        query = text("""
            SELECT study_id, title, year, summary, is_active, created_at, category_id
            FROM studies 
            WHERE is_active = 1 
            AND (title LIKE :search_term OR summary LIKE :search_term)
            ORDER BY created_at DESC
            LIMIT :limit OFFSET :skip
        """)
        
        result = db.execute(query, {
            "search_term": search_term,
            "limit": limit,
            "skip": skip
        })
        studies = result.fetchall()
        
        # Get total count for search
        count_query = text("""
            SELECT COUNT(*) FROM studies 
            WHERE is_active = 1 
            AND (title LIKE :search_term OR summary LIKE :search_term)
        """)
        total_result = db.execute(count_query, {"search_term": search_term})
        total = total_result.scalar()
        
        return {
            "success": True,
            "query": q,
            "data": [
                {
                    "study_id": row[0],
                    "title": row[1],
                    "year": row[2],
                    "summary": row[3][:200] + "..." if row[3] and len(row[3]) > 200 else row[3],
                    "is_active": bool(row[4]),
                    "created_at": row[5].isoformat() if row[5] else None,
                    "category_id": row[6]
                }
                for row in studies
            ],
            "pagination": {
                "total": total,
                "count": len(studies),
                "skip": skip,
                "limit": limit
            }
        }
        
    except Exception as e:
        logger.error(f"Error searching studies: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to search studies: {str(e)}"
        )
