"""
Debug router for database verification
"""

from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from sqlalchemy import text
from app.db.connection import get_db
import logging

logger = logging.getLogger(__name__)
router = APIRouter()

@router.get("/study/{study_id}/relationships")
async def debug_study_relationships(study_id: int, db: Session = Depends(get_db)):
    """Debug endpoint to check actual database relationships for a study"""
    
    try:
        # Check impact areas
        impact_areas_query = text("""
            SELECT sia.clarisa_impacts_areas_impact_area_id, cia.name 
            FROM studies_impact_areas sia
            JOIN clarisa_impacts_areas cia ON sia.clarisa_impacts_areas_impact_area_id = cia.impact_area_id
            WHERE sia.studies_study_id = :study_id AND cia.is_active = 1
        """)
        impact_areas_result = db.execute(impact_areas_query, {"study_id": study_id})
        impact_areas = [{"id": row[0], "name": row[1]} for row in impact_areas_result.fetchall()]
        
        # Check initiatives
        initiatives_query = text("""
            SELECT sc.clarisa_initiatives_initiative_id, ci.name
            FROM studies_contributors sc
            JOIN clarisa_initiatives ci ON sc.clarisa_initiatives_initiative_id = ci.initiative_id
            WHERE sc.study_id = :study_id AND sc.clarisa_initiatives_initiative_id IS NOT NULL AND ci.is_active = 1
        """)
        initiatives_result = db.execute(initiatives_query, {"study_id": study_id})
        initiatives = [{"id": row[0], "name": row[1]} for row in initiatives_result.fetchall()]
        
        # Check raw counts
        impact_count_query = text("SELECT COUNT(*) FROM studies_impact_areas WHERE studies_study_id = :study_id")
        impact_count = db.execute(impact_count_query, {"study_id": study_id}).scalar()
        
        initiative_count_query = text("SELECT COUNT(*) FROM studies_contributors WHERE study_id = :study_id AND clarisa_initiatives_initiative_id IS NOT NULL")
        initiative_count = db.execute(initiative_count_query, {"study_id": study_id}).scalar()
        
        return {
            "study_id": study_id,
            "impact_areas": {
                "data": impact_areas,
                "raw_count": impact_count
            },
            "initiatives": {
                "data": initiatives,
                "raw_count": initiative_count
            }
        }
        
    except Exception as e:
        logger.error(f"Debug query error: {e}")
        return {"error": str(e)}
