"""
Indicator model for Impact Compendium based on ERD schema.
Note: The main indicators are stored in studies_indicators table as part of study.py
This file is kept for compatibility but the actual indicator data is in the junction table.
"""

from sqlalchemy import Boolean, Column, DateTime, Integer, String, Text
from sqlalchemy.sql import func

from app.db.connection import Base


# This model is kept for backward compatibility
# The actual indicator data is stored in StudyIndicator in study.py
class Indicator(Base):
    """Legacy indicator model - actual data is in studies_indicators"""

    __tablename__ = "legacy_indicators"

    id = Column(Integer, primary_key=True, index=True)
    name = Column(String(255), nullable=False, index=True)
    description = Column(Text)
    indicator_type = Column(String(100))
    unit = Column(String(100))
    category = Column(String(100))

    # Metadata
    active = Column(Boolean, default=True)
    created_at = Column(DateTime, server_default=func.now())
    updated_at = Column(DateTime, server_default=func.now(), onupdate=func.now())

    def __repr__(self):
        return f"<Indicator(id={self.id}, name='{self.name}')>"
