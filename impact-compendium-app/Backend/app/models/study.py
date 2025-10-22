"""
Study models for Impact Compendium database based on ERD schema.
"""

import enum
from sqlalchemy import Column, Integer, String, Text, DateTime, Boolean, ForeignKey, Enum
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func
from app.db.connection import Base

class StudyType(enum.Enum):
    """Study type enumeration"""
    IMPACT = "impact"
    OUTCOME = "outcome"
    OUTPUT = "output"
    OTHER = "other"

class StudyStatus(enum.Enum):
    """Study status enumeration"""
    DRAFT = "draft"
    UNDER_REVIEW = "under_review"
    PUBLISHED = "published"
    ARCHIVED = "archived"

class Study(Base):
    """Main studies table"""
    __tablename__ = "studies"
    
    study_id = Column(Integer, primary_key=True, index=True)
    title = Column(String(500), nullable=False)
    year = Column(Integer)
    summary = Column(Text)
    period_start = Column(DateTime)
    period_end = Column(DateTime)
    category_id = Column(Integer, ForeignKey("studies_categories.study_category_id"))
    study_intervention_types_intervention_type_id = Column(Integer, ForeignKey("study_intervention_types.study_intervention_type_id"))
    intervention_details = Column(Text)
    doi = Column(String(255))
    pdf_filename = Column(String(255))
    outputs_v1 = Column(Text)
    outputs_v2 = Column(Text)
    is_active = Column(Boolean, default=True)
    created_at = Column(DateTime, server_default=func.now())
    created_by = Column(Integer)
    last_updated_date = Column(DateTime, server_default=func.now(), onupdate=func.now())
    last_updated_by = Column(Integer)
    
    # Relationships
    category = relationship("StudyCategory")
    contributors = relationship("StudyContributor")
    keywords = relationship("StudyKeyword")
    indicators = relationship("StudyIndicator")
    regions = relationship("StudyRegion")
    countries = relationship("StudyCountry")
    impact_areas = relationship("StudyImpactArea")
    crop_types = relationship("StudyCropType")

class StudyCategory(Base):
    """Studies categories table"""
    __tablename__ = "studies_categories"
    
    study_category_id = Column(Integer, primary_key=True, index=True)
    name = Column(String(255), nullable=False)
    is_active = Column(Boolean, default=True)
    created_at = Column(DateTime, server_default=func.now())
    
    # Relationships
    studies = relationship("Study")

class StudyContributor(Base):
    """Studies contributors junction table"""
    __tablename__ = "studies_contributors"
    
    studies_initiatives_id = Column(Integer, primary_key=True, index=True)
    study_id = Column(Integer, ForeignKey("studies.study_id"), nullable=False)
    is_active = Column(Boolean, default=True)
    clarisa_centers_center_id = Column(Integer, ForeignKey("clarisa_centers.center_id"))
    clarisa_initiatives_initiative_id = Column(Integer, ForeignKey("clarisa_initiatives.initiative_id"))
    
    # Relationships
    center = relationship("ClarisaCenter")
    initiative = relationship("ClarisaInitiative")

class StudyKeyword(Base):
    """Studies keywords junction table"""
    __tablename__ = "studies_keywords"
    
    studies_keyword_id = Column(Integer, primary_key=True, index=True)
    study_id = Column(Integer, ForeignKey("studies.study_id"), nullable=False)
    keyword_id = Column(Integer, ForeignKey("keywords.keyword_id"), nullable=False)
    is_active = Column(Boolean, default=True)
    
    # Relationships
    keyword = relationship("Keyword")

class StudyIndicator(Base):
    """Studies indicators junction table"""
    __tablename__ = "studies_indicators"
    
    indicator_id = Column(Integer, primary_key=True, index=True)
    study_id = Column(Integer, ForeignKey("studies.study_id"), nullable=False)
    indicator_measure = Column(String(255))
    unit_of_measure = Column(String(100))
    result_reported = Column(Text)
    is_active = Column(Boolean, default=True)
    created_at = Column(DateTime, server_default=func.now())
    
    # Relationships
    study = relationship("Study", back_populates="indicators")

class StudyRegion(Base):
    """Studies regions junction table"""
    __tablename__ = "studies_regions"
    
    studies_regions_id = Column(Integer, primary_key=True, index=True)
    study_id = Column(Integer, ForeignKey("studies.study_id"), nullable=False)
    region_id = Column(Integer, ForeignKey("clarissa_CGIAR_regions.region_id"), nullable=False)
    is_active = Column(Boolean, default=True)
    
    # Relationships
    region = relationship("ClarisaCGIARRegion")

class StudyCountry(Base):
    """Studies countries junction table"""
    __tablename__ = "studies_countries"
    
    studies_countries_id = Column(Integer, primary_key=True, index=True)
    study_id = Column(Integer, ForeignKey("studies.study_id"), nullable=False)
    country_id = Column(Integer, ForeignKey("clarissa_countries.country_id"), nullable=False)
    is_active = Column(Boolean, default=True)
    
    # Relationships
    country = relationship("ClarisaCountry")

class StudyImpactArea(Base):
    """Studies impact areas junction table"""
    __tablename__ = "studies_impact_areas"
    
    studies_impact_areas_id = Column(Integer, primary_key=True, index=True)
    studies_study_id = Column(Integer, ForeignKey("studies.study_id"), nullable=False)
    clarisa_impacts_areas_impact_area_id = Column(Integer, ForeignKey("clarisa_impacts_areas.impact_area_id"), nullable=False)
    impact_area_level = Column(String(50))
    is_active = Column(Boolean, default=True)
    
    # Relationships
    impact_area = relationship("ClarisaImpactArea")

class StudyCropType(Base):
    """Studies crop types junction table"""
    __tablename__ = "studies_crop_types"
    
    studies_crop_type_id = Column(Integer, primary_key=True, index=True)
    study_id = Column(Integer, ForeignKey("studies.study_id"), nullable=False)
    crop_type_id = Column(Integer, ForeignKey("crop_types.crop_type_id"), nullable=False)
    is_active = Column(Boolean, default=True)
    
    # Relationships
    crop_type = relationship("CropType")

class StudyInterventionType(Base):
    """Study intervention types table"""
    __tablename__ = "study_intervention_types"
    
    study_intervention_type_id = Column(Integer, primary_key=True, index=True)
    study_id = Column(Integer, ForeignKey("studies.study_id"), nullable=False)
    intervention_type_id = Column(Integer, ForeignKey("intervention_types.intervention_type_id"), nullable=False)
    details = Column(Text)
    is_active = Column(Boolean, default=True)
    created_at = Column(DateTime, server_default=func.now())
    
    # Relationships
    intervention_type = relationship("InterventionType")
