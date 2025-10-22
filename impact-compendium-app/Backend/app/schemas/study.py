"""
Study Pydantic schemas for request/response validation based on ERD schema
"""

from datetime import datetime
from typing import List, Optional
from pydantic import BaseModel, Field

from app.models.study import StudyType, StudyStatus

# Base schemas
class StudyBase(BaseModel):
    """Base study schema"""
    title: str = Field(..., min_length=1, max_length=500, description="Study title")
    year: Optional[int] = Field(None, description="Study year")
    summary: Optional[str] = Field(None, description="Study summary")
    period_start: Optional[datetime] = Field(None, description="Study period start date")
    period_end: Optional[datetime] = Field(None, description="Study period end date")
    intervention_details: Optional[str] = Field(None, description="Intervention details")
    doi: Optional[str] = Field(None, description="Digital Object Identifier")
    pdf_filename: Optional[str] = Field(None, description="PDF filename")
    outputs_v1: Optional[str] = Field(None, description="Outputs version 1")
    outputs_v2: Optional[str] = Field(None, description="Outputs version 2")

class StudyCreate(StudyBase):
    """Schema for creating a study"""
    category_id: Optional[int] = Field(None, description="Study category ID")

class StudyUpdate(StudyBase):
    """Schema for updating a study"""
    title: Optional[str] = Field(None, min_length=1, max_length=500, description="Study title")
    category_id: Optional[int] = Field(None, description="Study category ID")

class StudyResponse(StudyBase):
    """Schema for study response"""
    study_id: int = Field(..., description="Study ID")
    category_id: Optional[int] = Field(None, description="Study category ID")
    is_active: bool = Field(True, description="Is study active")
    created_at: datetime = Field(..., description="Creation timestamp")
    created_by: Optional[int] = Field(None, description="Created by user ID")
    last_updated_date: Optional[datetime] = Field(None, description="Last update timestamp")
    last_updated_by: Optional[int] = Field(None, description="Last updated by user ID")

    class Config:
        from_attributes = True

class StudyList(BaseModel):
    """Schema for study list items"""
    study_id: int = Field(..., description="Study ID")
    title: str = Field(..., description="Study title")
    year: Optional[int] = Field(None, description="Study year")
    summary: Optional[str] = Field(None, description="Study summary")
    category_id: Optional[int] = Field(None, description="Study category ID")
    is_active: bool = Field(True, description="Is study active")
    created_at: datetime = Field(..., description="Creation timestamp")

    class Config:
        from_attributes = True

# Category schemas
class StudyCategoryBase(BaseModel):
    """Base study category schema"""
    name: str = Field(..., min_length=1, max_length=255, description="Category name")

class StudyCategoryCreate(StudyCategoryBase):
    """Schema for creating a study category"""
    pass

class StudyCategoryResponse(StudyCategoryBase):
    """Schema for study category response"""
    study_category_id: int = Field(..., description="Category ID")
    is_active: bool = Field(True, description="Is category active")
    created_at: datetime = Field(..., description="Creation timestamp")

    class Config:
        from_attributes = True

# Contributor schemas
class StudyContributorBase(BaseModel):
    """Base study contributor schema"""
    clarisa_centers_center_id: Optional[int] = Field(None, description="CLARISA center ID")
    clarisa_initiatives_initiative_id: Optional[int] = Field(None, description="CLARISA initiative ID")

class StudyContributorCreate(StudyContributorBase):
    """Schema for creating a study contributor"""
    study_id: int = Field(..., description="Study ID")

class StudyContributorResponse(StudyContributorBase):
    """Schema for study contributor response"""
    studies_initiatives_id: int = Field(..., description="Contributor ID")
    study_id: int = Field(..., description="Study ID")
    is_active: bool = Field(True, description="Is contributor active")

    class Config:
        from_attributes = True

# Indicator schemas
class StudyIndicatorBase(BaseModel):
    """Base study indicator schema"""
    indicator_measure: Optional[str] = Field(None, description="Indicator measure")
    unit_of_measure: Optional[str] = Field(None, description="Unit of measure")
    result_reported: Optional[str] = Field(None, description="Result reported")

class StudyIndicatorCreate(StudyIndicatorBase):
    """Schema for creating a study indicator"""
    study_id: int = Field(..., description="Study ID")

class StudyIndicatorResponse(StudyIndicatorBase):
    """Schema for study indicator response"""
    indicator_id: int = Field(..., description="Indicator ID")
    study_id: int = Field(..., description="Study ID")
    is_active: bool = Field(True, description="Is indicator active")
    created_at: datetime = Field(..., description="Creation timestamp")

    class Config:
        from_attributes = True

# Search and pagination schemas
class StudySearchParams(BaseModel):
    """Schema for study search parameters"""
    title: Optional[str] = Field(None, description="Search by title")
    year: Optional[int] = Field(None, description="Filter by year")
    category_id: Optional[int] = Field(None, description="Filter by category")
    is_active: Optional[bool] = Field(True, description="Filter by active status")
    page: int = Field(1, ge=1, description="Page number")
    size: int = Field(10, ge=1, le=100, description="Page size")
    sort_by: Optional[str] = Field("created_at", description="Sort field")
    sort_order: Optional[str] = Field("desc", pattern="^(asc|desc)$", description="Sort order")

class StudySearchResponse(BaseModel):
    """Schema for study search response"""
    studies: List[StudyList]
    total: int = Field(..., description="Total number of studies")
    page: int = Field(..., description="Current page")
    size: int = Field(..., description="Page size")
    pages: int = Field(..., description="Total pages")

    class Config:
        from_attributes = True
