"""
Study Pydantic schemas for request/response validation
"""

from datetime import datetime
from decimal import Decimal
from typing import List, Optional
from pydantic import BaseModel, Field, validator

from app.models.study import StudyType, StudyStatus

# Base schemas
class StudyBase(BaseModel):
    """Base study schema"""
    title: str = Field(..., min_length=1, max_length=500, description="Study title")
    description: Optional[str] = Field(None, description="Study description")
    study_type: StudyType = Field(default=StudyType.IMPACT, description="Type of study")
    keywords: Optional[str] = Field(None, description="Comma-separated keywords")
    methodology: Optional[str] = Field(None, description="Study methodology")

class StudyCreate(StudyBase):
    """Schema for creating a study"""
    pass

class StudyUpdate(BaseModel):
    """Schema for updating a study"""
    title: Optional[str] = Field(None, min_length=1, max_length=500)
    description: Optional[str] = None
    study_type: Optional[StudyType] = None
    status: Optional[StudyStatus] = None
    keywords: Optional[str] = None
    methodology: Optional[str] = None

# Contributor schemas
class ContributorBase(BaseModel):
    """Base contributor schema"""
    name: str = Field(..., min_length=1, max_length=255)
    email: Optional[str] = Field(None, max_length=255)
    organization: Optional[str] = Field(None, max_length=255)
    role: Optional[str] = Field(None, max_length=100)

class ContributorCreate(ContributorBase):
    """Schema for creating a contributor"""
    pass

class Contributor(ContributorBase):
    """Contributor response schema"""
    id: int
    created_at: datetime
    
    class Config:
        from_attributes = True

# Indicator schemas
class StudyIndicatorBase(BaseModel):
    """Base study indicator schema"""
    indicator_id: int
    value: Optional[Decimal] = None
    unit: Optional[str] = Field(None, max_length=100)
    baseline_value: Optional[Decimal] = None
    target_value: Optional[Decimal] = None

class StudyIndicatorCreate(StudyIndicatorBase):
    """Schema for creating a study indicator"""
    pass

class StudyIndicator(StudyIndicatorBase):
    """Study indicator response schema"""
    id: int
    created_at: datetime
    
    class Config:
        from_attributes = True

# Main study schemas
class Study(StudyBase):
    """Study response schema"""
    id: int
    status: StudyStatus
    created_by: int
    created_at: datetime
    updated_at: datetime
    data_collection_period_start: Optional[datetime] = None
    data_collection_period_end: Optional[datetime] = None
    
    # Related data
    contributors: List[Contributor] = []
    indicators: List[StudyIndicator] = []
    
    class Config:
        from_attributes = True

class StudyList(BaseModel):
    """Schema for study list response"""
    id: int
    title: str
    study_type: StudyType
    status: StudyStatus
    created_at: datetime
    updated_at: datetime
    contributor_count: int = 0
    indicator_count: int = 0
    
    class Config:
        from_attributes = True

class StudySearchParams(BaseModel):
    """Schema for study search parameters"""
    q: Optional[str] = Field(None, description="Search query")
    study_type: Optional[StudyType] = Field(None, description="Filter by study type")
    status: Optional[StudyStatus] = Field(None, description="Filter by status")
    created_by: Optional[int] = Field(None, description="Filter by creator")
    page: int = Field(1, ge=1, description="Page number")
    size: int = Field(10, ge=1, le=100, description="Page size")
    sort_by: Optional[str] = Field("created_at", description="Sort field")
    sort_order: Optional[str] = Field("desc", regex="^(asc|desc)$", description="Sort order")

class StudySearchResponse(BaseModel):
    """Schema for study search response"""
    studies: List[StudyList]
    total: int
    page: int
    size: int
    pages: int

# Bulk operations
class StudyBulkUpdate(BaseModel):
    """Schema for bulk study updates"""
    study_ids: List[int] = Field(..., min_items=1)
    status: Optional[StudyStatus] = None
    
    @validator('study_ids')
    def validate_study_ids(cls, v):
        if len(v) > 100:
            raise ValueError('Cannot update more than 100 studies at once')
        return v
