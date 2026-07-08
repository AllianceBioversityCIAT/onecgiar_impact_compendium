"""
Indicator Pydantic schemas
"""

from datetime import datetime
from typing import List, Optional

from pydantic import BaseModel, Field


class IndicatorBase(BaseModel):
    """Base indicator schema"""

    name: str = Field(..., min_length=1, max_length=255)
    description: Optional[str] = None
    indicator_type: Optional[str] = Field(None, max_length=100)
    unit: Optional[str] = Field(None, max_length=100)
    category: Optional[str] = Field(None, max_length=100)


class IndicatorCreate(IndicatorBase):
    """Schema for creating an indicator"""

    pass


class Indicator(IndicatorBase):
    """Indicator response schema"""

    id: int
    active: bool
    created_at: datetime
    updated_at: datetime

    class Config:
        from_attributes = True


class IndicatorSearchParams(BaseModel):
    """Schema for indicator search parameters"""

    q: Optional[str] = Field(None, description="Search query")
    indicator_type: Optional[str] = Field(None, description="Filter by type")
    category: Optional[str] = Field(None, description="Filter by category")
    active: bool = Field(True, description="Filter by active status")
    page: int = Field(1, ge=1, description="Page number")
    size: int = Field(20, ge=1, le=100, description="Page size")


class IndicatorSearchResponse(BaseModel):
    """Schema for indicator search response"""

    indicators: List[Indicator]
    total: int
    page: int
    size: int
    pages: int
