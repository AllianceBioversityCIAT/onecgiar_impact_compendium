"""
Indicator model for Impact Compendium.
"""

from sqlalchemy import Column, Integer, String, Text, Boolean, DateTime
from sqlalchemy.sql import func
from app.db.connection import Base

class Indicator(Base):
    """Indicator model for study metrics."""
    __tablename__ = "indicators"
    
    id = Column(Integer, primary_key=True, index=True)
    name = Column(String(255), nullable=False, index=True)
    description = Column(Text)
    indicator_type = Column(String(100))  # impact, outcome, output
    unit = Column(String(100))
    category = Column(String(100))
    
    # Metadata
    active = Column(Boolean, default=True)
    created_at = Column(DateTime, server_default=func.now())
    updated_at = Column(DateTime, server_default=func.now(), onupdate=func.now())
    
    def __repr__(self):
        return f"<Indicator(id={self.id}, name='{self.name}')>"
