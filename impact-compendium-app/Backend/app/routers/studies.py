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
    skip: int = Query(0, ge=0, description="Number of records to skip"),
    limit: int = Query(10, ge=1, le=100, description="Number of records to return"),
    page: int = Query(1, ge=1, description="Page number (1-based)"),
    pageSize: int = Query(10, ge=1, le=100, description="Number of records per page"),
    sort: str = Query("", description="Sort format: field:dir (e.g., year:desc)"),
    db: Optional[Session] = Depends(get_db)
):
    """
    List studies with pagination - returns simplified data structure
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
        query = text(f"""
            SELECT study_id, title, year, summary, is_active, created_at, category_id
            FROM studies 
            WHERE is_active = 1
            {order_clause}
            LIMIT :limit OFFSET :skip
        """)
        
        result = session.execute(query, {"limit": actual_limit, "skip": actual_skip})
        studies = result.fetchall()
        
        # Get total count
        count_query = text("SELECT COUNT(*) FROM studies WHERE is_active = 1")
        total_result = session.execute(count_query)
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
            **db_result,
            "pagination": {
                "total": db_result["total"],
                "count": len(db_result["data"]),
                "page": page,
                "pageSize": pageSize,
                "totalPages": (db_result["total"] + pageSize - 1) // pageSize
            }
        }
    
    # Fallback to mock data with proper pagination
    start_idx = actual_skip
    end_idx = start_idx + actual_limit
    mock_slice = MOCK_STUDIES[start_idx:end_idx]
    
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
            "category_id": study[11]
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
