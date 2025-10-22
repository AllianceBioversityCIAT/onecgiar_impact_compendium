from sqlalchemy import Column, Integer, String, Text, Boolean, DateTime, ForeignKey
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func
from app.db.connection import Base

class Study(Base):
    __tablename__ = "studies"

    study_id = Column(Integer, primary_key=True, index=True)
    title = Column(String(500), nullable=False, index=True)
    summary = Column(Text)
    year = Column(Integer, index=True)
    period_start = Column(Integer)
    period_end = Column(Integer)
    category_id = Column(Integer, ForeignKey("study_categories.id"), index=True)
    doi = Column(String(255))
    study_intervention_types_intervention_type_id = Column(Integer, ForeignKey("intervention_types.id"))
    intervention_details = Column(Text)
    pdf_filename = Column(String(255))
    is_active = Column(Boolean, default=True)
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    last_updated_date = Column(DateTime(timezone=True), onupdate=func.now())

    # Relationships
    category = relationship("StudyCategory", back_populates="studies")
    intervention_type = relationship("InterventionType")
    indicators = relationship("StudyIndicator", back_populates="study")
    crops = relationship("CropType", secondary="studies_crop_types", back_populates="studies")
    impact_areas = relationship("ImpactArea", secondary="studies_impact_areas", back_populates="studies")
    initiatives = relationship("Initiative", secondary="studies_initiatives", back_populates="studies")
    centers = relationship("Center", secondary="studies_centers", back_populates="studies")
    regions = relationship("Region", secondary="studies_regions", back_populates="studies")
    countries = relationship("Country", secondary="studies_countries", back_populates="studies")
    keywords = relationship("StudyKeyword", back_populates="study")
    narratives = relationship("Narrative", back_populates="study")
