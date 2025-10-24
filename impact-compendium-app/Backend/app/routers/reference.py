"""Reference data router for form dropdowns."""

from typing import Dict, Any, List
from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from sqlalchemy import text
from app.db.connection import get_db
import logging

logger = logging.getLogger(__name__)
router = APIRouter()

def get_reference_data(db: Session, table: str, id_field: str = "id", name_field: str = "name"):
    """Generic function to get reference data."""
    try:
        query = text(f"SELECT {id_field}, {name_field} FROM {table} ORDER BY {name_field}")
        result = db.execute(query)
        return [{"id": row[0], "name": row[1]} for row in result.fetchall()]
    except Exception as e:
        logger.error(f"Error getting {table} data: {e}")
        return []

@router.get("/categories", response_model=List[Dict[str, Any]])
async def get_categories(db: Session = Depends(get_db)):
    """Get study categories."""
    data = get_reference_data(db, "study_categories")
    if not data:
        return [
            {"id": 1, "name": "Impact Study"},
            {"id": 2, "name": "Research Analysis"},
            {"id": 3, "name": "Outcome Assessment"}
        ]
    return data

@router.get("/intervention-types", response_model=List[Dict[str, Any]])
async def get_intervention_types(db: Session = Depends(get_db)):
    """Get intervention types."""
    data = get_reference_data(db, "intervention_types", "intervention_type_id", "name")
    if not data:
        return [
            {"id": 1, "name": "Technology Transfer"},
            {"id": 2, "name": "Capacity Building"},
            {"id": 3, "name": "Policy Intervention"}
        ]
    return data

@router.get("/crop-types", response_model=List[Dict[str, Any]])
async def get_crop_types(db: Session = Depends(get_db)):
    """Get crop types."""
    data = get_reference_data(db, "crop_types", "crop_type_id", "name")
    if not data:
        return [
            {"id": 1, "name": "Maize"},
            {"id": 2, "name": "Rice"},
            {"id": 3, "name": "Wheat"}
        ]
    return data

@router.get("/keywords", response_model=List[Dict[str, Any]])
async def get_keywords(db: Session = Depends(get_db)):
    """Get keywords."""
    data = get_reference_data(db, "keywords", "keyword_id", "keyword")
    if not data:
        return [
            {"id": 1, "name": "Agricultural technology"},
            {"id": 2, "name": "Adoption"},
            {"id": 3, "name": "Climate resilience"}
        ]
    return data

@router.get("/impact-areas", response_model=List[Dict[str, Any]])
async def get_impact_areas(db: Session = Depends(get_db)):
    """Get impact areas."""
    data = get_reference_data(db, "clarisa_impacts_areas")
    if not data:
        return [
            {"id": 1, "name": "Food Security"},
            {"id": 2, "name": "Climate Adaptation"},
            {"id": 3, "name": "Nutrition Security"}
        ]
    return data

@router.get("/initiatives", response_model=List[Dict[str, Any]])
async def get_initiatives(db: Session = Depends(get_db)):
    """Get initiatives."""
    data = get_reference_data(db, "clarisa_initiatives", "initiative_id", "name")
    if not data:
        return [
            {"id": 1, "name": "Accelerated Breeding"},
            {"id": 2, "name": "Climate Resilience"},
            {"id": 3, "name": "Sustainable Intensification"}
        ]
    return data

@router.get("/centers", response_model=List[Dict[str, Any]])
async def get_centers(db: Session = Depends(get_db)):
    """Get centers."""
    data = get_reference_data(db, "clarisa_centers")
    if not data:
        return [
            {"id": 1, "name": "CIMMYT"},
            {"id": 2, "name": "IRRI"},
            {"id": 3, "name": "ICRISAT"}
        ]
    return data

@router.get("/countries", response_model=List[Dict[str, Any]])
async def get_countries(db: Session = Depends(get_db)):
    """Get countries."""
    data = get_reference_data(db, "clarisa_countries")
    if not data:
        return [
            {"id": 1, "name": "Kenya"},
            {"id": 2, "name": "India"},
            {"id": 3, "name": "Philippines"}
        ]
    return data

@router.get("/regions", response_model=List[Dict[str, Any]])
async def get_regions(db: Session = Depends(get_db)):
    """Get regions."""
    data = get_reference_data(db, "clarisa_cgiar_regions")
    if not data:
        return [
            {"id": 1, "name": "East Africa"},
            {"id": 2, "name": "South Asia"},
            {"id": 3, "name": "Southeast Asia"}
        ]
    return data
