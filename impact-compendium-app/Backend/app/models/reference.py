"""
Reference data models based on ERD schema.
"""

from sqlalchemy import Column, Integer, String, Boolean, DateTime, Text
from sqlalchemy.sql import func
from app.db.connection import Base

class Keyword(Base):
    """Keywords reference table"""
    __tablename__ = "keywords"
    
    keyword_id = Column(Integer, primary_key=True, index=True)
    keyword = Column(String(255), nullable=False)
    is_active = Column(Boolean, default=True)
    created_at = Column(DateTime, server_default=func.now())

class InterventionType(Base):
    """Intervention types reference table"""
    __tablename__ = "intervention_types"
    
    intervention_type_id = Column(Integer, primary_key=True, index=True)
    name = Column(String(255), nullable=False)
    is_active = Column(Boolean, default=True)
    created_at = Column(DateTime, server_default=func.now())

class CropType(Base):
    """Crop types reference table"""
    __tablename__ = "crop_types"
    
    crop_type_id = Column(Integer, primary_key=True, index=True)
    name = Column(String(255), nullable=False)
    is_active = Column(Boolean, default=True)
    created_at = Column(DateTime, server_default=func.now())

class Narrative(Base):
    """Narratives table"""
    __tablename__ = "narratives"
    
    id = Column(Integer, primary_key=True, index=True)
    section_key = Column(String(255), nullable=False)
    content = Column(Text)
    last_updated = Column(DateTime, server_default=func.now(), onupdate=func.now())
