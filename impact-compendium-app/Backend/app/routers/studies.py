"""
Studies router with aligned structure between list and detail endpoints
"""

import logging
from typing import Any, Dict, List, Optional, Union

from fastapi import APIRouter, Depends, HTTPException, Query, Request
from pydantic import BaseModel
from sqlalchemy import text
from sqlalchemy.orm import Session

from app.db.connection import get_db
from app.middleware.auth import (
    get_current_user,
    get_current_user_optional,
    require_researcher,
)

logger = logging.getLogger(__name__)
router = APIRouter()


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
    primaryCGIARImpactArea: Union[str, int]
    secondaryCGIARImpactAreas: List[Union[str, int]] = []
    countries: List[Union[str, int]] = []
    regions: List[Union[str, int]] = []
    cropProductType: List[Union[str, int]] = []
    keywords: List[Union[str, int]] = []
    contributingInitiatives: List[Union[str, int]] = []
    contributingCenters: List[Union[str, int]] = []

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
        impact_areas_query = text(
            """
            SELECT sia.clarisa_impacts_areas_impact_area_id, cia.name 
            FROM studies_impact_areas sia
            JOIN clarisa_impacts_areas cia ON sia.clarisa_impacts_areas_impact_area_id = cia.impact_area_id
            WHERE sia.studies_study_id = :study_id AND cia.is_active = 1
        """
        )
        impact_areas_result = session.execute(
            impact_areas_query, {"study_id": study_id}
        )
        impact_areas = [
            {"id": ia_row[0], "name": ia_row[1]}
            for ia_row in impact_areas_result.fetchall()
        ]

        # Get countries
        countries_query = text(
            """
            SELECT sc.country_id, cc.country_name 
            FROM studies_countries sc
            JOIN clarisa_countries cc ON sc.country_id = cc.country_id
            WHERE sc.study_id = :study_id AND cc.is_active = 1
        """
        )
        countries_result = session.execute(countries_query, {"study_id": study_id})
        countries = [
            {"id": c_row[0], "name": c_row[1]} for c_row in countries_result.fetchall()
        ]

        # Get regions
        regions_query = text(
            """
            SELECT sr.region_id, cr.region_name 
            FROM studies_regions sr
            JOIN clarisa_cgiar_regions cr ON sr.region_id = cr.region_id
            WHERE sr.study_id = :study_id AND cr.is_active = 1
        """
        )
        regions_result = session.execute(regions_query, {"study_id": study_id})
        regions = [
            {"id": r_row[0], "name": r_row[1]} for r_row in regions_result.fetchall()
        ]

        # Get initiatives
        initiatives_query = text(
            """
            SELECT sc.clarisa_initiatives_initiative_id, ci.name
            FROM studies_contributors sc
            JOIN clarisa_initiatives ci ON sc.clarisa_initiatives_initiative_id = ci.initiative_id
            WHERE sc.study_id = :study_id AND sc.clarisa_initiatives_initiative_id IS NOT NULL AND ci.is_active = 1
        """
        )
        initiatives_result = session.execute(initiatives_query, {"study_id": study_id})
        initiatives = [
            {"id": row[0], "name": row[1]} for row in initiatives_result.fetchall()
        ]

        # Get centers
        centers_query = text(
            """
            SELECT sc.clarisa_centers_center_id, cc.acronym, cc.name
            FROM studies_contributors sc
            JOIN clarisa_centers cc ON sc.clarisa_centers_center_id = cc.center_id
            WHERE sc.study_id = :study_id AND sc.clarisa_centers_center_id IS NOT NULL AND cc.is_active = 1
        """
        )
        centers_result = session.execute(centers_query, {"study_id": study_id})
        centers = [
            {"id": row[0], "acronym": row[1] or row[2]}
            for row in centers_result.fetchall()
        ]

        return {
            "impact_areas": impact_areas,
            "countries": countries,
            "regions": regions,
            "initiatives": initiatives,
            "centers": centers,
        }
    except Exception as e:
        logger.warning(f"Error getting related data: {e}")
        return {
            "impact_areas": [],
            "countries": [],
            "regions": [],
            "initiatives": [],
            "centers": [],
        }


@router.get("/check-id/{study_id}")
async def check_study_id_exists(study_id: str, db: Session = Depends(get_db)):
    """Check if a Study ID already exists"""
    try:
        # Check if study exists with this ID
        query = text(
            """
            SELECT COUNT(*) as count 
            FROM studies 
            WHERE study_id = :study_id
        """
        )

        result = db.execute(query, {"study_id": study_id}).fetchone()
        exists = result.count > 0 if result else False

        return {"exists": exists, "study_id": study_id}
    except Exception as e:
        logger.error(f"Error checking study ID: {e}")
        raise HTTPException(status_code=500, detail="Failed to check study ID")


@router.get("/", response_model=Dict[str, Any])
async def list_studies(
    q: Optional[str] = Query(None, description="Search query"),
    page: int = Query(1, ge=1, description="Page number (1-based)"),
    pageSize: int = Query(25, ge=1, le=100, description="Number of records per page"),
    sort: str = Query(
        "year:desc", description="Sort format: field:dir (year, title, category, id)"
    ),
    category: Optional[str] = Query(None, description="Filter by category name"),
    year_from: Optional[int] = Query(None, description="Filter from year"),
    year_to: Optional[int] = Query(None, description="Filter to year"),
    db: Optional[Session] = Depends(get_db),
):
    """
    List studies with pagination, search, and sorting capabilities.

    Args:
        q: Search query to filter by study ID, title, or summary
        page: Page number (1-based)
        pageSize: Number of records per page (1-100)
        sort: Sort format as "field:direction" (e.g., "id:desc", "year:asc")
        category: Filter by category name
        year_from: Filter studies from this year onwards
        year_to: Filter studies up to this year
        db: Database session

    Returns:
        Paginated list of studies with metadata
    """

    actual_skip = (page - 1) * pageSize
    actual_limit = pageSize

    # Build ORDER BY clause - default to study_id DESC for newest first
    order_clause = "ORDER BY study_id DESC"
    if sort:
        try:
            field, direction = sort.split(":")
            field_mapping = {
                "year": "year",
                "title": "title",
                "category": "category_id",
                "id": "study_id",
            }
            if field in field_mapping and direction.lower() in ["asc", "desc"]:
                order_clause = f"ORDER BY {field_mapping[field]} {direction.upper()}"
        except ValueError:
            # Invalid sort format, use default
            pass

    # Build WHERE clause for the first query (with table alias)
    where_conditions = ["s.is_active = 1"]
    params = {"limit": actual_limit, "skip": actual_skip}

    # Build search and filter conditions
    if q:
        where_conditions.append(
            "(CAST(s.study_id AS CHAR) LIKE :search_term OR s.title LIKE :search_term OR s.summary LIKE :search_term)"
        )
        params["search_term"] = f"%{q}%"

    if year_from:
        where_conditions.append("s.year >= :year_from")
        params["year_from"] = year_from

    if year_to:
        where_conditions.append("s.year <= :year_to")
        params["year_to"] = year_to

    where_clause = "WHERE " + " AND ".join(where_conditions)

    # Database connection check
    if not db:
        return {
            "success": True,
            "data": [],
            "total": 0,
            "pagination": {
                "total": 0,
                "count": 0,
                "page": page,
                "pageSize": pageSize,
                "totalPages": 0,
            },
        }

    try:
        # Build WHERE clause for direct query (without table alias)
        direct_where_clause = "WHERE is_active = 1"
        direct_params = {"limit": actual_limit, "skip": actual_skip}

        if q:
            direct_where_clause += " AND (CAST(study_id AS CHAR) LIKE :search_term OR title LIKE :search_term)"
            direct_params["search_term"] = f"%{q}%"

        # Get total count
        count_query = text(
            f"SELECT COUNT(*) FROM studies s {direct_where_clause.replace('WHERE', 'WHERE s.')}"
        )
        count_params = {
            k: v for k, v in direct_params.items() if k not in ["limit", "skip"]
        }
        total_result = db.execute(count_query, count_params)
        total_count = total_result.scalar()

        # Get paginated data with sorting - JOIN with categories table to get category name
        query = text(
            f"""
            SELECT s.study_id, s.title, s.year, s.summary, s.category_id, s.doi, c.name as category_name
            FROM studies s 
            LEFT JOIN categories c ON s.category_id = c.study_category_id 
            {direct_where_clause.replace('WHERE', 'WHERE s.')} 
            {order_clause.replace('study_id', 's.study_id').replace('year', 's.year').replace('title', 's.title')} 
            LIMIT :limit OFFSET :skip
        """
        )
        result = db.execute(query, direct_params)
        studies = result.fetchall()

        # Transform data for response
        data = []
        for row in studies:
            data.append(
                {
                    "id": row[0],
                    "title": row[1] or "No title",
                    "year": row[2] or "N/A",
                    "summary": row[3] or "No summary available",
                    "category": {
                        "id": row[4] or 1,
                        "name": row[6] or "Unknown Category",
                    },
                    "doi": row[5] or "N/A",
                }
            )

        total_pages = (total_count + pageSize - 1) // pageSize

        return {
            "success": True,
            "data": data,
            "total": total_count,
            "pagination": {
                "total": total_count,
                "count": len(data),
                "page": page,
                "pageSize": pageSize,
                "totalPages": total_pages,
            },
        }

    except Exception as e:
        logger.error(f"Database error in list_studies: {e}")
        return {
            "success": False,
            "error": str(e),
            "data": [],
            "total": 0,
            "pagination": {
                "total": 0,
                "count": 0,
                "page": page,
                "pageSize": pageSize,
                "totalPages": 0,
            },
        }


@router.get("/{study_id}", response_model=Dict[str, Any])
async def get_study_detail(study_id: str, db: Optional[Session] = Depends(get_db)):
    """Get detailed study information."""

    # Skip if this is the complete endpoint
    if study_id == "complete":
        raise HTTPException(status_code=404, detail="Not found")

    # Extract numeric ID from ICD-001 format
    try:
        if study_id.startswith("ICD-"):
            numeric_id = int(study_id.replace("ICD-", ""))
        else:
            numeric_id = int(study_id)
    except ValueError:
        raise HTTPException(status_code=400, detail="Invalid study ID format")

    def db_query(session):
        query = text(
            """
            SELECT study_id, title, year, summary, is_active, created_at, category_id, doi, 
                   period_start, period_end, intervention_details, last_updated_date
            FROM studies 
            WHERE study_id = :study_id
        """
        )

        result = session.execute(query, {"study_id": numeric_id})
        study = result.fetchone()

        if not study:
            logger.warning(f"No study found with ID {numeric_id}")
            return None

        # Get all related data
        related_data = get_study_related_data(session, numeric_id)

        # DEBUG: Add raw counts for verification
        impact_count_query = text(
            "SELECT COUNT(*) FROM studies_impact_areas WHERE studies_study_id = :study_id"
        )
        impact_count = session.execute(
            impact_count_query, {"study_id": numeric_id}
        ).scalar()

        initiative_count_query = text(
            "SELECT COUNT(*) FROM studies_contributors WHERE study_id = :study_id AND clarisa_initiatives_initiative_id IS NOT NULL"
        )
        initiative_count = session.execute(
            initiative_count_query, {"study_id": numeric_id}
        ).scalar()

        logger.info(
            f"DEBUG Study {numeric_id}: impact_areas_count={impact_count}, initiatives_count={initiative_count}"
        )
        logger.info(
            f"DEBUG Study {numeric_id}: impact_areas_data={related_data['impact_areas']}"
        )
        logger.info(
            f"DEBUG Study {numeric_id}: initiatives_data={related_data['initiatives']}"
        )

        # Get additional detail-specific data
        # Get keywords
        keywords_query = text(
            """
            SELECT sk.keyword_id, k.keyword
            FROM studies_keywords sk
            JOIN keywords k ON sk.keyword_id = k.keyword_id
            WHERE sk.study_id = :study_id AND k.is_active = 1
        """
        )
        keywords_result = session.execute(keywords_query, {"study_id": numeric_id})
        keywords = [
            {"id": row[0], "name": row[1]} for row in keywords_result.fetchall()
        ]

        # Get crop types
        crop_types_query = text(
            """
            SELECT sct.crop_type_id, ct.name
            FROM studies_crop_types sct
            JOIN crop_types ct ON sct.crop_type_id = ct.crop_type_id
            WHERE sct.study_id = :study_id AND sct.is_active = 1
        """
        )
        crop_types_result = session.execute(crop_types_query, {"study_id": numeric_id})
        crop_types = [
            {"id": row[0], "name": row[1]} for row in crop_types_result.fetchall()
        ]

        # Get indicators
        indicators_query = text(
            """
            SELECT indicator_measure, unit_measure, result_reported
            FROM studies_indicators
            WHERE study_id = :study_id AND is_active = 1
        """
        )
        indicators_result = session.execute(indicators_query, {"study_id": numeric_id})
        indicators = [
            {
                "indicator_measure": row[0],
                "unit_measure": row[1],
                "result_reported": row[2],
            }
            for row in indicators_result.fetchall()
        ]

        # Get category name
        category_query = text(
            """
            SELECT sc.study_category_id, sc.name
            FROM categories sc
            WHERE sc.study_category_id = :category_id AND sc.is_active = 1
            LIMIT 1
        """
        )
        category_result = session.execute(category_query, {"category_id": study[6]})
        category_row = category_result.fetchone()

        category_info = {
            "id": study[6] or 1,
            "name": category_row[1] if category_row else "Research",
        }
        # Get intervention type from junction table
        intervention_type_query = text(
            """
            SELECT it.intervention_type_id, it.name
            FROM studies_intervention_types sit
            JOIN intervention_types it ON sit.intervention_type_id = it.intervention_type_id
            WHERE sit.study_id = :study_id AND sit.is_active = 1
            LIMIT 1
        """
        )
        intervention_type_result = session.execute(
            intervention_type_query, {"study_id": numeric_id}
        )
        intervention_type_row = intervention_type_result.fetchone()

        if intervention_type_row:
            intervention_info = {
                "id": intervention_type_row[0],
                "name": intervention_type_row[1],
            }
        else:
            intervention_info = None

        if intervention_type_row:
            intervention_info = {
                "id": intervention_type_row[0],
                "name": intervention_type_row[1],
            }
        else:
            intervention_info = None

        return {
            "study_id": study[0],
            "title": study[1] or "No title",
            "summary": study[3],
            "year": study[2],
            "period": {
                "start": int(str(study[8])[:4])
                if study[8] and str(study[8]) != "0000-00-00"
                else (study[2] - 1 if study[2] else None),
                "end": int(str(study[9])[:4])
                if study[9] and str(study[9]) != "0000-00-00"
                else study[2],
            }
            if study[2]
            else None,
            "category": category_info,
            "doi": study[7],
            "intervention": {
                "id": intervention_info["id"] if intervention_info else None,
                "name": intervention_info["name"] if intervention_info else None,
                "type": intervention_info["id"]
                if intervention_info
                else None,  # Keep for backward compatibility
                "detailsShort": study[10] or "Study intervention details",
            },
            "intervention_details": study[10]
            or "Detailed intervention information for this study",
            "pdf_filename": None,
            "countries": related_data["countries"],
            "crops": crop_types,
            "impact_areas": related_data["impact_areas"],
            "initiatives": related_data["initiatives"],
            "centers": related_data["centers"],
            "regions": related_data["regions"],
            "keywords": keywords,
            "indicators": indicators,
            "created_at": study[5].isoformat() if study[5] else None,
            "last_updated_date": study[11].isoformat() if study[11] else None,
        }

    # Try database first
    try:
        if not db:
            raise HTTPException(
                status_code=404, detail="Database connection not available"
            )

        db_result = db_query(db)

        if db_result is None:
            raise HTTPException(status_code=404, detail="Study not found")

        if db_result:
            return {"success": True, "data": db_result}
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Database error in get_study_detail: {e}")
        raise HTTPException(status_code=500, detail=f"Database error: {str(e)}")


@router.get("/search/", response_model=Dict[str, Any])
async def search_studies(
    q: str = Query(..., description="Search query"),
    page: int = Query(1, ge=1, description="Page number (1-based)"),
    pageSize: int = Query(10, ge=1, le=100, description="Number of records per page"),
    sort: str = Query("", description="Sort format: field:dir (e.g., year:desc)"),
    db: Optional[Session] = Depends(get_db),
):
    """Search studies - delegates to main list endpoint"""
    return await list_studies(q=q, page=page, pageSize=pageSize, sort=sort, db=db)


@router.post("/", response_model=Dict[str, Any])
async def create_study(
    study_data: StudyCreateRequest,
    current_user: Dict[str, Any] = Depends(require_researcher),
    db: Optional[Session] = Depends(get_db),
):
    """Create a new study."""

    # Get current logged-in user email
    user_email = current_user.get("email", "system")

    def db_create(session):
        # Check if study ID already exists
        check_query = text("SELECT study_id FROM studies WHERE study_id = :study_id")
        existing = session.execute(check_query, {"study_id": study_data.studyId})
        if existing.fetchone():
            raise HTTPException(status_code=400, detail="Study ID already exists")

        # Insert new study
        insert_query = text(
            """
            INSERT INTO studies (study_id, title, summary, year, doi, category_id, is_active, created_at, created_by)
            VALUES (:study_id, :title, :summary, :year, :doi, :category_id, 1, NOW(), :created_by)
        """
        )

        # Use the category ID directly from frontend (already database IDs)
        db_category_id = int(study_data.category) if study_data.category else 156

        session.execute(
            insert_query,
            {
                "study_id": study_data.studyId,
                "title": study_data.title,
                "summary": study_data.summary,
                "year": study_data.year,
                "doi": study_data.doi,
                "category_id": db_category_id,
                "created_by": user_email,
            },
        )
        session.commit()

        return {"study_id": study_data.studyId}

    if db:
        try:
            result = db_create(db)
            return {
                "success": True,
                "message": "Study created successfully",
                "data": result,
            }
        except HTTPException:
            raise
        except Exception as e:
            logger.error(f"Database error creating study: {e}")
            raise HTTPException(status_code=500, detail="Failed to create study")


@router.put("/{study_id}", response_model=Dict[str, Any])
async def update_study(
    study_id: str,
    study_data: StudyUpdateRequest,
    current_user: Dict[str, Any] = Depends(require_researcher),
    db: Optional[Session] = Depends(get_db),
):
    """Update an existing study."""

    # Get current logged-in user email
    user_email = current_user.get("email", "system")

    # Extract numeric ID
    try:
        if study_id.startswith("ICD-"):
            numeric_id = int(study_id.replace("ICD-", ""))
        else:
            numeric_id = int(study_id)
    except ValueError:
        raise HTTPException(status_code=400, detail="Invalid study ID format")

    if db:
        try:
            # Check if study exists
            check_query = text(
                "SELECT study_id FROM studies WHERE study_id = :study_id AND is_active = 1"
            )
            existing = db.execute(check_query, {"study_id": numeric_id})
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
                # Use the category ID directly from frontend (already database IDs)
                db_category_id = (
                    int(study_data.category) if study_data.category else 156
                )
                update_fields.append("category_id = :category_id")
                params["category_id"] = db_category_id
            if study_data.periodStart is not None:
                update_fields.append("period_start = :period_start")
                params["period_start"] = f"{study_data.periodStart}-01-01"
            if study_data.periodEnd is not None:
                update_fields.append("period_end = :period_end")
                params["period_end"] = f"{study_data.periodEnd}-12-31"
            if study_data.interventionDetails is not None:
                update_fields.append("intervention_details = :intervention_details")
                params["intervention_details"] = study_data.interventionDetails

            # Handle intervention type with same workaround as create function
            if (
                study_data.interventionType is not None
                and study_data.interventionType.isdigit()
            ):
                try:
                    # Create/update junction table record first
                    junction_insert = text(
                        """
                        INSERT INTO studies_intervention_types (study_intervention_type_id, study_id, intervention_type_id, details, is_active, created_at)
                        VALUES (:intervention_type_id, :study_id, :intervention_type_id, :details, 1, NOW())
                        ON DUPLICATE KEY UPDATE
                            intervention_type_id = VALUES(intervention_type_id),
                            details = VALUES(details)
                    """
                    )
                    db.execute(
                        junction_insert,
                        {
                            "intervention_type_id": int(study_data.interventionType),
                            "study_id": numeric_id,
                            "details": study_data.interventionDetails or "",
                        },
                    )

                    # Then update studies table
                    update_fields.append(
                        "study_intervention_types_intervention_type_id = :intervention_type_id"
                    )
                    params["intervention_type_id"] = int(study_data.interventionType)

                    logger.info(
                        f"Updated intervention type {study_data.interventionType} for study {numeric_id}"
                    )
                except Exception as e:
                    logger.warning(f"Failed to update intervention type: {e}")

            if update_fields:
                update_query = text(
                    f"""
                    UPDATE studies 
                    SET {', '.join(update_fields)}, last_updated_date = NOW()
                    WHERE study_id = :study_id
                """
                )
                db.execute(update_query, params)
                db.commit()

            return {
                "success": True,
                "message": f"Study updated successfully by {user_email}",
                "data": {"study_id": study_data.studyId or numeric_id},
            }

        except HTTPException:
            raise
        except Exception as e:
            logger.error(f"Database error updating study: {e}")
            db.rollback()
            raise HTTPException(status_code=500, detail="Failed to update study")


@router.put("/{study_id}/complete", response_model=Dict[str, Any])
async def update_complete_study(
    study_id: str,
    study_data: StudyCompleteRequest,
    current_user: Dict[str, Any] = Depends(require_researcher),
    db: Optional[Session] = Depends(get_db),
):
    """Update complete study with all steps data and relationships."""

    # Extract numeric ID
    try:
        if study_id.startswith("ICD-"):
            numeric_id = int(study_id.replace("ICD-", ""))
        else:
            numeric_id = int(study_id)
    except ValueError:
        raise HTTPException(status_code=400, detail="Invalid study ID format")

    # Override the studyId in the request with the path parameter
    study_data.studyId = numeric_id

    # Log incoming data for debugging
    logger.info(f"Received update request for study {numeric_id}")
    logger.info(f"Study data: {study_data.dict()}")

    # Get current logged-in user email
    user_email = current_user.get("email", "system")

    # Try to update in database
    if db:
        try:
            # Check if study exists
            check_query = text(
                "SELECT study_id FROM studies WHERE study_id = :study_id AND is_active = 1"
            )
            existing = db.execute(check_query, {"study_id": numeric_id})
            if not existing.fetchone():
                raise HTTPException(status_code=404, detail="Study not found")

            # Update main study record (same logic as POST /complete)
            study_update = text(
                """
                UPDATE studies SET
                    title = :title,
                    summary = :summary,
                    year = :year,
                    doi = :doi,
                    category_id = :category_id,
                    period_start = :period_start,
                    period_end = :period_end,
                    study_intervention_types_intervention_type_id = :intervention_type_id,
                    intervention_details = :intervention_details,
                    last_updated_date = NOW()
                WHERE study_id = :study_id
            """
            )

            # Use the category ID directly from frontend (already database IDs)
            db_category_id = int(study_data.category) if study_data.category else 156

            db.execute(
                study_update,
                {
                    "study_id": numeric_id,
                    "title": study_data.title,
                    "summary": study_data.summary,
                    "year": study_data.year,
                    "doi": study_data.doi,
                    "category_id": db_category_id,
                    "period_start": f"{study_data.periodStart}-01-01"
                    if study_data.periodStart
                    else None,
                    "period_end": f"{study_data.periodEnd}-12-31"
                    if study_data.periodEnd
                    else None,
                    "intervention_type_id": None,  # Will be set via junction table after study is updated
                    "intervention_details": study_data.interventionDetails,
                },
            )

            logger.info(f"Updated study with ID: {numeric_id}")

            # Clear existing relationships for this study (same as create function)
            db.execute(
                text("DELETE FROM studies_contributors WHERE study_id = :study_id"),
                {"study_id": numeric_id},
            )
            db.execute(
                text("DELETE FROM studies_countries WHERE study_id = :study_id"),
                {"study_id": numeric_id},
            )
            db.execute(
                text("DELETE FROM studies_regions WHERE study_id = :study_id"),
                {"study_id": numeric_id},
            )
            db.execute(
                text(
                    "DELETE FROM studies_impact_areas WHERE studies_study_id = :study_id"
                ),
                {"study_id": numeric_id},
            )
            db.execute(
                text("DELETE FROM studies_keywords WHERE study_id = :study_id"),
                {"study_id": numeric_id},
            )
            db.execute(
                text("DELETE FROM studies_crop_types WHERE study_id = :study_id"),
                {"study_id": numeric_id},
            )
            db.execute(
                text("DELETE FROM studies_indicators WHERE study_id = :study_id"),
                {"study_id": numeric_id},
            )

            logger.info(f"Cleared existing relationships for study {numeric_id}")

            # Update junction table record and studies table (same as create function)
            if study_data.interventionType and study_data.interventionType.isdigit():
                try:
                    # Update/insert junction table record
                    junction_insert = text(
                        """
                        INSERT INTO studies_intervention_types (study_intervention_type_id, study_id, intervention_type_id, details, is_active, created_at)
                        VALUES (:intervention_type_id, :study_id, :intervention_type_id, :details, 1, NOW())
                        ON DUPLICATE KEY UPDATE
                            intervention_type_id = VALUES(intervention_type_id),
                            details = VALUES(details)
                    """
                    )
                    db.execute(
                        junction_insert,
                        {
                            "intervention_type_id": int(study_data.interventionType),
                            "study_id": numeric_id,
                            "details": study_data.interventionDetails or "",
                        },
                    )

                    # Update the studies table with the intervention type ID
                    update_studies = text(
                        """
                        UPDATE studies 
                        SET study_intervention_types_intervention_type_id = :intervention_type_id
                        WHERE study_id = :study_id
                    """
                    )
                    db.execute(
                        update_studies,
                        {
                            "intervention_type_id": int(study_data.interventionType),
                            "study_id": numeric_id,
                        },
                    )

                    logger.info(
                        f"Updated studies table with intervention type {study_data.interventionType}"
                    )
                except Exception as e:
                    logger.warning(f"Failed to update intervention type: {e}")

            # Re-save Step 2 relationships (same logic as create function)
            logger.info(f"Re-saving relationships for study {numeric_id}")

            # Contributing Initiatives and Centers
            for initiative_id in study_data.contributingInitiatives:
                if initiative_id:
                    db.execute(
                        text(
                            "INSERT IGNORE INTO studies_contributors (study_id, clarisa_initiatives_initiative_id, clarisa_centers_center_id) VALUES (:study_id, :initiative_id, NULL)"
                        ),
                        {"study_id": numeric_id, "initiative_id": int(initiative_id)},
                    )

            for center_id in study_data.contributingCenters:
                if center_id:
                    db.execute(
                        text(
                            "INSERT IGNORE INTO studies_contributors (study_id, clarisa_initiatives_initiative_id, clarisa_centers_center_id) VALUES (:study_id, NULL, :center_id)"
                        ),
                        {"study_id": numeric_id, "center_id": int(center_id)},
                    )

            # Countries
            for country_id in study_data.countries:
                if country_id:
                    db.execute(
                        text(
                            "INSERT INTO studies_countries (study_id, country_id) VALUES (:study_id, :country_id)"
                        ),
                        {"study_id": numeric_id, "country_id": int(country_id)},
                    )

            # Regions (with mapping)
            for region_id in study_data.regions:
                if region_id:
                    db_region_id = int(region_id)
                    try:
                        db.execute(
                            text(
                                "INSERT INTO studies_regions (study_id, region_id) VALUES (:study_id, :region_id)"
                            ),
                            {"study_id": numeric_id, "region_id": db_region_id},
                        )
                    except Exception as e:
                        logger.warning(f"Failed to insert region {db_region_id}: {e}")

            # Impact Areas
            if study_data.primaryCGIARImpactArea:
                db_impact_id = int(study_data.primaryCGIARImpactArea)
                try:
                    db.execute(
                        text(
                            "INSERT INTO studies_impact_areas (studies_study_id, clarisa_impacts_areas_impact_area_id) VALUES (:study_id, :impact_area_id)"
                        ),
                        {"study_id": numeric_id, "impact_area_id": db_impact_id},
                    )
                except Exception as e:
                    logger.warning(
                        f"Failed to insert primary impact area {db_impact_id}: {e}"
                    )

            # Secondary Impact Areas
            for impact_area_id in study_data.secondaryCGIARImpactAreas:
                if impact_area_id:
                    db_impact_id = int(impact_area_id)
                    try:
                        db.execute(
                            text(
                                "INSERT INTO studies_impact_areas (studies_study_id, clarisa_impacts_areas_impact_area_id) VALUES (:study_id, :impact_area_id)"
                            ),
                            {"study_id": numeric_id, "impact_area_id": db_impact_id},
                        )
                    except Exception as e:
                        logger.warning(
                            f"Failed to insert secondary impact area {db_impact_id}: {e}"
                        )

            # Keywords
            for keyword_id in study_data.keywords:
                if keyword_id:
                    try:
                        db.execute(
                            text(
                                "INSERT INTO studies_keywords (study_id, keyword_id) VALUES (:study_id, :keyword_id)"
                            ),
                            {"study_id": numeric_id, "keyword_id": int(keyword_id)},
                        )
                    except Exception as e:
                        logger.warning(f"Failed to insert keyword {keyword_id}: {e}")

            # Crop Types (with mapping)
            for crop_id in study_data.cropProductType:
                if crop_id:
                    db_crop_id = int(crop_id)
                    try:
                        db.execute(
                            text(
                                "INSERT INTO studies_crop_types (study_id, crop_type_id) VALUES (:study_id, :crop_id)"
                            ),
                            {"study_id": numeric_id, "crop_id": db_crop_id},
                        )
                    except Exception as e:
                        logger.warning(f"Failed to insert crop type {db_crop_id}: {e}")

            # Re-save indicators
            for indicator in study_data.indicators:
                indicator_insert = text(
                    """
                    INSERT INTO studies_indicators (
                        study_id, indicator_measure, unit_measure, result_reported, is_active
                    ) VALUES (
                        :study_id, :indicator_measure, :unit_measure, :result_reported, 1
                    )
                """
                )
                db.execute(
                    indicator_insert,
                    {
                        "study_id": numeric_id,
                        "indicator_measure": indicator.get("indicatorMeasure", ""),
                        "unit_measure": indicator.get("unitMeasure", ""),
                        "result_reported": indicator.get("resultReported", ""),
                    },
                )

            db.commit()

            return {
                "success": True,
                "message": f"Study {numeric_id} updated successfully by {user_email}",
                "data": {"study_id": numeric_id},
            }

        except HTTPException:
            raise
        except Exception as e:
            logger.error(f"Database error updating study {numeric_id}: {e}")
            logger.error(f"Error type: {type(e)}")
            logger.error(f"Error details: {str(e)}")
            try:
                db.rollback()
                logger.error(f"Rolled back transaction for study {numeric_id}")
            except Exception as rollback_error:
                logger.error(f"Rollback failed: {rollback_error}")

            raise HTTPException(status_code=500, detail=f"Database error: {str(e)}")


@router.post("/complete", response_model=Dict[str, Any])
async def save_complete_study(
    study_data: StudyCompleteRequest,
    current_user: Dict[str, Any] = Depends(require_researcher),
    db: Optional[Session] = Depends(get_db),
):
    """Save complete study with all steps data and relationships."""

    # Log incoming data for debugging
    logger.info(f"Received save request for study {study_data.studyId}")
    logger.info(f"Study data: {study_data.dict()}")

    # Get current logged-in user email
    user_email = current_user.get("email") or current_user.get("username", "system")

    # Try to save to database first
    if db:
        try:
            # Save main study record (without intervention type column)
            study_insert = text(
                """
                INSERT INTO studies (
                    study_id, title, summary, year, doi, category_id, 
                    period_start, period_end, intervention_details, is_active, created_at, created_by
                ) VALUES (
                    :study_id, :title, :summary, :year, :doi, :category_id, 
                    :period_start, :period_end, :intervention_details, 1, NOW(), :created_by
                )
                ON DUPLICATE KEY UPDATE
                    title = VALUES(title),
                    summary = VALUES(summary),
                    year = VALUES(year),
                    doi = VALUES(doi),
                    category_id = VALUES(category_id),
                    period_start = VALUES(period_start),
                    period_end = VALUES(period_end),
                    intervention_details = VALUES(intervention_details),
                    created_by = VALUES(created_by),
                    last_updated_date = NOW()
            """
            )

            # Use the category ID directly from frontend (already database IDs)
            db_category_id = int(study_data.category) if study_data.category else 156

            db.execute(
                study_insert,
                {
                    "study_id": study_data.studyId,
                    "title": study_data.title,
                    "summary": study_data.summary,
                    "year": study_data.year,
                    "doi": study_data.doi,
                    "category_id": db_category_id,
                    "period_start": f"{study_data.periodStart}-01-01"
                    if study_data.periodStart
                    else None,
                    "period_end": f"{study_data.periodEnd}-12-31"
                    if study_data.periodEnd
                    else None,
                    "intervention_details": study_data.interventionDetails,
                    "created_by": user_email,
                },
            )

            # Log the study insert

            # Clear existing relationships for this study
            db.execute(
                text(
                    "DELETE FROM studies_intervention_types WHERE study_id = :study_id"
                ),
                {"study_id": study_data.studyId},
            )
            db.execute(
                text("DELETE FROM studies_contributors WHERE study_id = :study_id"),
                {"study_id": study_data.studyId},
            )
            db.execute(
                text("DELETE FROM studies_countries WHERE study_id = :study_id"),
                {"study_id": study_data.studyId},
            )
            db.execute(
                text("DELETE FROM studies_regions WHERE study_id = :study_id"),
                {"study_id": study_data.studyId},
            )
            db.execute(
                text(
                    "DELETE FROM studies_impact_areas WHERE studies_study_id = :study_id"
                ),
                {"study_id": study_data.studyId},
            )
            db.execute(
                text("DELETE FROM studies_keywords WHERE study_id = :study_id"),
                {"study_id": study_data.studyId},
            )
            db.execute(
                text("DELETE FROM studies_crop_types WHERE study_id = :study_id"),
                {"study_id": study_data.studyId},
            )
            db.execute(
                text("DELETE FROM studies_indicators WHERE study_id = :study_id"),
                {"study_id": study_data.studyId},
            )

            logger.info(
                f"Cleared existing relationships for study {study_data.studyId}"
            )

            # Create junction table record to satisfy FK constraint, then update studies table
            if study_data.interventionType and study_data.interventionType.isdigit():
                try:
                    # Insert into junction table
                    junction_insert = text(
                        """
                        INSERT INTO studies_intervention_types (study_id, intervention_type_id, is_active, created_at)
                        VALUES (:study_id, :intervention_type_id, 1, NOW())
                        ON DUPLICATE KEY UPDATE
                            intervention_type_id = VALUES(intervention_type_id)
                    """
                    )
                    db.execute(
                        junction_insert,
                        {
                            "study_id": study_data.studyId,
                            "intervention_type_id": int(study_data.interventionType),
                        },
                    )

                    logger.info(
                        f"Inserted intervention type {study_data.interventionType} into junction table"
                    )
                except Exception as e:
                    logger.warning(f"Failed to insert intervention type: {e}")

            # Save Step 2 relationships
            logger.info(f"Saving relationships for study {study_data.studyId}")

            # Contributing Initiatives and Centers (use INSERT IGNORE to avoid duplicates)
            for initiative_id in study_data.contributingInitiatives:
                if initiative_id:
                    db.execute(
                        text(
                            "INSERT IGNORE INTO studies_contributors (study_id, clarisa_initiatives_initiative_id, clarisa_centers_center_id) VALUES (:study_id, :initiative_id, NULL)"
                        ),
                        {
                            "study_id": study_data.studyId,
                            "initiative_id": int(initiative_id),
                        },
                    )

            for center_id in study_data.contributingCenters:
                if center_id:
                    db.execute(
                        text(
                            "INSERT IGNORE INTO studies_contributors (study_id, clarisa_initiatives_initiative_id, clarisa_centers_center_id) VALUES (:study_id, NULL, :center_id)"
                        ),
                        {"study_id": study_data.studyId, "center_id": int(center_id)},
                    )

            # Countries (ID 1 is valid)
            for country_id in study_data.countries:
                if country_id:
                    db.execute(
                        text(
                            "INSERT INTO studies_countries (study_id, country_id) VALUES (:study_id, :country_id)"
                        ),
                        {"study_id": study_data.studyId, "country_id": int(country_id)},
                    )

            # Regions (map invalid IDs to valid ones)
            for region_id in study_data.regions:
                if region_id:
                    db_region_id = int(region_id)
                    try:
                        db.execute(
                            text(
                                "INSERT INTO studies_regions (study_id, region_id) VALUES (:study_id, :region_id)"
                            ),
                            {"study_id": study_data.studyId, "region_id": db_region_id},
                        )
                    except Exception as e:
                        logger.warning(f"Failed to insert region {db_region_id}: {e}")

            # Impact Areas
            if study_data.primaryCGIARImpactArea:
                db_impact_id = int(study_data.primaryCGIARImpactArea)
                try:
                    db.execute(
                        text(
                            "INSERT INTO studies_impact_areas (studies_study_id, clarisa_impacts_areas_impact_area_id) VALUES (:study_id, :impact_area_id)"
                        ),
                        {
                            "study_id": study_data.studyId,
                            "impact_area_id": db_impact_id,
                        },
                    )
                except Exception as e:
                    logger.warning(
                        f"Failed to insert primary impact area {db_impact_id}: {e}"
                    )

            # Impact Areas (Secondary)
            for impact_area_id in study_data.secondaryCGIARImpactAreas:
                if impact_area_id:
                    db_impact_id = int(impact_area_id)
                    try:
                        db.execute(
                            text(
                                "INSERT INTO studies_impact_areas (studies_study_id, clarisa_impacts_areas_impact_area_id) VALUES (:study_id, :impact_area_id)"
                            ),
                            {
                                "study_id": study_data.studyId,
                                "impact_area_id": db_impact_id,
                            },
                        )
                    except Exception as e:
                        logger.warning(
                            f"Failed to insert secondary impact area {db_impact_id}: {e}"
                        )

            # Keywords (ID 1 is valid)
            for keyword_id in study_data.keywords:
                if keyword_id:
                    try:
                        db.execute(
                            text(
                                "INSERT INTO studies_keywords (study_id, keyword_id) VALUES (:study_id, :keyword_id)"
                            ),
                            {
                                "study_id": study_data.studyId,
                                "keyword_id": int(keyword_id),
                            },
                        )
                    except Exception as e:
                        logger.warning(f"Failed to insert keyword {keyword_id}: {e}")

            # Crop Types (map invalid IDs to valid ones)
            for crop_id in study_data.cropProductType:
                if crop_id:
                    db_crop_id = int(crop_id)
                    try:
                        db.execute(
                            text(
                                "INSERT INTO studies_crop_types (study_id, crop_type_id) VALUES (:study_id, :crop_id)"
                            ),
                            {"study_id": study_data.studyId, "crop_id": db_crop_id},
                        )
                    except Exception as e:
                        logger.warning(f"Failed to insert crop type {db_crop_id}: {e}")

            # Save indicators
            for indicator in study_data.indicators:
                indicator_insert = text(
                    """
                    INSERT INTO studies_indicators (
                        study_id, indicator_measure, unit_measure, result_reported, is_active
                    ) VALUES (
                        :study_id, :indicator_measure, :unit_measure, :result_reported, 1
                    )
                """
                )
                db.execute(
                    indicator_insert,
                    {
                        "study_id": study_data.studyId,
                        "indicator_measure": indicator.get("indicatorMeasure", ""),
                        "unit_measure": indicator.get("unitMeasure", ""),
                        "result_reported": indicator.get("resultReported", ""),
                    },
                )

            db.commit()

            return {
                "success": True,
                "message": f"Study {study_data.studyId} saved successfully to database (user: {user_email})",
                "data": {"study_id": study_data.studyId},
            }

        except Exception as e:
            logger.error(f"Database error saving study {study_data.studyId}: {e}")
            logger.error(f"Error type: {type(e)}")
            logger.error(f"Error details: {str(e)}")
            try:
                db.rollback()
                logger.error(f"Rolled back transaction for study {study_data.studyId}")
            except Exception as rollback_error:
                logger.error(f"Rollback failed: {rollback_error}")

            # Return error instead of falling back to mock
            raise HTTPException(status_code=500, detail=f"Database error: {str(e)}")


@router.delete("/{study_id}", response_model=Dict[str, Any])
async def delete_study(
    study_id: int,
    current_user: Dict[str, Any] = Depends(require_researcher),
    db: Optional[Session] = Depends(get_db),
):
    """Delete a study and all its related data."""

    # Get current logged-in user email
    user_email = current_user.get("email", "system")

    if not db:
        raise HTTPException(status_code=500, detail="Database connection not available")

    try:
        logger.info(f"Deleting study {study_id} by user {user_email}")

        # Delete relationships first - handle RDS foreign key constraints properly
        try:
            # Delete from all relationship tables
            relationship_tables = [
                ("studies_intervention_types", "study_id"),
                ("studies_contributors", "study_id"),
                ("studies_countries", "study_id"),
                ("studies_regions", "study_id"),
                ("studies_impact_areas", "studies_study_id"),
                ("studies_keywords", "study_id"),
                ("studies_crop_types", "study_id"),
                ("studies_indicators", "study_id"),
            ]

            for table_name, column_name in relationship_tables:
                try:
                    result = db.execute(
                        text(
                            f"DELETE FROM {table_name} WHERE {column_name} = :study_id"
                        ),
                        {"study_id": study_id},
                    )
                    if result.rowcount > 0:
                        logger.info(
                            f"Deleted {result.rowcount} records from {table_name}"
                        )
                except Exception as e:
                    logger.warning(f"Could not delete from {table_name}: {e}")

        except Exception as e:
            logger.warning(f"Error during relationship cleanup: {e}")
            # Continue with study deletion

        # Delete main study record
        result = db.execute(
            text("DELETE FROM studies WHERE study_id = :study_id"),
            {"study_id": study_id},
        )

        if result.rowcount == 0:
            raise HTTPException(status_code=404, detail=f"Study {study_id} not found")

        db.commit()
        logger.info(f"Successfully deleted study {study_id}")

        return {
            "success": True,
            "message": f"Study {study_id} deleted successfully by {user_email}",
            "data": {"study_id": study_id},
        }

    except HTTPException:
        db.rollback()
        raise
    except Exception as e:
        db.rollback()
        logger.error(f"Error deleting study {study_id}: {e}")
        raise HTTPException(status_code=500, detail=f"Failed to delete study: {str(e)}")
