"""
Reference data router for keywords, intervention types, crop types, and narratives
"""

from typing import Dict, Any
from fastapi import APIRouter, Depends, HTTPException, status, Query
from sqlalchemy.orm import Session
from sqlalchemy import text
from pydantic import BaseModel

from app.db.connection import get_db
import logging

logger = logging.getLogger(__name__)
router = APIRouter()

# Pydantic models
class KeywordCreate(BaseModel):
    keyword: str

class InterventionTypeCreate(BaseModel):
    name: str

class CropTypeCreate(BaseModel):
    name: str

class NarrativeCreate(BaseModel):
    section_key: str
    content: str

# Keywords endpoints
@router.get("/keywords/", response_model=Dict[str, Any])
async def list_keywords(
    skip: int = Query(0, ge=0),
    limit: int = Query(100, ge=1, le=1000),
    db: Session = Depends(get_db)
):
    """List all keywords"""
    try:
        query = text("""
            SELECT keyword_id, keyword, is_active, created_at
            FROM keywords 
            WHERE is_active = 1
            ORDER BY keyword
            LIMIT :limit OFFSET :skip
        """)
        
        result = db.execute(query, {"limit": limit, "skip": skip})
        keywords = result.fetchall()
        
        return {
            "success": True,
            "data": [
                {
                    "keyword_id": row[0],
                    "keyword": row[1],
                    "is_active": bool(row[2]),
                    "created_at": row[3].isoformat() if row[3] else None
                }
                for row in keywords
            ],
            "count": len(keywords)
        }
    except Exception as e:
        logger.error(f"Error listing keywords: {e}")
        raise HTTPException(status_code=500, detail=str(e))

@router.post("/keywords/", response_model=Dict[str, Any])
async def create_keyword(keyword_data: KeywordCreate, db: Session = Depends(get_db)):
    """Create a new keyword"""
    try:
        query = text("""
            INSERT INTO keywords (keyword, is_active, created_at)
            VALUES (:keyword, 1, NOW())
        """)
        
        db.execute(query, {"keyword": keyword_data.keyword})
        db.commit()
        
        return {
            "success": True,
            "message": "Keyword created successfully",
            "data": {"keyword": keyword_data.keyword}
        }
    except Exception as e:
        logger.error(f"Error creating keyword: {e}")
        db.rollback()
        raise HTTPException(status_code=500, detail=str(e))

# Intervention Types endpoints
@router.get("/intervention-types/", response_model=Dict[str, Any])
async def list_intervention_types(db: Session = Depends(get_db)):
    """List all intervention types"""
    try:
        query = text("""
            SELECT intervention_type_id, name, is_active, created_at
            FROM intervention_types 
            WHERE is_active = 1
            ORDER BY name
        """)
        
        result = db.execute(query)
        types = result.fetchall()
        
        return {
            "success": True,
            "data": [
                {
                    "intervention_type_id": row[0],
                    "name": row[1],
                    "is_active": bool(row[2]),
                    "created_at": row[3].isoformat() if row[3] else None
                }
                for row in types
            ],
            "count": len(types)
        }
    except Exception as e:
        logger.error(f"Error listing intervention types: {e}")
        raise HTTPException(status_code=500, detail=str(e))

@router.post("/intervention-types/", response_model=Dict[str, Any])
async def create_intervention_type(type_data: InterventionTypeCreate, db: Session = Depends(get_db)):
    """Create a new intervention type"""
    try:
        query = text("""
            INSERT INTO intervention_types (name, is_active, created_at)
            VALUES (:name, 1, NOW())
        """)
        
        db.execute(query, {"name": type_data.name})
        db.commit()
        
        return {
            "success": True,
            "message": "Intervention type created successfully",
            "data": {"name": type_data.name}
        }
    except Exception as e:
        logger.error(f"Error creating intervention type: {e}")
        db.rollback()
        raise HTTPException(status_code=500, detail=str(e))

# Crop Types endpoints
@router.get("/crop-types/", response_model=Dict[str, Any])
async def list_crop_types(db: Session = Depends(get_db)):
    """List all crop types"""
    try:
        query = text("""
            SELECT crop_type_id, name, is_active, created_at
            FROM crop_types 
            WHERE is_active = 1
            ORDER BY name
        """)
        
        result = db.execute(query)
        crops = result.fetchall()
        
        return {
            "success": True,
            "data": [
                {
                    "crop_type_id": row[0],
                    "name": row[1],
                    "is_active": bool(row[2]),
                    "created_at": row[3].isoformat() if row[3] else None
                }
                for row in crops
            ],
            "count": len(crops)
        }
    except Exception as e:
        logger.error(f"Error listing crop types: {e}")
        raise HTTPException(status_code=500, detail=str(e))

@router.post("/crop-types/", response_model=Dict[str, Any])
async def create_crop_type(crop_data: CropTypeCreate, db: Session = Depends(get_db)):
    """Create a new crop type"""
    try:
        query = text("""
            INSERT INTO crop_types (name, is_active, created_at)
            VALUES (:name, 1, NOW())
        """)
        
        db.execute(query, {"name": crop_data.name})
        db.commit()
        
        return {
            "success": True,
            "message": "Crop type created successfully",
            "data": {"name": crop_data.name}
        }
    except Exception as e:
        logger.error(f"Error creating crop type: {e}")
        db.rollback()
        raise HTTPException(status_code=500, detail=str(e))

# Narratives endpoints
@router.get("/narratives/", response_model=Dict[str, Any])
async def list_narratives(db: Session = Depends(get_db)):
    """List all narratives"""
    try:
        query = text("""
            SELECT id, section_key, content, last_updated
            FROM narratives 
            ORDER BY section_key
        """)
        
        result = db.execute(query)
        narratives = result.fetchall()
        
        return {
            "success": True,
            "data": [
                {
                    "id": row[0],
                    "section_key": row[1],
                    "content": row[2],
                    "last_updated": row[3].isoformat() if row[3] else None
                }
                for row in narratives
            ],
            "count": len(narratives)
        }
    except Exception as e:
        logger.error(f"Error listing narratives: {e}")
        raise HTTPException(status_code=500, detail=str(e))

@router.get("/narratives/{section_key}", response_model=Dict[str, Any])
async def get_narrative(section_key: str, db: Session = Depends(get_db)):
    """Get narrative by section key"""
    try:
        query = text("""
            SELECT id, section_key, content, last_updated
            FROM narratives 
            WHERE section_key = :section_key
        """)
        
        result = db.execute(query, {"section_key": section_key})
        narrative = result.fetchone()
        
        if not narrative:
            raise HTTPException(status_code=404, detail="Narrative not found")
        
        return {
            "success": True,
            "data": {
                "id": narrative[0],
                "section_key": narrative[1],
                "content": narrative[2],
                "last_updated": narrative[3].isoformat() if narrative[3] else None
            }
        }
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error getting narrative: {e}")
        raise HTTPException(status_code=500, detail=str(e))

@router.put("/narratives/{section_key}", response_model=Dict[str, Any])
async def update_narrative(section_key: str, narrative_data: NarrativeCreate, db: Session = Depends(get_db)):
    """Update or create narrative"""
    try:
        # Check if exists
        check_query = text("SELECT id FROM narratives WHERE section_key = :section_key")
        result = db.execute(check_query, {"section_key": section_key})
        exists = result.fetchone()
        
        if exists:
            # Update
            query = text("""
                UPDATE narratives 
                SET content = :content, last_updated = NOW()
                WHERE section_key = :section_key
            """)
        else:
            # Insert
            query = text("""
                INSERT INTO narratives (section_key, content, last_updated)
                VALUES (:section_key, :content, NOW())
            """)
        
        db.execute(query, {
            "section_key": section_key,
            "content": narrative_data.content
        })
        db.commit()
        
        return {
            "success": True,
            "message": "Narrative updated successfully",
            "data": {
                "section_key": section_key,
                "content": narrative_data.content
            }
        }
    except Exception as e:
        logger.error(f"Error updating narrative: {e}")
        db.rollback()
        raise HTTPException(status_code=500, detail=str(e))
