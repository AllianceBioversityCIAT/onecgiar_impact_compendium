"""
Main Study model.
"""

from sqlalchemy import Boolean, Column, DateTime, ForeignKey, Integer, String, Text
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func

from app.db.connection import Base


class Study(Base):
    """Main study model."""

    __tablename__ = "studies"

    id = Column(Integer, primary_key=True)
    title = Column(String(500), nullable=False)
    summary = Column(Text)
    year = Column(Integer)
    period_start = Column(Integer)
    period_end = Column(Integer)
    doi = Column(String(255))
    intervention_details = Column(Text)
    pdf_filename = Column(String(255))
    category_id = Column(Integer, ForeignKey("study_categories.id"))
    status = Column(String(50), default="draft")
    created_by = Column(String(255))
    created_at = Column(DateTime, server_default=func.now())
    updated_at = Column(DateTime, server_default=func.now(), onupdate=func.now())
    is_active = Column(Boolean, default=True)

    # Relationships
    category = relationship("StudyCategory", back_populates="studies")
    indicators = relationship("StudyIndicator", back_populates="study")
    keywords = relationship("StudyKeyword", back_populates="study")
    narratives = relationship("Narrative", back_populates="study")
