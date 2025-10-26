"""
Association tables for many-to-many relationships.
"""

from sqlalchemy import Column, Integer, ForeignKey, String, DateTime, Text
from sqlalchemy.sql import func
from app.db.connection import Base

class StudyContributor(Base):
    """Contributors to studies."""
    __tablename__ = "studies_contributors"
    
    id = Column(Integer, primary_key=True)
    study_id = Column(Integer, ForeignKey("studies.id"), nullable=False)
    center_id = Column(Integer, ForeignKey("clarisa_centers.id"))
    initiative_id = Column(Integer, ForeignKey("clarisa_initiatives.id"))
    contributor_name = Column(String(255))
    role = Column(String(100))
    created_at = Column(DateTime, server_default=func.now())

class StudyCountry(Base):
    """Countries associated with studies."""
    __tablename__ = "studies_countries"
    
    id = Column(Integer, primary_key=True)
    study_id = Column(Integer, ForeignKey("studies.id"), nullable=False)
    country_id = Column(Integer, ForeignKey("clarisa_countries.id"), nullable=False)

class StudyCropType(Base):
    """Crop types associated with studies."""
    __tablename__ = "studies_crop_types"
    
    id = Column(Integer, primary_key=True)
    study_id = Column(Integer, ForeignKey("studies.id"), nullable=False)
    crop_type_id = Column(Integer, ForeignKey("crop_types.id"), nullable=False)

class StudyImpactArea(Base):
    """Impact areas associated with studies."""
    __tablename__ = "studies_impact_areas"
    
    id = Column(Integer, primary_key=True)
    study_id = Column(Integer, ForeignKey("studies.id"), nullable=False)
    impact_area_id = Column(Integer, ForeignKey("clarisa_impacts_areas.id"), nullable=False)

class StudyIndicator(Base):
    """Indicators associated with studies."""
    __tablename__ = "studies_indicators"
    
    id = Column(Integer, primary_key=True)
    study_id = Column(Integer, ForeignKey("studies.id"), nullable=False)
    indicator_name = Column(String(255), nullable=False)
    indicator_value = Column(String(255))
    unit = Column(String(100))
    methodology = Column(Text)
    created_at = Column(DateTime, server_default=func.now())

class StudyKeyword(Base):
    """Keywords associated with studies."""
    __tablename__ = "studies_keywords"
    
    id = Column(Integer, primary_key=True)
    study_id = Column(Integer, ForeignKey("studies.id"), nullable=False)
    keyword_id = Column(Integer, ForeignKey("keywords.id"), nullable=False)

class StudyRegion(Base):
    """Regions associated with studies."""
    __tablename__ = "studies_regions"
    
    id = Column(Integer, primary_key=True)
    study_id = Column(Integer, ForeignKey("studies.id"), nullable=False)
    region_id = Column(Integer, ForeignKey("clarisa_cgiar_regions.id"), nullable=False)

class StudyInterventionType(Base):
    """Intervention types associated with studies."""
    __tablename__ = "study_intervention_types"
    
    id = Column(Integer, primary_key=True)
    study_id = Column(Integer, ForeignKey("studies.id"), nullable=False)
    intervention_type_id = Column(Integer, ForeignKey("intervention_types.id"), nullable=False)
