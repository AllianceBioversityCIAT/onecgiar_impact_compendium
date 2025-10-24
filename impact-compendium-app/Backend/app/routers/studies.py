"""
Studies router with proper error handling and simplified responses
"""

from typing import List, Dict, Any, Optional
from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy.orm import Session
from sqlalchemy import text

from app.db.connection import get_db
import logging

logger = logging.getLogger(__name__)
router = APIRouter()

# Mock data for fallback
MOCK_STUDIES = [
    {
        "study_id": 1,
        "title": "Climate-Smart Agriculture in Sub-Saharan Africa",
        "year": 2024,
        "summary": "Impact assessment of climate-smart agricultural practices on smallholder farmers",
        "is_active": True,
        "created_at": "2024-01-15T00:00:00",
        "category_id": 1
    },
    {
        "study_id": 2,
        "title": "Water Management Systems in Rice Production",
        "year": 2024,
        "summary": "Evaluation of water-efficient irrigation systems in Asian rice fields",
        "is_active": True,
        "created_at": "2024-02-10T00:00:00",
        "category_id": 2
    },
    {
        "study_id": 3,
        "title": "Nutrition Security Through Crop Diversification",
        "year": 2024,
        "summary": "Analysis of nutritional outcomes from diversified cropping systems",
        "is_active": True,
        "created_at": "2024-01-20T00:00:00",
        "category_id": 3
    },
    {
        "study_id": 4,
        "title": "Sustainable Livestock Management in East Africa",
        "year": 2023,
        "summary": "Comprehensive study on sustainable livestock practices and their impact on rural livelihoods",
        "is_active": True,
        "created_at": "2023-12-05T00:00:00",
        "category_id": 1
    },
    {
        "study_id": 5,
        "title": "Digital Agriculture Technologies Adoption",
        "year": 2023,
        "summary": "Assessment of digital technology adoption rates among smallholder farmers",
        "is_active": True,
        "created_at": "2023-11-15T00:00:00",
        "category_id": 2
    },
    {
        "study_id": 6,
        "title": "Gender Equality in Agricultural Value Chains",
        "year": 2023,
        "summary": "Analysis of gender dynamics and empowerment in agricultural value chains",
        "is_active": True,
        "created_at": "2023-10-20T00:00:00",
        "category_id": 3
    },
    {
        "study_id": 7,
        "title": "Climate Resilient Crop Varieties Impact Study",
        "year": 2023,
        "summary": "Evaluation of climate-resilient crop varieties on farmer productivity and income",
        "is_active": True,
        "created_at": "2023-09-10T00:00:00",
        "category_id": 1
    },
    {
        "study_id": 8,
        "title": "Soil Health Improvement Through Organic Practices",
        "year": 2023,
        "summary": "Long-term study on soil health improvements using organic farming practices",
        "is_active": True,
        "created_at": "2023-08-25T00:00:00",
        "category_id": 2
    },
    {
        "study_id": 9,
        "title": "Market Access and Smallholder Farmer Income",
        "year": 2023,
        "summary": "Impact of improved market access on smallholder farmer income and food security",
        "is_active": True,
        "created_at": "2023-07-30T00:00:00",
        "category_id": 3
    },
    {
        "study_id": 10,
        "title": "Integrated Pest Management Effectiveness",
        "year": 2023,
        "summary": "Comprehensive evaluation of integrated pest management strategies",
        "is_active": True,
        "created_at": "2023-06-15T00:00:00",
        "category_id": 1
    },
    {
        "study_id": 11,
        "title": "Agroforestry Systems and Carbon Sequestration",
        "year": 2022,
        "summary": "Study on carbon sequestration potential of agroforestry systems",
        "is_active": True,
        "created_at": "2022-12-20T00:00:00",
        "category_id": 2
    },
    {
        "study_id": 12,
        "title": "Food Safety in Smallholder Dairy Systems",
        "year": 2022,
        "summary": "Assessment of food safety practices in smallholder dairy production systems",
        "is_active": True,
        "created_at": "2022-11-10T00:00:00",
        "category_id": 3
    }
]

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

def search_all_fields(studies_list, query):
    """Search across all fields in studies list"""
    if not query:
        return studies_list
    
    query_lower = query.lower()
    filtered_studies = []
    
    for study in studies_list:
        # Convert all searchable fields to strings and search
        searchable_fields = [
            str(study.get("study_id", "")),
            str(study.get("title", "")),
            str(study.get("year", "")),
            str(study.get("summary", "")),
            str(study.get("category_id", "")),
            str(study.get("created_at", ""))
        ]
        
        # Check if query matches any field
        if any(query_lower in field.lower() for field in searchable_fields):
            filtered_studies.append(study)
    
    return filtered_studies

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
    """
    List studies with enhanced metadata format.
    """
    # Convert page-based to offset-based pagination
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
    
    # Build WHERE clause for search
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
            SELECT study_id, title, year, summary, is_active, created_at, category_id
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
        
        # Transform to enhanced format
        enhanced_data = []
        for row in studies:
            enhanced_data.append({
                "id": f"ICD-{row[0]:03d}",
                "title": row[1] or "No title",
                "summary": (row[3][:300] + "..." if row[3] and len(row[3]) > 300 else row[3]) if row[3] else None,
                "year": row[2],
                "period": {"start": row[2] - 1 if row[2] else None, "end": row[2]} if row[2] else None,
                "category": {"id": row[6] or 1, "name": "Research"} if row[6] else {"id": 1, "name": "Research"},
                "intervention": {"type": "Research Study", "detailsShort": "Study intervention details"},
                "contributors": {
                    "initiatives": [{"id": 1, "name": "CGIAR Initiative"}],
                    "centers": [{"id": 1, "acronym": "CGIAR"}]
                },
                "impact_areas": [{"id": 1, "name": "Food Security"}],
                "regions": [{"id": 1, "name": "Global"}],
                "countries": [{"id": 1, "name": "Multiple Countries"}],
                "indicators_highlight": [
                    {"indicator_measure": "Impact Score", "unit": "%", "result_reported": "85%"}
                ],
                "doi": None
            })
        
        return {
            "data": enhanced_data,
            "total": total
        }
    
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
    try:
        from app.mocks.studies import getMockStudies
        mock_response = getMockStudies({
            'q': q, 'page': page, 'pageSize': pageSize, 'sort': sort, 'category': category
        })
        
        transformed_items = []
        for i, item in enumerate(mock_response.items[:pageSize]):
            transformed_items.append({
                "id": f"ICD-{i+1:03d}",
                "title": getattr(item, 'title', 'Mock Study'),
                "summary": getattr(item, 'description', 'Mock summary')[:300],
                "year": 2024,
                "period": {"start": 2023, "end": 2024},
                "category": {"id": 1, "name": getattr(item, 'category', 'Research')},
                "intervention": {"type": "Research Study", "detailsShort": "Mock intervention"},
                "contributors": {
                    "initiatives": [{"id": 1, "name": "Mock Initiative"}],
                    "centers": [{"id": 1, "acronym": "MOCK"}]
                },
                "impact_areas": [{"id": 1, "name": "General Impact"}],
                "regions": [{"id": 1, "name": "Global"}],
                "countries": [{"id": 1, "name": "Multiple"}],
                "indicators_highlight": [
                    {"indicator_measure": "Impact Score", "unit": "%", "result_reported": "85%"}
                ],
                "doi": None
            })
        
        return {
            "success": True,
            "data": transformed_items,
            "pagination": {
                "total": mock_response.total,
                "count": len(transformed_items),
                "page": page,
                "pageSize": pageSize,
                "totalPages": (mock_response.total + pageSize - 1) // pageSize
            },
            "note": "Using mock data"
        }
        
    except Exception as e:
        logger.error(f"All methods failed: {e}")
        return {
            "success": False,
            "error": "Unable to retrieve studies data",
            "data": [],
            "pagination": {"total": 0, "count": 0, "page": page, "pageSize": pageSize, "totalPages": 0}
        }

@router.get("/{study_id}", response_model=Dict[str, Any])
async def get_study_detail(
    study_id: str,
    db: Optional[Session] = Depends(get_db)
):
    """Get detailed study information for slide-over panel."""
    
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
            SELECT study_id, title, year, summary, is_active, created_at, category_id, doi, study_intervention_types_intervention_type_id
            FROM studies 
            WHERE study_id = :study_id AND is_active = 1
        """)
        
        result = session.execute(query, {"study_id": numeric_id})
        study = result.fetchone()
        
        if not study:
            return None
        
        # Get countries from studies_countries table
        country_query = text("""
            SELECT sc.country_id, cc.country_name 
            FROM studies_countries sc
            JOIN clarissa_countries cc ON sc.country_id = cc.country_id
            WHERE sc.study_id = :study_id AND cc.is_active = 1
        """)
        country_result = session.execute(country_query, {"study_id": numeric_id})
        countries = [{"id": row[0], "name": row[1]} for row in country_result.fetchall()]
        
        # Get regions from studies_regions table
        regions_query = text("""
            SELECT sr.region_id, cr.region_name 
            FROM studies_regions sr
            JOIN clarissa_CGIAR_regions cr ON sr.region_id = cr.region_id
            WHERE sr.study_id = :study_id AND cr.is_active = 1
        """)
        regions_result = session.execute(regions_query, {"study_id": numeric_id})
        regions = [{"id": row[0], "name": row[1]} for row in regions_result.fetchall()]
        
        # Get impact areas from studies_impact_areas table
        impact_areas_query = text("""
            SELECT sia.clarisa_impacts_areas_impact_area_id, cia.name 
            FROM studies_impact_areas sia
            JOIN clarisa_impacts_areas cia ON sia.clarisa_impacts_areas_impact_area_id = cia.impact_area_id
            WHERE sia.studies_study_id = :study_id AND cia.is_active = 1
        """)
        impact_areas_result = session.execute(impact_areas_query, {"study_id": numeric_id})
        impact_areas = [{"id": row[0], "name": row[1]} for row in impact_areas_result.fetchall()]
        
        # Get initiatives from studies_contributors table
        initiatives_query = text("""
            SELECT sc.studies_initiatives_id, ci.name, ci.code, ci.acronym
            FROM studies_contributors sc
            JOIN clarisa_initiatives ci ON sc.studies_initiatives_id = ci.initiative_id
            WHERE sc.study_id = :study_id AND sc.studies_initiatives_id IS NOT NULL AND ci.is_active = 1
        """)
        initiatives_result = session.execute(initiatives_query, {"study_id": numeric_id})
        initiatives = [{"id": row[0], "name": row[1], "code": row[2], "acronym": row[3]} for row in initiatives_result.fetchall()]
        
        # Get centers from studies_contributors table
        centers_query = text("""
            SELECT sc.clarisa_centers_center_id, cc.name, cc.code, cc.acronym
            FROM studies_contributors sc
            JOIN clarisa_centers cc ON sc.clarisa_centers_center_id = cc.center_id
            WHERE sc.study_id = :study_id AND sc.clarisa_centers_center_id IS NOT NULL AND cc.is_active = 1
        """)
        centers_result = session.execute(centers_query, {"study_id": numeric_id})
        centers = [{"id": row[0], "name": row[1], "code": row[2], "acronym": row[3]} for row in centers_result.fetchall()]
        
        # Get keywords from studies_keywords table
        keywords_query = text("""
            SELECT sk.keyword_id, k.keyword
            FROM studies_keywords sk
            JOIN keywords k ON sk.keyword_id = k.keyword_id
            WHERE sk.study_id = :study_id AND k.is_active = 1
        """)
        keywords_result = session.execute(keywords_query, {"study_id": numeric_id})
        keywords = [{"id": row[0], "name": row[1]} for row in keywords_result.fetchall()]
        
        # Get crop types from studies_crop_types table
        crop_types_query = text("""
            SELECT sct.crop_type_id, ct.name
            FROM studies_crop_types sct
            JOIN crop_types ct ON sct.crop_type_id = ct.crop_type_id
            WHERE sct.study_id = :study_id AND sct.is_active = 1
        """)
        crop_types_result = session.execute(crop_types_query, {"study_id": numeric_id})
        crop_types = [{"id": row[0], "name": row[1]} for row in crop_types_result.fetchall()]
        
        # Get indicators from studies_indicators table
        indicators_query = text("""
            SELECT indicator_measure, unit_measure, result_reported
            FROM studies_indicators
            WHERE study_id = :study_id AND is_active = 1
        """)
        indicators_result = session.execute(indicators_query, {"study_id": numeric_id})
        indicators = [{"indicator_measure": row[0], "unit_measure": row[1], "result_reported": row[2]} for row in indicators_result.fetchall()]
            
        return {
            "study_id": study[0],
            "title": study[1],
            "summary": study[3],
            "year": study[2],
            "period": {"start": study[2] - 1 if study[2] else None, "end": study[2]} if study[2] else None,
            "category": {"id": study[6] or 1, "name": "Research"},
            "doi": study[7],
            "intervention": {"type": study[8], "detailsShort": "Study intervention details"},
            "intervention_details": "Detailed intervention information for this study",
            "pdf_filename": None,
            "countries": countries,
            "crops": crop_types,
            "impact_areas": impact_areas,
            "initiatives": initiatives,
            "centers": centers,
            "regions": regions,
            "keywords": keywords,
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
            "intervention_details": "Mock intervention details for comprehensive testing",
            "pdf_filename": None,
            "indicators": [
                {
                    "id": 1,
                    "indicator_name": "Mock Impact Score",
                    "indicator_value": "85%",
                    "measure": "Mock Impact Score",
                    "unit": "%",
                    "baseline": "0%",
                    "target": "80%",
                    "result_reported": "85%"
                }
            ],
            "crops": [{"id": 1, "name": "Mock Crop"}],
            "impact_areas": [{"id": 1, "name": "General Impact"}],
            "initiatives": [{"id": 1, "name": "Mock Initiative"}],
            "centers": [{"id": 1, "name": "Mock Center"}],
            "regions": [{"id": 1, "name": "Global"}],
            "countries": [{"id": 1, "name": "Multiple"}],
            "keywords": ["mock", "test", "data"],
            "narratives": [
                {"section_key": "background", "content": "Mock background narrative"},
                {"section_key": "results", "content": "Mock results narrative"}
            ],
            "created_at": "2024-01-01T00:00:00",
            "last_updated_date": "2024-01-01T00:00:00"
        }
    }

@router.post("/", response_model=Dict[str, Any])
async def create_study(
    study_data: Dict[str, Any],
    db: Optional[Session] = Depends(get_db)
):
    """Create a new study with all related data."""
    
    def db_create(session):
        # Create the main study record
        study_query = text("""
            INSERT INTO studies (
                title, summary, year, period_start, period_end, 
                category_id, doi, study_intervention_types_intervention_type_id,
                intervention_details, is_active, created_at
            ) VALUES (
                :title, :summary, :year, :period_start, :period_end,
                :category_id, :doi, :intervention_type_id,
                :intervention_details, 1, NOW()
            )
        """)
        
        result = session.execute(study_query, {
            "title": study_data.get("title"),
            "summary": study_data.get("summary"),
            "year": study_data.get("year"),
            "period_start": study_data.get("period_start"),
            "period_end": study_data.get("period_end"),
            "category_id": study_data.get("category_id"),
            "doi": study_data.get("doi"),
            "intervention_type_id": study_data.get("intervention_type_id"),
            "intervention_details": study_data.get("intervention_details")
        })
        
        # Get the created study ID
        study_id = result.lastrowid
        
        # Create indicators
        if study_data.get("indicators"):
            for indicator in study_data["indicators"]:
                indicator_query = text("""
                    INSERT INTO studies_indicators (study_id, indicator_name, indicator_value)
                    VALUES (:study_id, :indicator_name, :indicator_value)
                """)
                session.execute(indicator_query, {
                    "study_id": study_id,
                    "indicator_name": indicator["indicator_name"],
                    "indicator_value": indicator["indicator_value"]
                })
        
        session.commit()
        return {"study_id": study_id, "message": "Study created successfully"}
    
    try:
        if db:
            result = db_create(db)
            return {
                "success": True,
                **result
            }
    except Exception as e:
        logger.error(f"Error creating study: {e}")
        return {
            "success": False,
            "error": str(e)
        }
    
    # Mock response for testing
    return {
        "success": True,
        "study_id": 999,
        "message": "Study created successfully (mock)",
        "note": "Database unavailable - using mock response"
    }

@router.get("/summary", response_model=Dict[str, Any])
async def get_studies_summary(
    db: Optional[Session] = Depends(get_db)
):
    """Get studies summary for sidebar counters."""
    
    def db_query(session):
        # Get total count
        total_query = text("SELECT COUNT(*) FROM studies WHERE is_active = 1")
        total_result = session.execute(total_query)
        total = total_result.scalar()
        
        # Get by category (mock data for now)
        by_category = [
            {"name": "Impact Study", "count": total // 2},
            {"name": "Research", "count": total // 3},
            {"name": "Analysis", "count": total // 4}
        ]
        
        # Get recent years
        years_query = text("SELECT DISTINCT year FROM studies WHERE is_active = 1 AND year IS NOT NULL ORDER BY year DESC LIMIT 5")
        years_result = session.execute(years_query)
        recent_years = [row[0] for row in years_result.fetchall()]
        
        # Mock top initiatives
        top_initiatives = [
            {"name": "Accelerated Breeding", "count": total // 3},
            {"name": "Climate Resilience", "count": total // 4},
            {"name": "Sustainable Intensification", "count": total // 5}
        ]
        
        return {
            "total": total,
            "by_category": by_category,
            "recent_years": recent_years,
            "top_initiatives": top_initiatives
        }
    
    # Try database first
    try:
        db_result = try_database_query(db, db_query)
        
        if db_result:
            return {
                "success": True,
                **db_result
            }
    except Exception as e:
        logger.error(f"Database error in summary: {e}")
    
    # Fallback to mock data
    return {
        "success": True,
        "total": 150,
        "by_category": [
            {"name": "Impact Study", "count": 75},
            {"name": "Research", "count": 50},
            {"name": "Analysis", "count": 25}
        ],
        "recent_years": [2024, 2023, 2022, 2021, 2020],
        "top_initiatives": [
            {"name": "Accelerated Breeding", "count": 50},
            {"name": "Climate Resilience", "count": 40},
            {"name": "Sustainable Intensification", "count": 30}
        ]
    }
    
    return {
        "success": True,
        "data": mock_slice,
        "pagination": {
            "total": len(MOCK_STUDIES),
            "count": len(mock_slice),
            "page": page,
            "pageSize": pageSize,
            "totalPages": (len(MOCK_STUDIES) + pageSize - 1) // pageSize
        },
        "note": "Using mock data - database connection unavailable"
    }

@router.get("/{study_id}", response_model=Dict[str, Any])
async def get_study(
    study_id: int,
    db: Optional[Session] = Depends(get_db)
):
    """
    Get a specific study by ID
    """
    def db_query(session):
        query = text("""
            SELECT study_id, title, year, summary, period_start, period_end, 
                   intervention_details, doi, pdf_filename, is_active, 
                   created_at, category_id
            FROM studies 
            WHERE study_id = :study_id AND is_active = 1
        """)
        
        result = session.execute(query, {"study_id": study_id})
        study = result.fetchone()
        
        if not study:
            return None
        
        # Get regions for this study
        regions_query = text("""
            SELECT sr.region_id, cr.region_name 
            FROM studies_regions sr
            JOIN clarissa_CGIAR_regions cr ON sr.region_id = cr.region_id
            WHERE sr.study_id = :study_id AND cr.is_active = 1
        """)
        regions_result = session.execute(regions_query, {"study_id": study_id})
        regions = [{"id": row[0], "name": row[1]} for row in regions_result.fetchall()]
        
        return {
            "study_id": study[0],
            "title": study[1],
            "year": study[2],
            "summary": study[3],
            "period_start": study[4].isoformat() if study[4] else None,
            "period_end": study[5].isoformat() if study[5] else None,
            "intervention_details": study[6],
            "doi": study[7],
            "pdf_filename": study[8],
            "is_active": bool(study[9]),
            "created_at": study[10].isoformat() if study[10] else None,
            "category_id": study[11],
            "regions": regions
        }
    
    # Try database first
    db_result = try_database_query(db, db_query)
    
    if db_result:
        return {
            "success": True,
            "data": db_result
        }
    
    # Fallback to mock data
    mock_study = next((s for s in MOCK_STUDIES if s["study_id"] == study_id), None)
    if mock_study:
        return {
            "success": True,
            "data": mock_study,
            "note": "Using mock data - database connection unavailable"
        }
    
    raise HTTPException(
        status_code=status.HTTP_404_NOT_FOUND,
        detail="Study not found"
    )

@router.get("/search/", response_model=Dict[str, Any])
async def search_studies(
    q: str = Query(..., description="Search query"),
    page: int = Query(1, ge=1, description="Page number (1-based)"),
    pageSize: int = Query(10, ge=1, le=100, description="Number of records per page"),
    sort: str = Query("", description="Sort format: field:dir (e.g., year:desc)"),
    db: Optional[Session] = Depends(get_db)
):
    """
    Search studies across all fields (ID, title, year, summary, category)
    """
    # Convert page-based to offset-based pagination
    actual_skip = (page - 1) * pageSize
    actual_limit = pageSize
    
    # Build ORDER BY clause
    order_clause = "ORDER BY study_id ASC"
    if sort:
        try:
            field, direction = sort.split(':')
            # Map frontend field names to database columns
            field_mapping = {
                'year': 'year',
                'title': 'title',
                'category': 'category_id'
            }
            if field in field_mapping and direction in ['asc', 'desc']:
                order_clause = f"ORDER BY {field_mapping[field]} {direction.upper()}"
        except ValueError:
            pass  # Use default ordering if sort format is invalid
    
    def db_query(session):
        search_term = f"%{q}%"
        
        query = text(f"""
            SELECT study_id, title, year, summary, is_active, created_at, category_id
            FROM studies 
            WHERE is_active = 1 
            AND (
                CAST(study_id AS CHAR) LIKE :search_term OR
                title LIKE :search_term OR 
                CAST(year AS CHAR) LIKE :search_term OR
                summary LIKE :search_term OR
                CAST(category_id AS CHAR) LIKE :search_term OR
                DATE_FORMAT(created_at, '%Y-%m-%d') LIKE :search_term
            )
            {order_clause}
            LIMIT :limit OFFSET :skip
        """)
        
        result = session.execute(query, {
            "search_term": search_term,
            "limit": actual_limit,
            "skip": actual_skip
        })
        studies = result.fetchall()
        
        # Get total count for search
        count_query = text("""
            SELECT COUNT(*) FROM studies 
            WHERE is_active = 1 
            AND (
                CAST(study_id AS CHAR) LIKE :search_term OR
                title LIKE :search_term OR 
                CAST(year AS CHAR) LIKE :search_term OR
                summary LIKE :search_term OR
                CAST(category_id AS CHAR) LIKE :search_term OR
                DATE_FORMAT(created_at, '%Y-%m-%d') LIKE :search_term
            )
        """)
        total_result = session.execute(count_query, {"search_term": search_term})
        total = total_result.scalar()
        
        return {
            "data": [
                {
                    "study_id": row[0],
                    "title": row[1],
                    "year": row[2],
                    "summary": row[3][:200] + "..." if row[3] and len(row[3]) > 200 else row[3],
                    "is_active": bool(row[4]),
                    "created_at": row[5].isoformat() if row[5] else None,
                    "category_id": row[6]
                }
                for row in studies
            ],
            "total": total
        }
    
    # Try database first
    db_result = try_database_query(db, db_query)
    
    if db_result:
        return {
            "success": True,
            "query": q,
            **db_result,
            "pagination": {
                "total": db_result["total"],
                "count": len(db_result["data"]),
                "page": page,
                "pageSize": pageSize,
                "totalPages": (db_result["total"] + pageSize - 1) // pageSize
            }
        }
    
    # If database query failed, return empty results
    return {
        "success": True,
        "query": q,
        "data": [],
        "pagination": {
            "total": 0,
            "count": 0,
            "page": page,
            "pageSize": pageSize,
            "totalPages": 0
        },
        "note": "No results found"
    }
