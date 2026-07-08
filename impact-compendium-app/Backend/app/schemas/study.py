from datetime import datetime
from typing import Any, Dict, List, Optional

from pydantic import BaseModel


class TagChipOut(BaseModel):
    id: int
    name: str


class PeriodOut(BaseModel):
    start: Optional[int] = None
    end: Optional[int] = None


class CategoryOut(BaseModel):
    id: int
    name: str


class InterventionOut(BaseModel):
    type: Optional[str] = None
    detailsShort: Optional[str] = None


class ContributorsOut(BaseModel):
    initiatives: List[TagChipOut] = []
    centers: List[Dict[str, Any]] = []  # {id, acronym}


class IndicatorHighlightOut(BaseModel):
    indicator_measure: str
    unit: str
    result_reported: str


class IndicatorOut(BaseModel):
    id: int
    indicator_name: str
    indicator_value: Optional[str] = None


class StudyListItem(BaseModel):
    id: str  # Formatted as ICD-001
    title: str
    summary: Optional[str] = None
    year: Optional[int] = None
    period: Optional[PeriodOut] = None
    category: Optional[CategoryOut] = None
    intervention: Optional[InterventionOut] = None
    contributors: Optional[ContributorsOut] = None
    impact_areas: List[TagChipOut] = []
    regions: List[TagChipOut] = []
    countries: List[TagChipOut] = []
    indicators_highlight: List[IndicatorHighlightOut] = []
    doi: Optional[str] = None

    class Config:
        from_attributes = True


class StudyDetail(BaseModel):
    study_id: int
    title: str
    summary: Optional[str] = None
    year: Optional[int] = None
    period: Optional[PeriodOut] = None
    category: Optional[CategoryOut] = None
    doi: Optional[str] = None
    intervention_details: Optional[str] = None
    pdf_filename: Optional[str] = None
    indicators: List[IndicatorOut] = []
    crops: List[TagChipOut] = []
    impact_areas: List[TagChipOut] = []
    initiatives: List[TagChipOut] = []
    centers: List[TagChipOut] = []
    regions: List[TagChipOut] = []
    countries: List[TagChipOut] = []
    keywords: List[str] = []
    created_at: Optional[datetime] = None
    last_updated_date: Optional[datetime] = None

    class Config:
        from_attributes = True
