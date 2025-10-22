from sqlalchemy.orm import Query
from typing import Tuple

def apply_limit_offset(query: Query, page: int, page_size: int) -> Query:
    """Apply pagination to SQLAlchemy query"""
    offset = (page - 1) * page_size
    return query.offset(offset).limit(page_size)

def parse_query_params(page: int = 1, pageSize: int = 10) -> Tuple[int, int]:
    """Parse and validate pagination parameters"""
    page = max(1, page)
    pageSize = max(1, min(100, pageSize))  # Limit max page size
    return page, pageSize
