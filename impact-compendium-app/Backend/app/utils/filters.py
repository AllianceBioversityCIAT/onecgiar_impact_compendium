from sqlalchemy.orm import Query
from sqlalchemy import or_
from app.models.studies import Study

def apply_search_q(query: Query, search_term: str) -> Query:
    """Apply search filter to Study query"""
    if not search_term:
        return query
    
    search_pattern = f"%{search_term}%"
    return query.filter(
        or_(
            Study.title.ilike(search_pattern),
            Study.summary.ilike(search_pattern),
            Study.study_id.like(search_pattern),
            Study.year.like(search_pattern)
        )
    )
