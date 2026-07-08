"""
CLARISA reference data models based on ERD schema.
"""

from sqlalchemy import Boolean, Column, DateTime, Integer, String
from sqlalchemy.sql import func

from app.db.connection import Base


class ClarisaCenter(Base):
    """CLARISA centers reference table"""

    __tablename__ = "clarisa_centers"

    center_id = Column(Integer, primary_key=True, index=True)
    name = Column(String(255), nullable=False)
    code = Column(String(50))
    acronym = Column(String(50))
    is_active = Column(Boolean, default=True)
    created_at = Column(DateTime, server_default=func.now())


class ClarisaInitiative(Base):
    """CLARISA initiatives reference table"""

    __tablename__ = "clarisa_initiatives"

    initiative_id = Column(Integer, primary_key=True, index=True)
    name = Column(String(255), nullable=False)
    code = Column(String(50))
    acronym = Column(String(50))
    is_active = Column(Boolean, default=True)
    created_at = Column(DateTime, server_default=func.now())


class ClarisaCGIARRegion(Base):
    """CLARISA CGIAR regions reference table"""

    __tablename__ = "clarisa_cgiar_regions"

    region_id = Column(Integer, primary_key=True, index=True)
    region_name = Column(String(255), nullable=False)
    acronym = Column(String(50))
    is_active = Column(Boolean, default=True)
    created_at = Column(DateTime, server_default=func.now())


class ClarisaCountry(Base):
    """CLARISA countries reference table"""

    __tablename__ = "clarisa_countries"

    country_id = Column(Integer, primary_key=True, index=True)
    country_name = Column(String(255), nullable=False)
    is_active = Column(Boolean, default=True)


class ClarisaImpactArea(Base):
    """CLARISA impact areas reference table"""

    __tablename__ = "clarisa_impacts_areas"

    impact_area_id = Column(Integer, primary_key=True, index=True)
    name = Column(String(255), nullable=False)
    is_active = Column(Boolean, default=True)
    created_at = Column(DateTime, server_default=func.now())
