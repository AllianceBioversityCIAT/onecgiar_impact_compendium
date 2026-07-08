"""
Study relations router for junction tables (contributors, keywords, regions, etc.)
"""

import logging
from typing import Annotated, Any, Dict, List, Optional

from fastapi import APIRouter, Depends, HTTPException, status
from pydantic import BaseModel
from sqlalchemy import text
from sqlalchemy.orm import Session

from app.db.connection import get_db

logger = logging.getLogger(__name__)
router = APIRouter()


# Pydantic models
class StudyContributorCreate(BaseModel):
    study_id: int
    clarisa_centers_center_id: int = None
    clarisa_initiatives_initiative_id: int = None


class StudyKeywordCreate(BaseModel):
    study_id: int
    keyword_id: int


class StudyRegionCreate(BaseModel):
    study_id: int
    region_id: int


class StudyCountryCreate(BaseModel):
    study_id: int
    country_id: int


class StudyImpactAreaCreate(BaseModel):
    study_id: int
    impact_area_id: int
    impact_area_level: str = None


class StudyCropTypeCreate(BaseModel):
    study_id: int
    crop_type_id: int


# Study Contributors endpoints
@router.get("/contributors/", response_model=Dict[str, Any])
async def list_study_contributors(study_id: int = None, db: Session = Depends(get_db)):
    """List study contributors"""
    try:
        where_clause = "WHERE sc.is_active = 1"
        params = {}

        if study_id:
            where_clause += " AND sc.study_id = :study_id"
            params["study_id"] = study_id

        query = text(
            f"""
            SELECT sc.studies_initiatives_id, sc.study_id, sc.is_active,
                   sc.clarisa_centers_center_id, cc.name as center_name,
                   sc.clarisa_initiatives_initiative_id, ci.name as initiative_name,
                   s.title as study_title
            FROM studies_contributors sc
            LEFT JOIN clarisa_centers cc ON sc.clarisa_centers_center_id = cc.center_id
            LEFT JOIN clarisa_initiatives ci ON sc.clarisa_initiatives_initiative_id = ci.initiative_id
            LEFT JOIN studies s ON sc.study_id = s.study_id
            {where_clause}
            ORDER BY sc.study_id, cc.name, ci.name
            LIMIT 100
        """
        )

        result = db.execute(query, params)
        contributors = result.fetchall()

        return {
            "success": True,
            "data": [
                {
                    "studies_initiatives_id": row[0],
                    "study_id": row[1],
                    "is_active": bool(row[2]),
                    "center": {"center_id": row[3], "name": row[4]} if row[3] else None,
                    "initiative": {"initiative_id": row[5], "name": row[6]}
                    if row[5]
                    else None,
                    "study_title": row[7],
                }
                for row in contributors
            ],
            "count": len(contributors),
        }
    except Exception as e:
        logger.error(f"Error listing study contributors: {e}")
        raise HTTPException(status_code=500, detail=str(e))


@router.post("/contributors/", response_model=Dict[str, Any])
async def create_study_contributor(
    contributor_data: StudyContributorCreate, db: Session = Depends(get_db)
):
    """Add contributor to study"""
    try:
        query = text(
            """
            INSERT INTO studies_contributors 
            (study_id, clarisa_centers_center_id, clarisa_initiatives_initiative_id, is_active)
            VALUES (:study_id, :center_id, :initiative_id, 1)
        """
        )

        db.execute(
            query,
            {
                "study_id": contributor_data.study_id,
                "center_id": contributor_data.clarisa_centers_center_id,
                "initiative_id": contributor_data.clarisa_initiatives_initiative_id,
            },
        )
        db.commit()

        return {"success": True, "message": "Study contributor added successfully"}
    except Exception as e:
        logger.error(f"Error creating study contributor: {e}")
        db.rollback()
        raise HTTPException(status_code=500, detail=str(e))


# Study Keywords endpoints
@router.get("/keywords/", response_model=Dict[str, Any])
async def list_study_keywords(
    db: Annotated[Session, Depends(get_db)], study_id: Optional[int] = None
):
    """List study keywords"""
    try:
        where_clause = "WHERE sk.is_active = 1"
        params = {}

        if study_id:
            where_clause += " AND sk.study_id = :study_id"
            params["study_id"] = study_id

        query = text(
            f"""
            SELECT sk.studies_keyword_id, sk.study_id, sk.keyword_id, sk.is_active,
                   k.keyword, s.title as study_title
            FROM studies_keywords sk
            LEFT JOIN keywords k ON sk.keyword_id = k.keyword_id
            LEFT JOIN studies s ON sk.study_id = s.study_id
            {where_clause}
            ORDER BY sk.study_id, k.keyword
            LIMIT 200
        """
        )

        result = db.execute(query, params)
        keywords = result.fetchall()

        return {
            "success": True,
            "data": [
                {
                    "studies_keyword_id": row[0],
                    "study_id": row[1],
                    "keyword_id": row[2],
                    "is_active": bool(row[3]),
                    "keyword": row[4],
                    "study_title": row[5],
                }
                for row in keywords
            ],
            "count": len(keywords),
        }
    except Exception as e:
        logger.error(f"Error listing study keywords: {e}")
        raise HTTPException(status_code=500, detail=str(e))


# Study Regions endpoints
@router.get("/regions/", response_model=Dict[str, Any])
async def list_study_regions(study_id: int = None, db: Session = Depends(get_db)):
    """List study regions"""
    try:
        where_clause = "WHERE sr.is_active = 1"
        params = {}

        if study_id:
            where_clause += " AND sr.study_id = :study_id"
            params["study_id"] = study_id

        query = text(
            f"""
            SELECT sr.studies_regions_id, sr.study_id, sr.region_id, sr.is_active,
                   r.region_name, s.title as study_title
            FROM studies_regions sr
            LEFT JOIN clarisa_cgiar_regions r ON sr.region_id = r.region_id
            LEFT JOIN studies s ON sr.study_id = s.study_id
            {where_clause}
            ORDER BY sr.study_id, r.region_name
            LIMIT 200
        """
        )

        result = db.execute(query, params)
        regions = result.fetchall()

        return {
            "success": True,
            "data": [
                {
                    "studies_regions_id": row[0],
                    "study_id": row[1],
                    "region_id": row[2],
                    "is_active": bool(row[3]),
                    "region_name": row[4],
                    "study_title": row[5],
                }
                for row in regions
            ],
            "count": len(regions),
        }
    except Exception as e:
        logger.error(f"Error listing study regions: {e}")
        raise HTTPException(status_code=500, detail=str(e))


# Study Countries endpoints
@router.get("/countries/", response_model=Dict[str, Any])
async def list_study_countries(study_id: int = None, db: Session = Depends(get_db)):
    """List study countries"""
    try:
        where_clause = "WHERE sc.is_active = 1"
        params = {}

        if study_id:
            where_clause += " AND sc.study_id = :study_id"
            params["study_id"] = study_id

        query = text(
            f"""
            SELECT sc.studies_countries_id, sc.study_id, sc.country_id, sc.is_active,
                   c.country_name, s.title as study_title
            FROM studies_countries sc
            LEFT JOIN clarisa_countries c ON sc.country_id = c.country_id
            LEFT JOIN studies s ON sc.study_id = s.study_id
            {where_clause}
            ORDER BY sc.study_id, c.country_name
            LIMIT 200
        """
        )

        result = db.execute(query, params)
        countries = result.fetchall()

        return {
            "success": True,
            "data": [
                {
                    "studies_countries_id": row[0],
                    "study_id": row[1],
                    "country_id": row[2],
                    "is_active": bool(row[3]),
                    "country_name": row[4],
                    "study_title": row[5],
                }
                for row in countries
            ],
            "count": len(countries),
        }
    except Exception as e:
        logger.error(f"Error listing study countries: {e}")
        raise HTTPException(status_code=500, detail=str(e))


# Study Impact Areas endpoints
@router.get("/impact-areas/", response_model=Dict[str, Any])
async def list_study_impact_areas(study_id: int = None, db: Session = Depends(get_db)):
    """List study impact areas"""
    try:
        where_clause = "WHERE sia.is_active = 1"
        params = {}

        if study_id:
            where_clause += " AND sia.studies_study_id = :study_id"
            params["study_id"] = study_id

        query = text(
            f"""
            SELECT sia.studies_impact_areas_id, sia.studies_study_id, 
                   sia.clarisa_impacts_areas_impact_area_id, sia.impact_area_level, sia.is_active,
                   ia.name as impact_area_name, s.title as study_title
            FROM studies_impact_areas sia
            LEFT JOIN clarisa_impacts_areas ia ON sia.clarisa_impacts_areas_impact_area_id = ia.impact_area_id
            LEFT JOIN studies s ON sia.studies_study_id = s.study_id
            {where_clause}
            ORDER BY sia.studies_study_id, ia.name
            LIMIT 200
        """
        )

        result = db.execute(query, params)
        impact_areas = result.fetchall()

        return {
            "success": True,
            "data": [
                {
                    "studies_impact_areas_id": row[0],
                    "study_id": row[1],
                    "impact_area_id": row[2],
                    "impact_area_level": row[3],
                    "is_active": bool(row[4]),
                    "impact_area_name": row[5],
                    "study_title": row[6],
                }
                for row in impact_areas
            ],
            "count": len(impact_areas),
        }
    except Exception as e:
        logger.error(f"Error listing study impact areas: {e}")
        raise HTTPException(status_code=500, detail=str(e))


# Study Crop Types endpoints
@router.get("/crop-types/", response_model=Dict[str, Any])
async def list_study_crop_types(study_id: int = None, db: Session = Depends(get_db)):
    """List study crop types"""
    try:
        where_clause = "WHERE sct.is_active = 1"
        params = {}

        if study_id:
            where_clause += " AND sct.study_id = :study_id"
            params["study_id"] = study_id

        query = text(
            f"""
            SELECT sct.studies_crop_type_id, sct.study_id, sct.crop_type_id, sct.is_active,
                   ct.name as crop_type_name, s.title as study_title
            FROM studies_crop_types sct
            LEFT JOIN crop_types ct ON sct.crop_type_id = ct.crop_type_id
            LEFT JOIN studies s ON sct.study_id = s.study_id
            {where_clause}
            ORDER BY sct.study_id, ct.name
            LIMIT 200
        """
        )

        result = db.execute(query, params)
        crop_types = result.fetchall()

        return {
            "success": True,
            "data": [
                {
                    "studies_crop_type_id": row[0],
                    "study_id": row[1],
                    "crop_type_id": row[2],
                    "is_active": bool(row[3]),
                    "crop_type_name": row[4],
                    "study_title": row[5],
                }
                for row in crop_types
            ],
            "count": len(crop_types),
        }
    except Exception as e:
        logger.error(f"Error listing study crop types: {e}")
        raise HTTPException(status_code=500, detail=str(e))
