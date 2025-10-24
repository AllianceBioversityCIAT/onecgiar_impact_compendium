"""
Enhanced studies router with full CRUD operations
"""

from typing import Dict, Any
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from sqlalchemy import text
from pydantic import BaseModel
from datetime import datetime

from app.db.connection import get_db
import logging

logger = logging.getLogger(__name__)
router = APIRouter()

# Pydantic models for CRUD operations
class StudyCreate(BaseModel):
    title: str
    year: int = None
    summary: str = None
    period_start: datetime = None
    period_end: datetime = None
    category_id: int = None
    intervention_details: str = None
    doi: str = None
    pdf_filename: str = None
    outputs_v1: str = None
    outputs_v2: str = None

class StudyUpdate(BaseModel):
    title: str = None
    year: int = None
    summary: str = None
    period_start: datetime = None
    period_end: datetime = None
    category_id: int = None
    intervention_details: str = None
    doi: str = None
    pdf_filename: str = None
    outputs_v1: str = None
    outputs_v2: str = None

class StudyCategoryCreate(BaseModel):
    name: str

# Enhanced Studies CRUD
@router.post("/", response_model=Dict[str, Any])
async def create_study(study_data: StudyCreate, db: Session = Depends(get_db)):
    """Create a new study"""
    try:
        # Get current user (you'll need to implement auth to get actual user)
        current_user = "system"  # Replace with actual logged user from auth
        
        query = text("""
            INSERT INTO studies 
            (title, year, summary, period_start, period_end, category_id, 
             intervention_details, doi, pdf_filename, outputs_v1, outputs_v2, 
             is_active, created_at, created_by)
            VALUES 
            (:title, :year, :summary, :period_start, :period_end, :category_id,
             :intervention_details, :doi, :pdf_filename, :outputs_v1, :outputs_v2,
             1, NOW(), :created_by)
        """)
        
        result = db.execute(query, {
            "title": study_data.title,
            "year": study_data.year,
            "summary": study_data.summary,
            "period_start": study_data.period_start,
            "period_end": study_data.period_end,
            "category_id": study_data.category_id,
            "intervention_details": study_data.intervention_details,
            "doi": study_data.doi,
            "pdf_filename": study_data.pdf_filename,
            "outputs_v1": study_data.outputs_v1,
            "outputs_v2": study_data.outputs_v2,
            "created_by": current_user
        })
        
        # Get the inserted ID
        study_id = result.lastrowid
        db.commit()
        
        return {
            "success": True,
            "message": "Study created successfully",
            "data": {
                "study_id": study_id,
                "title": study_data.title
            }
        }
    except Exception as e:
        logger.error(f"Error creating study: {e}")
        db.rollback()
        raise HTTPException(status_code=500, detail=str(e))

@router.put("/complete/{study_id}", response_model=Dict[str, Any])
async def update_complete_study(study_id: int, study_data: dict, db: Session = Depends(get_db)):
    """Update complete study with all relationships"""
    try:
        # Get current user (you'll need to implement auth to get actual user)
        current_user = "system"  # Replace with actual logged user from auth
        
        # Update main study table
        main_fields = ['title', 'year', 'summary', 'period_start', 'period_end', 'intervention_details', 'doi', 'category_id']
        update_fields = []
        params = {"study_id": study_id}
        
        for field in main_fields:
            if field in study_data and study_data[field] is not None:
                update_fields.append(f"{field} = :{field}")
                params[field] = study_data[field]
        
        if update_fields:
            update_fields.append("last_updated_date = NOW()")
            update_fields.append("last_updated_by = :last_updated_by")
            params["last_updated_by"] = current_user
            
            query = text(f"""
                UPDATE studies 
                SET {', '.join(update_fields)}
                WHERE study_id = :study_id AND is_active = 1
            """)
            db.execute(query, params)
        
        # Update countries
        if 'countries' in study_data:
            db.execute(text("DELETE FROM studies_countries WHERE study_id = :study_id"), {"study_id": study_id})
            for country_id in study_data['countries']:
                db.execute(text("INSERT INTO studies_countries (study_id, country_id) VALUES (:study_id, :country_id)"), 
                          {"study_id": study_id, "country_id": country_id})
        
        # Update regions
        if 'regions' in study_data:
            db.execute(text("DELETE FROM studies_regions WHERE study_id = :study_id"), {"study_id": study_id})
            for region_id in study_data['regions']:
                db.execute(text("INSERT INTO studies_regions (study_id, region_id) VALUES (:study_id, :region_id)"), 
                          {"study_id": study_id, "region_id": region_id})
        
        # Update impact areas
        if 'impact_areas' in study_data:
            db.execute(text("DELETE FROM studies_impact_areas WHERE studies_study_id = :study_id"), {"study_id": study_id})
            for area_id in study_data['impact_areas']:
                db.execute(text("INSERT INTO studies_impact_areas (studies_study_id, clarisa_impacts_areas_impact_area_id) VALUES (:study_id, :area_id)"), 
                          {"study_id": study_id, "area_id": area_id})
        
        # Update contributors (initiatives and centers)
        if 'initiatives' in study_data or 'centers' in study_data:
            db.execute(text("DELETE FROM studies_contributors WHERE study_id = :study_id"), {"study_id": study_id})
            
            initiatives = study_data.get('initiatives', [])
            centers = study_data.get('centers', [])
            
            # Create combinations of initiatives and centers
            if initiatives and centers:
                for init_id in initiatives:
                    for center_id in centers:
                        db.execute(text("""
                            INSERT INTO studies_contributors (study_id, studies_initiatives_id, clarisa_centers_center_id, is_active) 
                            VALUES (:study_id, :init_id, :center_id, 1)
                        """), {"study_id": study_id, "init_id": init_id, "center_id": center_id})
            elif initiatives:
                for init_id in initiatives:
                    db.execute(text("""
                        INSERT INTO studies_contributors (study_id, studies_initiatives_id, is_active) 
                        VALUES (:study_id, :init_id, 1)
                    """), {"study_id": study_id, "init_id": init_id})
            elif centers:
                for center_id in centers:
                    db.execute(text("""
                        INSERT INTO studies_contributors (study_id, clarisa_centers_center_id, is_active) 
                        VALUES (:study_id, :center_id, 1)
                    """), {"study_id": study_id, "center_id": center_id})
        
        # Update keywords
        if 'keywords' in study_data:
            db.execute(text("DELETE FROM studies_keywords WHERE study_id = :study_id"), {"study_id": study_id})
            for keyword_id in study_data['keywords']:
                db.execute(text("INSERT INTO studies_keywords (study_id, keyword_id, is_active) VALUES (:study_id, :keyword_id, 1)"), 
                          {"study_id": study_id, "keyword_id": keyword_id})
        
        # Update crop types
        if 'crop_types' in study_data:
            db.execute(text("DELETE FROM studies_crop_types WHERE study_id = :study_id"), {"study_id": study_id})
            for crop_id in study_data['crop_types']:
                db.execute(text("INSERT INTO studies_crop_types (study_id, crop_type_id, is_active) VALUES (:study_id, :crop_id, 1)"), 
                          {"study_id": study_id, "crop_id": crop_id})
        
        # Update indicators
        if 'indicators' in study_data:
            db.execute(text("DELETE FROM studies_indicators WHERE study_id = :study_id"), {"study_id": study_id})
            for indicator in study_data['indicators']:
                db.execute(text("""
                    INSERT INTO studies_indicators (study_id, indicator_measure, unit_measure, result_reported, is_active) 
                    VALUES (:study_id, :measure, :unit, :result, 1)
                """), {
                    "study_id": study_id,
                    "measure": indicator.get('indicator_measured', ''),
                    "unit": indicator.get('unit_of_measure', ''),
                    "result": indicator.get('result_reported', '')
                })
        
        db.commit()
        
        return {
            "success": True,
            "message": "Study updated completely",
            "data": {"study_id": study_id}
        }
        
    except Exception as e:
        db.rollback()
        logger.error(f"Error updating complete study: {e}")
        raise HTTPException(status_code=500, detail=str(e))

async def update_study(study_id: int, study_data: StudyUpdate, db: Session = Depends(get_db)):
    """Update an existing study"""
    try:
        # Build dynamic update query
        update_fields = []
        params = {"study_id": study_id}
        
        for field, value in study_data.dict(exclude_unset=True).items():
            if value is not None:
                update_fields.append(f"{field} = :{field}")
                params[field] = value
        
        if not update_fields:
            raise HTTPException(status_code=400, detail="No fields to update")
        
        update_fields.append("last_updated_date = NOW()")
        update_fields.append("last_updated_by = 'system'")
        
        query = text(f"""
            UPDATE studies 
            SET {', '.join(update_fields)}
            WHERE study_id = :study_id AND is_active = 1
        """)
        
        result = db.execute(query, params)
        
        if result.rowcount == 0:
            raise HTTPException(status_code=404, detail="Study not found")
        
        db.commit()
        
        return {
            "success": True,
            "message": "Study updated successfully",
            "data": {"study_id": study_id}
        }
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error updating study: {e}")
        db.rollback()
        raise HTTPException(status_code=500, detail=str(e))

@router.delete("/{study_id}", response_model=Dict[str, Any])
async def delete_study(study_id: int, db: Session = Depends(get_db)):
    """Soft delete a study (set is_active = 0)"""
    try:
        query = text("""
            UPDATE studies 
            SET is_active = 0, last_updated_date = NOW(), last_updated_by = 'system'
            WHERE study_id = :study_id AND is_active = 1
        """)
        
        result = db.execute(query, {"study_id": study_id})
        
        if result.rowcount == 0:
            raise HTTPException(status_code=404, detail="Study not found")
        
        db.commit()
        
        return {
            "success": True,
            "message": "Study deleted successfully",
            "data": {"study_id": study_id}
        }
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error deleting study: {e}")
        db.rollback()
        raise HTTPException(status_code=500, detail=str(e))

# Study Categories CRUD
@router.post("/categories/", response_model=Dict[str, Any])
async def create_study_category(category_data: StudyCategoryCreate, db: Session = Depends(get_db)):
    """Create a new study category"""
    try:
        query = text("""
            INSERT INTO studies_categories (name, is_active, created_at)
            VALUES (:name, 1, NOW())
        """)
        
        result = db.execute(query, {"name": category_data.name})
        category_id = result.lastrowid
        db.commit()
        
        return {
            "success": True,
            "message": "Study category created successfully",
            "data": {
                "study_category_id": category_id,
                "name": category_data.name
            }
        }
    except Exception as e:
        logger.error(f"Error creating study category: {e}")
        db.rollback()
        raise HTTPException(status_code=500, detail=str(e))

@router.put("/categories/{category_id}", response_model=Dict[str, Any])
async def update_study_category(category_id: int, category_data: StudyCategoryCreate, db: Session = Depends(get_db)):
    """Update a study category"""
    try:
        query = text("""
            UPDATE studies_categories 
            SET name = :name
            WHERE study_category_id = :category_id AND is_active = 1
        """)
        
        result = db.execute(query, {
            "name": category_data.name,
            "category_id": category_id
        })
        
        if result.rowcount == 0:
            raise HTTPException(status_code=404, detail="Category not found")
        
        db.commit()
        
        return {
            "success": True,
            "message": "Study category updated successfully",
            "data": {
                "study_category_id": category_id,
                "name": category_data.name
            }
        }
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error updating study category: {e}")
        db.rollback()
        raise HTTPException(status_code=500, detail=str(e))

@router.delete("/categories/{category_id}", response_model=Dict[str, Any])
async def delete_study_category(category_id: int, db: Session = Depends(get_db)):
    """Soft delete a study category"""
    try:
        query = text("""
            UPDATE studies_categories 
            SET is_active = 0
            WHERE study_category_id = :category_id AND is_active = 1
        """)
        
        result = db.execute(query, {"category_id": category_id})
        
        if result.rowcount == 0:
            raise HTTPException(status_code=404, detail="Category not found")
        
        db.commit()
        
        return {
            "success": True,
            "message": "Study category deleted successfully",
            "data": {"study_category_id": category_id}
        }
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error deleting study category: {e}")
        db.rollback()
        raise HTTPException(status_code=500, detail=str(e))
