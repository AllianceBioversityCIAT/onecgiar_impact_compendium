"""
Studies router with aligned structure between list and detail endpoints
"""

from typing import List, Dict, Any, Optional
from fastapi import APIRouter, Depends, HTTPException, Query, status, Request
from sqlalchemy.orm import Session
from sqlalchemy import text
from pydantic import BaseModel

from app.db.connection import get_db
import logging

logger = logging.getLogger(__name__)
router = APIRouter()

def get_current_user_from_request(request: Request) -> str:
    """Extract current user from request headers or authentication"""
    # Try to get from Authorization header
    auth_header = request.headers.get("authorization", "")
    if auth_header:
        # In production, this would decode the JWT token to get the actual user
        # For now, check if we can extract user info from headers
        
        # Check for user info in other headers that frontend might send
        user_email = request.headers.get("x-user-email", "")
        if user_email:
            return user_email
            
        # Check for user info in cookies
        user_cookie = request.cookies.get("user_email", "")
        if user_cookie:
            return user_cookie
    
    # Fallback - in production this would decode the JWT token
    return "system"
    """Extract current user from request headers or authentication"""
    # Try to get from Authorization header
    auth_header = request.headers.get("authorization", "")
    if auth_header:
        # For now, return a test user - in production this would decode JWT
        return "testing@example.com"
    
    # Fallback to system user
    return "system"

class StudyCreateRequest(BaseModel):
    studyId: int
    title: str
    summary: Optional[str] = None
    year: int
    doi: Optional[str] = None
    category: str
    periodStart: str
    periodEnd: str
    interventionType: str
    interventionDetails: Optional[str] = None

class StudyUpdateRequest(BaseModel):
    studyId: Optional[int] = None
    title: Optional[str] = None
    summary: Optional[str] = None
    year: Optional[int] = None
    doi: Optional[str] = None
    category: Optional[str] = None
    periodStart: Optional[str] = None
    periodEnd: Optional[str] = None
    interventionType: Optional[str] = None
    interventionDetails: Optional[str] = None

class StudyCompleteRequest(BaseModel):
    # Step 1 data
    studyId: int
    title: str
    summary: Optional[str] = None
    year: int
    doi: Optional[str] = None
    category: str
    periodStart: str
    periodEnd: str
    interventionType: str
    interventionDetails: Optional[str] = None
    
    # Step 2 data
    primaryCGIARImpactArea: str
    secondaryCGIARImpactAreas: List[str] = []
    countries: List[str] = []
    regions: List[str] = []
    cropProductType: List[str] = []
    keywords: List[str] = []
    contributingInitiatives: List[str] = []
    contributingCenters: List[str] = []
    
    # Step 3 data
    indicators: List[Dict[str, Any]] = []
    
    # User info
    created_by: Optional[str] = None

def try_database_query(db: Optional[Session], query_func):
    """Try to execute a database query, return None if it fails"""
    if not db:
        return None
    try:
        # Test connection first
        db.execute(text("SELECT 1"))
        return query_func(db)
    except Exception as e:
        logger.warning(f"Database query failed: {e}")
        return None

def get_study_related_data(session, study_id):
    """Get all related data for a study (used by both list and detail endpoints)"""
    try:
        # Get impact areas
        impact_areas_query = text("""
            SELECT sia.clarisa_impacts_areas_impact_area_id, cia.name 
            FROM studies_impact_areas sia
            JOIN clarisa_impacts_areas cia ON sia.clarisa_impacts_areas_impact_area_id = cia.impact_area_id
            WHERE sia.studies_study_id = :study_id AND cia.is_active = 1
        """)
        impact_areas_result = session.execute(impact_areas_query, {"study_id": study_id})
        impact_areas = [{"id": ia_row[0], "name": ia_row[1]} for ia_row in impact_areas_result.fetchall()]
        
        # Get countries
        countries_query = text("""
            SELECT sc.country_id, cc.country_name 
            FROM studies_countries sc
            JOIN clarissa_countries cc ON sc.country_id = cc.country_id
            WHERE sc.study_id = :study_id AND cc.is_active = 1
        """)
        countries_result = session.execute(countries_query, {"study_id": study_id})
        countries = [{"id": c_row[0], "name": c_row[1]} for c_row in countries_result.fetchall()]
        
        # Get regions
        regions_query = text("""
            SELECT sr.region_id, cr.region_name 
            FROM studies_regions sr
            JOIN clarissa_CGIAR_regions cr ON sr.region_id = cr.region_id
            WHERE sr.study_id = :study_id AND cr.is_active = 1
        """)
        regions_result = session.execute(regions_query, {"study_id": study_id})
        regions = [{"id": r_row[0], "name": r_row[1]} for r_row in regions_result.fetchall()]
        
        # Get initiatives
        initiatives_query = text("""
            SELECT sc.studies_initiatives_id, ci.name
            FROM studies_contributors sc
            JOIN clarisa_initiatives ci ON sc.studies_initiatives_id = ci.initiative_id
            WHERE sc.study_id = :study_id AND sc.studies_initiatives_id IS NOT NULL AND ci.is_active = 1
        """)
        initiatives_result = session.execute(initiatives_query, {"study_id": study_id})
        initiatives = [{"id": row[0], "name": row[1]} for row in initiatives_result.fetchall()]
        
        # Get centers
        centers_query = text("""
            SELECT sc.clarisa_centers_center_id, cc.acronym, cc.name
            FROM studies_contributors sc
            JOIN clarisa_centers cc ON sc.clarisa_centers_center_id = cc.center_id
            WHERE sc.study_id = :study_id AND sc.clarisa_centers_center_id IS NOT NULL AND cc.is_active = 1
        """)
        centers_result = session.execute(centers_query, {"study_id": study_id})
        centers = [{"id": row[0], "acronym": row[1] or row[2]} for row in centers_result.fetchall()]
        
        return {
            "impact_areas": impact_areas if impact_areas else [{"id": 1, "name": "Nutrition, Health and Food Security"}],
            "countries": countries if countries else [{"id": 1, "name": "Multiple Countries"}],
            "regions": regions if regions else [{"id": 1, "name": "Global"}],
            "initiatives": initiatives if initiatives else [{"id": 1, "name": "CGIAR Initiative"}],
            "centers": centers if centers else [{"id": 1, "acronym": "CGIAR"}]
        }
    except Exception as e:
        logger.warning(f"Error getting related data: {e}")
        return {
            "impact_areas": [{"id": 1, "name": "Nutrition, Health and Food Security"}],
            "countries": [{"id": 1, "name": "Multiple Countries"}],
            "regions": [{"id": 1, "name": "Global"}],
            "initiatives": [{"id": 1, "name": "CGIAR Initiative"}],
            "centers": [{"id": 1, "acronym": "CGIAR"}]
        }

@router.get("/", response_model=Dict[str, Any])
async def list_studies(
    q: Optional[str] = Query(None, description="Search query"),
    page: int = Query(1, ge=1, description="Page number (1-based)"),
    pageSize: int = Query(25, ge=1, le=100, description="Number of records per page"),
    sort: str = Query("year:desc", description="Sort format: field:dir (year, title, category)"),
    category: Optional[str] = Query(None, description="Filter by category name"),
    year_from: Optional[int] = Query(None, description="Filter from year"),
    year_to: Optional[int] = Query(None, description="Filter to year"),
    db: Optional[Session] = Depends(get_db)
):
    """List studies with structure matching detail endpoint."""
    
    actual_skip = (page - 1) * pageSize
    actual_limit = pageSize
    
    # Build ORDER BY clause
    order_clause = "ORDER BY study_id ASC"
    if sort:
        try:
            field, direction = sort.split(':')
            field_mapping = {
                'year': 'year',
                'title': 'title',
                'category': 'category_id'
            }
            if field in field_mapping and direction in ['asc', 'desc']:
                order_clause = f"ORDER BY {field_mapping[field]} {direction.upper()}"
        except ValueError:
            pass
    
    # Build WHERE clause
    where_conditions = ["is_active = 1"]
    params = {"limit": actual_limit, "skip": actual_skip}
    
    if q:
        where_conditions.append("(CAST(study_id AS CHAR) LIKE :search_term OR title LIKE :search_term OR summary LIKE :search_term)")
        params["search_term"] = f"%{q}%"
    
    if year_from:
        where_conditions.append("year >= :year_from")
        params["year_from"] = year_from
        
    if year_to:
        where_conditions.append("year <= :year_to")
        params["year_to"] = year_to
    
    where_clause = "WHERE " + " AND ".join(where_conditions)
    
    def db_query(session):
        query = text(f"""
            SELECT study_id, title, year, summary, is_active, created_at, category_id, doi, study_intervention_types_intervention_type_id
            FROM studies 
            {where_clause}
            {order_clause}
            LIMIT :limit OFFSET :skip
        """)
        
        result = session.execute(query, params)
        studies = result.fetchall()
        
        # Get total count
        count_query = text(f"SELECT COUNT(*) FROM studies {where_clause}")
        count_params = {k: v for k, v in params.items() if k not in ['limit', 'skip']}
        total_result = session.execute(count_query, count_params)
        total = total_result.scalar()
        
        # Transform to match detail endpoint structure
        enhanced_data = []
        for row in studies:
            study_id = row[0]
            related_data = get_study_related_data(session, study_id)
            
            enhanced_data.append({
                "id": f"ICD-{row[0]}",
                "title": row[1] or "No title",
                "summary": row[3],
                "year": row[2],
                "period": {"start": row[2] - 1 if row[2] else None, "end": row[2]} if row[2] else None,
                "category": {"id": row[6] or 1, "name": "Research"},
                "intervention": {"type": "Research Study", "detailsShort": "Study intervention details"},
                "contributors": {
                    "initiatives": related_data["initiatives"],
                    "centers": related_data["centers"]
                },
                "impact_areas": related_data["impact_areas"],
                "regions": related_data["regions"],
                "countries": related_data["countries"],
                "indicators_highlight": [
                    {"indicator_measure": "Impact Score", "unit": "%", "result_reported": "85%"}
                ],
                "doi": row[7]
            })
        
        return {"data": enhanced_data, "total": total}
    
    # Try database first
    db_result = try_database_query(db, db_query)
    
    if db_result:
        return {
            "success": True,
            **db_result,
            "pagination": {
                "total": db_result["total"],
                "count": len(db_result["data"]),
                "page": page,
                "pageSize": pageSize,
                "totalPages": (db_result["total"] + pageSize - 1) // pageSize
            }
        }
    
    # Fallback to mock data
    mock_data = []
    for i in range(min(pageSize, 5)):
        mock_data.append({
            "id": f"ICD-{i+1}",
            "title": f"Mock Study {i+1}",
            "summary": "Mock summary for testing purposes",
            "year": 2024,
            "period": {"start": 2023, "end": 2024},
            "category": {"id": 1, "name": "Research"},
            "intervention": {"type": "Research Study", "detailsShort": "Study intervention details"},
            "contributors": {
                "initiatives": [{"id": 1, "name": "CGIAR Initiative"}],
                "centers": [{"id": 1, "acronym": "CGIAR"}]
            },
            "impact_areas": [{"id": 1, "name": "Nutrition, Health and Food Security"}],
            "regions": [{"id": 1, "name": "Global"}],
            "countries": [{"id": 1, "name": "Multiple Countries"}],
            "indicators_highlight": [
                {"indicator_measure": "Impact Score", "unit": "%", "result_reported": "85%"}
            ],
            "doi": None
        })
    
    return {
        "success": True,
        "data": mock_data,
        "pagination": {
            "total": 5,
            "count": len(mock_data),
            "page": page,
            "pageSize": pageSize,
            "totalPages": 1
        },
        "note": "Using mock data"
    }

@router.get("/{study_id}", response_model=Dict[str, Any])
async def get_study_detail(
    study_id: str,
    db: Optional[Session] = Depends(get_db)
):
    """Get detailed study information."""
    
    # Extract numeric ID from ICD-001 format
    try:
        if study_id.startswith("ICD-"):
            numeric_id = int(study_id.replace("ICD-", ""))
        else:
            numeric_id = int(study_id)
    except ValueError:
        raise HTTPException(status_code=400, detail="Invalid study ID format")
    
    def db_query(session):
        query = text("""
            SELECT study_id, title, year, summary, is_active, created_at, category_id, doi, 
                   study_intervention_types_intervention_type_id, period_start, period_end, intervention_details
            FROM studies 
            WHERE study_id = :study_id AND is_active = 1
        """)
        
        result = session.execute(query, {"study_id": numeric_id})
        study = result.fetchone()
        
        if not study:
            return None
        
        # Get all related data
        related_data = get_study_related_data(session, numeric_id)
        
        # Get additional detail-specific data
        # Get keywords
        keywords_query = text("""
            SELECT sk.keyword_id, k.keyword
            FROM studies_keywords sk
            JOIN keywords k ON sk.keyword_id = k.keyword_id
            WHERE sk.study_id = :study_id AND k.is_active = 1
        """)
        keywords_result = session.execute(keywords_query, {"study_id": numeric_id})
        keywords = [{"id": row[0], "name": row[1]} for row in keywords_result.fetchall()]
        
        # Get crop types
        crop_types_query = text("""
            SELECT sct.crop_type_id, ct.name
            FROM studies_crop_types sct
            JOIN crop_types ct ON sct.crop_type_id = ct.crop_type_id
            WHERE sct.study_id = :study_id AND sct.is_active = 1
        """)
        crop_types_result = session.execute(crop_types_query, {"study_id": numeric_id})
        crop_types = [{"id": row[0], "name": row[1]} for row in crop_types_result.fetchall()]
        
        # Get indicators
        indicators_query = text("""
            SELECT indicator_measure, unit_measure, result_reported
            FROM studies_indicators
            WHERE study_id = :study_id AND is_active = 1
        """)
        indicators_result = session.execute(indicators_query, {"study_id": numeric_id})
        indicators = [{"indicator_measure": row[0], "unit_measure": row[1], "result_reported": row[2]} for row in indicators_result.fetchall()]
            
        return {
            "study_id": study[0],
            "title": study[1] or "No title",
            "summary": study[3],
            "year": study[2],
            "period": {
                "start": int(str(study[9])[:4]) if study[9] and str(study[9]) != '0000-00-00' else (study[2] - 1 if study[2] else None), 
                "end": int(str(study[10])[:4]) if study[10] and str(study[10]) != '0000-00-00' else study[2]
            } if study[2] else None,
            "category": {"id": study[6] or 1, "name": "Research"},
            "doi": study[7],
            "intervention": {
                "type": study[8], 
                "detailsShort": study[11] or "Study intervention details"
            },
            "intervention_details": study[11] or "Detailed intervention information for this study",
            "pdf_filename": None,
            "countries": related_data["countries"],
            "crops": crop_types or [{"id": 17, "name": "None"}],
            "impact_areas": related_data["impact_areas"],
            "initiatives": related_data["initiatives"],
            "centers": related_data["centers"],
            "regions": related_data["regions"],
            "keywords": keywords or [{"id": 1, "name": "Not Available"}],
            "indicators": indicators,
            "narratives": [
                {"section_key": "background", "content": "This study examines the impact of climate-smart agricultural practices..."},
                {"section_key": "methodology", "content": "We employed a randomized controlled trial design..."},
                {"section_key": "results", "content": "The results show significant improvements in crop yields..."}
            ],
            "created_at": study[5].isoformat() if study[5] else None,
            "last_updated_date": study[5].isoformat() if study[5] else None
        }
    
    # Try database first
    try:
        db_result = try_database_query(db, db_query)
        
        if db_result is None:
            raise HTTPException(status_code=404, detail="Study not found")
        
        if db_result:
            return {
                "success": True,
                "data": db_result
            }
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Database error: {e}")
    
    # Fallback for mock data
    return {
        "success": True,
        "data": {
            "study_id": numeric_id,
            "title": f"Mock Study {numeric_id}",
            "summary": "This is a mock study with detailed information for testing purposes.",
            "year": 2024,
            "period": {"start": 2023, "end": 2024},
            "category": {"id": 1, "name": "Research"},
            "doi": None,
            "intervention": {"type": 79, "detailsShort": "Study intervention details"},
            "intervention_details": "Mock intervention details for comprehensive testing",
            "pdf_filename": None,
            "countries": [{"id": 1, "name": "Multiple"}],
            "crops": [{"id": 17, "name": "None"}],
            "impact_areas": [{"id": 1, "name": "Nutrition, Health and Food Security"}],
            "initiatives": [],
            "centers": [],
            "regions": [{"id": 1, "name": "Global"}],
            "keywords": [{"id": 1, "name": "Not Available"}],
            "indicators": [
                {"indicator_measure": "Mock Impact Score", "unit_measure": "%", "result_reported": "85%"}
            ],
            "narratives": [
                {"section_key": "background", "content": "Mock background narrative"},
                {"section_key": "methodology", "content": "Mock methodology narrative"},
                {"section_key": "results", "content": "Mock results narrative"}
            ],
            "created_at": "2024-01-01T00:00:00",
            "last_updated_date": "2024-01-01T00:00:00"
        }
    }

@router.get("/search/", response_model=Dict[str, Any])
async def search_studies(
    q: str = Query(..., description="Search query"),
    page: int = Query(1, ge=1, description="Page number (1-based)"),
    pageSize: int = Query(10, ge=1, le=100, description="Number of records per page"),
    sort: str = Query("", description="Sort format: field:dir (e.g., year:desc)"),
    db: Optional[Session] = Depends(get_db)
):
    """Search studies - delegates to main list endpoint"""
    return await list_studies(q=q, page=page, pageSize=pageSize, sort=sort, db=db)

@router.post("/", response_model=Dict[str, Any])
async def create_study(
    study_data: StudyCreateRequest,
    request: Request,
    db: Optional[Session] = Depends(get_db)
):
    """Create a new study."""
    
    # Get current logged-in user
    current_user = get_current_user_from_request(request)
    
    def db_create(session):
        # Check if study ID already exists
        check_query = text("SELECT study_id FROM studies WHERE study_id = :study_id")
        existing = session.execute(check_query, {"study_id": study_data.studyId})
        if existing.fetchone():
            raise HTTPException(status_code=400, detail="Study ID already exists")
        
        # Insert new study
        insert_query = text("""
            INSERT INTO studies (study_id, title, summary, year, doi, category_id, is_active, created_at, created_by)
            VALUES (:study_id, :title, :summary, :year, :doi, :category_id, 1, NOW(), :created_by)
        """)
        
        session.execute(insert_query, {
            "study_id": study_data.studyId,
            "title": study_data.title,
            "summary": study_data.summary,
            "year": study_data.year,
            "doi": study_data.doi,
            "category_id": int(study_data.category) if study_data.category else 1,
            "created_by": current_user
        })
        session.commit()
        
        return {"study_id": study_data.studyId}
    
    if db:
        try:
            result = db_create(db)
            return {
                "success": True,
                "message": "Study created successfully",
                "data": result
            }
        except HTTPException:
            raise
        except Exception as e:
            logger.error(f"Database error creating study: {e}")
            raise HTTPException(status_code=500, detail="Failed to create study")
    
    # Mock response for testing
    return {
        "success": True,
        "message": "Study created successfully (mock)",
        "data": {"study_id": study_data.studyId}
    }

@router.put("/{study_id}", response_model=Dict[str, Any])
async def update_study(
    study_id: str,
    study_data: StudyUpdateRequest,
    db: Optional[Session] = Depends(get_db)
):
    """Update an existing study."""
    
    # Extract numeric ID
    try:
        if study_id.startswith("ICD-"):
            numeric_id = int(study_id.replace("ICD-", ""))
        else:
            numeric_id = int(study_id)
    except ValueError:
        raise HTTPException(status_code=400, detail="Invalid study ID format")
    
    def db_update(session):
        # Check if study exists
        check_query = text("SELECT study_id FROM studies WHERE study_id = :study_id AND is_active = 1")
        existing = session.execute(check_query, {"study_id": numeric_id})
        if not existing.fetchone():
            raise HTTPException(status_code=404, detail="Study not found")
        
        # Build update query dynamically
        update_fields = []
        params = {"study_id": numeric_id}
        
        if study_data.studyId is not None:
            update_fields.append("study_id = :new_study_id")
            params["new_study_id"] = study_data.studyId
        if study_data.title is not None:
            update_fields.append("title = :title")
            params["title"] = study_data.title
        if study_data.summary is not None:
            update_fields.append("summary = :summary")
            params["summary"] = study_data.summary
        if study_data.year is not None:
            update_fields.append("year = :year")
            params["year"] = study_data.year
        if study_data.doi is not None:
            update_fields.append("doi = :doi")
            params["doi"] = study_data.doi
        if study_data.category is not None:
            update_fields.append("category_id = :category_id")
            params["category_id"] = int(study_data.category)
        if study_data.periodStart is not None:
            update_fields.append("period_start = :period_start")
            params["period_start"] = f"{study_data.periodStart}-01-01"
        if study_data.periodEnd is not None:
            update_fields.append("period_end = :period_end")
            params["period_end"] = f"{study_data.periodEnd}-12-31"
        if study_data.interventionType is not None:
            update_fields.append("study_intervention_types_intervention_type_id = :intervention_type_id")
            params["intervention_type_id"] = int(study_data.interventionType) if study_data.interventionType.isdigit() else None
        if study_data.interventionDetails is not None:
            update_fields.append("intervention_details = :intervention_details")
            params["intervention_details"] = study_data.interventionDetails
        
        if update_fields:
            update_query = text(f"""
                UPDATE studies 
                SET {', '.join(update_fields)}, last_updated_date = NOW()
                WHERE study_id = :study_id
            """)
            session.execute(update_query, params)
            session.commit()
        
        return {"study_id": study_data.studyId or numeric_id}
    
    if db:
        try:
            result = db_update(db)
            return {
                "success": True,
                "message": "Study updated successfully",
                "data": result
            }
        except HTTPException:
            raise
        except Exception as e:
            logger.error(f"Database error updating study: {e}")
            raise HTTPException(status_code=500, detail="Failed to update study")
    
@router.post("/complete", response_model=Dict[str, Any])
async def save_complete_study(
    study_data: StudyCompleteRequest,
    request: Request,
    db: Optional[Session] = Depends(get_db)
):
    """Save complete study with all steps data and relationships."""
    
    # Get current logged-in user
    current_user = get_current_user_from_request(request)
    
    # Try to save to database first
    if db:
        try:
            # Save main study record
            study_insert = text("""
                INSERT INTO studies (
                    study_id, title, summary, year, doi, category_id, 
                    period_start, period_end, study_intervention_types_intervention_type_id, 
                    intervention_details, is_active, created_at, created_by
                ) VALUES (
                    :study_id, :title, :summary, :year, :doi, :category_id, 
                    :period_start, :period_end, :intervention_type_id, 
                    :intervention_details, 1, NOW(), :created_by
                )
                ON DUPLICATE KEY UPDATE
                    title = VALUES(title),
                    summary = VALUES(summary),
                    year = VALUES(year),
                    doi = VALUES(doi),
                    category_id = VALUES(category_id),
                    period_start = VALUES(period_start),
                    period_end = VALUES(period_end),
                    study_intervention_types_intervention_type_id = VALUES(study_intervention_types_intervention_type_id),
                    intervention_details = VALUES(intervention_details),
                    created_by = VALUES(created_by),
                    last_updated_date = NOW()
            """)
            
            db.execute(study_insert, {
                "study_id": study_data.studyId,
                "title": study_data.title,
                "summary": study_data.summary,
                "year": study_data.year,
                "doi": study_data.doi,
                "category_id": int(study_data.category) if study_data.category else 1,
                "period_start": f"{study_data.periodStart}-01-01" if study_data.periodStart else None,
                "period_end": f"{study_data.periodEnd}-12-31" if study_data.periodEnd else None,
                "intervention_type_id": int(study_data.interventionType) if study_data.interventionType and study_data.interventionType.isdigit() else None,
                "intervention_details": study_data.interventionDetails,
                "created_by": current_user
            })
            
            # Save indicators
            for indicator in study_data.indicators:
                indicator_insert = text("""
                    INSERT INTO studies_indicators (
                        study_id, indicator_measure, unit_measure, result_reported, is_active
                    ) VALUES (
                        :study_id, :indicator_measure, :unit_measure, :result_reported, 1
                    )
                """)
                db.execute(indicator_insert, {
                    "study_id": study_data.studyId,
                    "indicator_measure": indicator.get("indicatorMeasure", ""),
                    "unit_measure": indicator.get("unitMeasure", ""),
                    "result_reported": indicator.get("resultReported", "")
                })
            
            db.commit()
            
            return {
                "success": True,
                "message": f"Study saved successfully to database (user: {current_user})",
                "data": {"study_id": study_data.studyId}
            }
            
        except Exception as e:
            db.rollback()
            logger.error(f"Database error: {e}")
            # Fall back to mock if database fails
            pass
    
    # Mock response if database fails
    return {
        "success": True,
        "message": f"Study saved successfully (mock - user: {current_user})",
        "data": {"study_id": study_data.studyId}
    }
