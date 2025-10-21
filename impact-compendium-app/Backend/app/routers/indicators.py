"""
Indicators API router
Handles indicator management and CLARISA data
"""

from typing import List
from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy.orm import Session
from sqlalchemy import or_

from app.config.database import get_database
from app.models.indicator import ClarisaIndicator
from app.schemas.indicator import (
    Indicator,
    IndicatorCreate,
    IndicatorSearchParams,
    IndicatorSearchResponse
)
from app.services.auth_service import get_current_user
from app.schemas.user import User as UserSchema
import logging

logger = logging.getLogger(__name__)
router = APIRouter()

@router.get("/", response_model=IndicatorSearchResponse)
async def list_indicators(
    q: str = Query(None, description="Search query"),
    indicator_type: str = Query(None, description="Filter by type"),
    category: str = Query(None, description="Filter by category"),
    active: bool = Query(True, description="Filter by active status"),
    page: int = Query(1, ge=1, description="Page number"),
    size: int = Query(20, ge=1, le=100, description="Page size"),
    db: Session = Depends(get_database),
    current_user: UserSchema = Depends(get_current_user)
):
    """
    List indicators with search and filtering
    """
    try:
        # Build query
        query = db.query(ClarisaIndicator)
        
        # Apply filters
        if active is not None:
            query = query.filter(ClarisaIndicator.active == active)
        
        if q:
            search_filter = or_(
                ClarisaIndicator.name.ilike(f"%{q}%"),
                ClarisaIndicator.description.ilike(f"%{q}%")
            )
            query = query.filter(search_filter)
        
        if indicator_type:
            query = query.filter(ClarisaIndicator.indicator_type == indicator_type)
        
        if category:
            query = query.filter(ClarisaIndicator.category == category)
        
        # Order by name
        query = query.order_by(ClarisaIndicator.name)
        
        # Get total count
        total = query.count()
        
        # Apply pagination
        offset = (page - 1) * size
        indicators = query.offset(offset).limit(size).all()
        
        # Calculate pages
        pages = (total + size - 1) // size
        
        return IndicatorSearchResponse(
            indicators=indicators,
            total=total,
            page=page,
            size=size,
            pages=pages
        )
        
    except Exception as e:
        logger.error(f"Error listing indicators: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to retrieve indicators"
        )

@router.get("/{indicator_id}", response_model=Indicator)
async def get_indicator(
    indicator_id: int,
    db: Session = Depends(get_database),
    current_user: UserSchema = Depends(get_current_user)
):
    """
    Get a specific indicator by ID
    """
    indicator = db.query(ClarisaIndicator).filter(
        ClarisaIndicator.id == indicator_id
    ).first()
    
    if not indicator:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Indicator not found"
        )
    
    return indicator

@router.post("/", response_model=Indicator, status_code=status.HTTP_201_CREATED)
async def create_indicator(
    indicator_data: IndicatorCreate,
    db: Session = Depends(get_database),
    current_user: UserSchema = Depends(get_current_user)
):
    """
    Create a new indicator (admin only)
    """
    # Check admin permissions
    if current_user.role != "admin":
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Only administrators can create indicators"
        )
    
    try:
        indicator = ClarisaIndicator(**indicator_data.dict())
        db.add(indicator)
        db.commit()
        db.refresh(indicator)
        
        logger.info(f"Created indicator {indicator.id} by user {current_user.id}")
        return indicator
        
    except Exception as e:
        db.rollback()
        logger.error(f"Error creating indicator: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to create indicator"
        )

@router.get("/types/", response_model=List[str])
async def get_indicator_types(
    db: Session = Depends(get_database),
    current_user: UserSchema = Depends(get_current_user)
):
    """
    Get all unique indicator types
    """
    try:
        types = db.query(ClarisaIndicator.indicator_type).filter(
            ClarisaIndicator.indicator_type.isnot(None),
            ClarisaIndicator.active == True
        ).distinct().all()
        
        return [t[0] for t in types if t[0]]
        
    except Exception as e:
        logger.error(f"Error getting indicator types: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to retrieve indicator types"
        )

@router.get("/categories/", response_model=List[str])
async def get_indicator_categories(
    db: Session = Depends(get_database),
    current_user: UserSchema = Depends(get_current_user)
):
    """
    Get all unique indicator categories
    """
    try:
        categories = db.query(ClarisaIndicator.category).filter(
            ClarisaIndicator.category.isnot(None),
            ClarisaIndicator.active == True
        ).distinct().all()
        
        return [c[0] for c in categories if c[0]]
        
    except Exception as e:
        logger.error(f"Error getting indicator categories: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to retrieve indicator categories"
        )
