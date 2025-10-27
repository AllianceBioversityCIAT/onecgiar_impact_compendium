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
    try:
        # Query the categories table with correct column names
        query = text("SELECT study_category_id, name FROM categories WHERE is_active = 1 ORDER BY name")
        result = db.execute(query)
        categories = [{"id": row[0], "name": row[1]} for row in result.fetchall()]
        
        if categories:
            logger.info(f"Found {len(categories)} categories")
            return categories
        else:
            logger.warning("No categories found in database")
            return []
            
    except Exception as e:
        logger.error(f"Error getting categories from database: {e}")
        return []

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
    try:
        query = text("SELECT impact_area_id, name FROM clarisa_impacts_areas ORDER BY name")
        result = db.execute(query)
        data = [{"id": row[0], "name": row[1]} for row in result.fetchall()]
        if data:
            return data
    except Exception as e:
        logger.error(f"Error getting impact areas data: {e}")
    
    return [
        {"id": 1, "name": "Food Security"},
        {"id": 2, "name": "Climate Adaptation"},
        {"id": 3, "name": "Nutrition Security"}
    ]

@router.get("/initiatives", response_model=List[Dict[str, Any]])
async def get_initiatives(db: Session = Depends(get_db)):
    """Get initiatives."""
    try:
        query = text("SELECT initiative_id, code, name FROM clarisa_initiatives ORDER BY code")
        result = db.execute(query)
        data = [{"id": row[0], "name": f"{row[1]} - {row[2]}"} for row in result.fetchall()]
        if data:
            return data
    except Exception as e:
        logger.error(f"Error getting initiatives data: {e}")
    
    return [
        {"id": 1, "name": "INIT-01 - Accelerated Breeding"},
        {"id": 39, "name": "INIT-39 - Accelerating Crop Improvement Through Genome Editing"},
        {"id": 7, "name": "INIT-07 - ActioNs for Innovative climate change Mitigation & Adaptation of Livestock"}
    ]

@router.get("/centers", response_model=List[Dict[str, Any]])
async def get_centers(db: Session = Depends(get_db)):
    """Get centers."""
    try:
        query = text("SELECT center_id, acronym, name FROM clarisa_centers ORDER BY acronym")
        result = db.execute(query)
        data = [{"id": row[0], "name": f"{row[1]} - {row[2]}"} for row in result.fetchall()]
        if data:
            return data
    except Exception as e:
        logger.error(f"Error getting centers data: {e}")
    
    return [
        {"id": 1, "name": "CIMMYT - International Maize and Wheat Improvement Center"},
        {"id": 2, "name": "IRRI - International Rice Research Institute"},
        {"id": 3, "name": "ICRISAT - International Crops Research Institute for the Semi-Arid Tropics"}
    ]

@router.get("/countries", response_model=List[Dict[str, Any]])
async def get_countries(db: Session = Depends(get_db)):
    """Get countries."""
    try:
        query = text("SELECT country_id, country_name FROM clarisa_countries ORDER BY country_name")
        result = db.execute(query)
        data = [{"id": row[0], "name": row[1]} for row in result.fetchall()]
        if data:
            return data
    except Exception as e:
        logger.error(f"Error getting countries data: {e}")
    
    return [
        {"id": 1, "name": "Kenya"},
        {"id": 2, "name": "India"},
        {"id": 3, "name": "Philippines"}
    ]

@router.get("/regions", response_model=List[Dict[str, Any]])
async def get_regions(db: Session = Depends(get_db)):
    """Get regions."""
    try:
        query = text("SELECT region_id, acronym, region_name FROM clarisa_cgiar_regions ORDER BY acronym")
        result = db.execute(query)
        data = [{"id": row[0], "name": f"{row[1]} - {row[2]}"} for row in result.fetchall()]
        if data:
            return data
    except Exception as e:
        logger.error(f"Error getting regions data: {e}")
    
    return [
        {"id": 1, "name": "EA - East Africa"},
        {"id": 2, "name": "SA - South Asia"},
        {"id": 3, "name": "SEA - Southeast Asia"}
    ]
