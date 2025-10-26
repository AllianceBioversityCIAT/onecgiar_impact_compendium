"""
CLARISA reference data router with full CRUD operations
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

# Pydantic models for request/response
class CenterCreate(BaseModel):
    name: str
    code: str = None
    acronym: str = None

class InitiativeCreate(BaseModel):
    name: str
    code: str = None
    acronym: str = None

# CLARISA Centers endpoints
@router.get("/centers/", response_model=Dict[str, Any])
async def list_centers(
    skip: int = Query(0, ge=0),
    limit: int = Query(100, ge=1, le=1000),
    db: Session = Depends(get_db)
):
    """List all CLARISA centers"""
    try:
        query = text("""
            SELECT center_id, name, code, acronym, is_active, created_at
            FROM clarisa_centers 
            WHERE is_active = 1
            ORDER BY name
            LIMIT :limit OFFSET :skip
        """)
        
        result = db.execute(query, {"limit": limit, "skip": skip})
        centers = result.fetchall()
        
        return {
            "success": True,
            "data": [
                {
                    "center_id": row[0],
                    "name": row[1],
                    "code": row[2],
                    "acronym": row[3],
                    "is_active": bool(row[4]),
                    "created_at": row[5].isoformat() if row[5] else None
                }
                for row in centers
            ],
            "count": len(centers)
        }
    except Exception as e:
        logger.error(f"Error listing centers: {e}")
        raise HTTPException(status_code=500, detail=str(e))

@router.get("/centers/{center_id}", response_model=Dict[str, Any])
async def get_center(center_id: int, db: Session = Depends(get_db)):
    """Get specific CLARISA center"""
    try:
        query = text("""
            SELECT center_id, name, code, acronym, is_active, created_at
            FROM clarisa_centers 
            WHERE center_id = :center_id AND is_active = 1
        """)
        
        result = db.execute(query, {"center_id": center_id})
        center = result.fetchone()
        
        if not center:
            raise HTTPException(status_code=404, detail="Center not found")
        
        return {
            "success": True,
            "data": {
                "center_id": center[0],
                "name": center[1],
                "code": center[2],
                "acronym": center[3],
                "is_active": bool(center[4]),
                "created_at": center[5].isoformat() if center[5] else None
            }
        }
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error getting center: {e}")
        raise HTTPException(status_code=500, detail=str(e))

# CLARISA Initiatives endpoints
@router.get("/initiatives/", response_model=Dict[str, Any])
async def list_initiatives(
    skip: int = Query(0, ge=0),
    limit: int = Query(100, ge=1, le=1000),
    db: Session = Depends(get_db)
):
    """List all CLARISA initiatives"""
    try:
        query = text("""
            SELECT initiative_id, name, code, acronym, is_active, created_at
            FROM clarisa_initiatives 
            WHERE is_active = 1
            ORDER BY name
            LIMIT :limit OFFSET :skip
        """)
        
        result = db.execute(query, {"limit": limit, "skip": skip})
        initiatives = result.fetchall()
        
        return {
            "success": True,
            "data": [
                {
                    "initiative_id": row[0],
                    "name": row[1],
                    "code": row[2],
                    "acronym": row[3],
                    "is_active": bool(row[4]),
                    "created_at": row[5].isoformat() if row[5] else None
                }
                for row in initiatives
            ],
            "count": len(initiatives)
        }
    except Exception as e:
        logger.error(f"Error listing initiatives: {e}")
        raise HTTPException(status_code=500, detail=str(e))

# CLARISA Regions endpoints
@router.get("/regions/", response_model=Dict[str, Any])
async def list_regions(db: Session = Depends(get_db)):
    """List all CLARISA CGIAR regions"""
    try:
        query = text("""
            SELECT region_id, region_name, acronym, is_active, created_at
            FROM clarisa_cgiar_regions 
            WHERE is_active = 1
            ORDER BY region_name
        """)
        
        result = db.execute(query)
        regions = result.fetchall()
        
        return {
            "success": True,
            "data": [
                {
                    "region_id": row[0],
                    "region_name": row[1],
                    "acronym": row[2],
                    "is_active": bool(row[3]),
                    "created_at": row[4].isoformat() if row[4] else None
                }
                for row in regions
            ],
            "count": len(regions)
        }
    except Exception as e:
        logger.error(f"Error listing regions: {e}")
        raise HTTPException(status_code=500, detail=str(e))

# CLARISA Countries endpoints
@router.get("/countries/", response_model=Dict[str, Any])
async def list_countries(
    skip: int = Query(0, ge=0),
    limit: int = Query(200, ge=1, le=1000),
    db: Session = Depends(get_db)
):
    """List all CLARISA countries"""
    try:
        query = text("""
            SELECT country_id, country_name, is_active
            FROM clarisa_countries 
            WHERE is_active = 1
            ORDER BY country_name
            LIMIT :limit OFFSET :skip
        """)
        
        result = db.execute(query, {"limit": limit, "skip": skip})
        countries = result.fetchall()
        
        return {
            "success": True,
            "data": [
                {
                    "country_id": row[0],
                    "country_name": row[1],
                    "is_active": bool(row[2])
                }
                for row in countries
            ],
            "count": len(countries)
        }
    except Exception as e:
        logger.error(f"Error listing countries: {e}")
        raise HTTPException(status_code=500, detail=str(e))

# CLARISA Impact Areas endpoints
@router.get("/impact-areas/", response_model=Dict[str, Any])
async def list_impact_areas(db: Session = Depends(get_db)):
    """List all CLARISA impact areas"""
    try:
        query = text("""
            SELECT impact_area_id, name, is_active, created_at
            FROM clarisa_impacts_areas 
            WHERE is_active = 1
            ORDER BY name
        """)
        
        result = db.execute(query)
        impact_areas = result.fetchall()
        
        return {
            "success": True,
            "data": [
                {
                    "impact_area_id": row[0],
                    "name": row[1],
                    "is_active": bool(row[2]),
                    "created_at": row[3].isoformat() if row[3] else None
                }
                for row in impact_areas
            ],
            "count": len(impact_areas)
        }
    except Exception as e:
        logger.error(f"Error listing impact areas: {e}")
        raise HTTPException(status_code=500, detail=str(e))
