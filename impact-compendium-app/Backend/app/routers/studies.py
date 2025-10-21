"""
Studies API router
Handles CRUD operations for research studies
"""

from typing import List
from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy.orm import Session
from sqlalchemy import and_, or_, func

from app.db.connection import get_db
from app.models.study import Study
from app.schemas.study import (
    Study as StudySchema,
    StudyCreate,
    StudyUpdate
)
import logging

logger = logging.getLogger(__name__)
router = APIRouter()

@router.get("/", response_model=List[StudySchema])
async def list_studies(
    skip: int = Query(0, ge=0, description="Number of records to skip"),
    limit: int = Query(10, ge=1, le=100, description="Number of records to return"),
    db: Session = Depends(get_db)
):
    """
    List studies with pagination
    """
    try:
        studies = db.query(Study).offset(skip).limit(limit).all()
        return studies
        
    except Exception as e:
        logger.error(f"Error listing studies: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to retrieve studies"
        )

@router.post("/", response_model=StudySchema, status_code=status.HTTP_201_CREATED)
async def create_study(
    study_data: StudyCreate,
    db: Session = Depends(get_db)
):
    """
    Create a new study
    """
    try:
        # Create study instance
        study = Study(**study_data.dict())
        
        db.add(study)
        db.commit()
        db.refresh(study)
        
        logger.info(f"Created study {study.id}")
        return study
        
    except Exception as e:
        db.rollback()
        logger.error(f"Error creating study: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to create study"
        )

@router.get("/{study_id}", response_model=StudySchema)
async def get_study(
    study_id: int,
    db: Session = Depends(get_db)
):
    """
    Get a specific study by ID
    """
    study = db.query(Study).filter(Study.id == study_id).first()
    
    if not study:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Study not found"
        )
    
    return study

@router.put("/{study_id}", response_model=StudySchema)
async def update_study(
    study_id: int,
    study_data: StudyUpdate,
    db: Session = Depends(get_db)
):
    """
    Update a study
    """
    study = db.query(Study).filter(Study.id == study_id).first()
    
    if not study:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Study not found"
        )
    
    try:
        # Update fields
        update_data = study_data.dict(exclude_unset=True)
        for field, value in update_data.items():
            setattr(study, field, value)
        
        db.commit()
        db.refresh(study)
        
        logger.info(f"Updated study {study.id}")
        return study
        
    except Exception as e:
        db.rollback()
        logger.error(f"Error updating study {study_id}: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to update study"
        )

@router.delete("/{study_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_study(
    study_id: int,
    db: Session = Depends(get_db)
):
    """
    Delete a study
    """
    study = db.query(Study).filter(Study.id == study_id).first()
    
    if not study:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Study not found"
        )
    
    try:
        db.delete(study)
        db.commit()
        
        logger.info(f"Deleted study {study.id}")
        
    except Exception as e:
        db.rollback()
        logger.error(f"Error deleting study {study_id}: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to delete study"
        )
