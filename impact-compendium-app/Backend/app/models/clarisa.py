"""
CLARISA reference data models.
"""

from sqlalchemy import Column, Integer, String, Text, Boolean
from app.db.connection import Base

class ClarisaCenter(Base):
    """CGIAR Centers from CLARISA."""
    __tablename__ = "clarisa_centers"
    
    id = Column(Integer, primary_key=True)
    name = Column(String(255), nullable=False)
    acronym = Column(String(50))
    code = Column(String(50))
    active = Column(Boolean, default=True)

class ClarisaInitiative(Base):
    """CGIAR Initiatives from CLARISA."""
    __tablename__ = "clarisa_initiatives"
    
    id = Column(Integer, primary_key=True)
    name = Column(String(255), nullable=False)
    official_code = Column(String(50))
    short_name = Column(String(100))
    active = Column(Boolean, default=True)

class ClarisaCountry(Base):
    """Countries from CLARISA."""
    __tablename__ = "clarissa_countries"
    
    id = Column(Integer, primary_key=True)
    name = Column(String(255), nullable=False)
    iso_alpha_2 = Column(String(2))
    iso_alpha_3 = Column(String(3))
    region_id = Column(Integer)

class ClarisaRegion(Base):
    """CGIAR Regions from CLARISA."""
    __tablename__ = "clarissa_CGIAR_regions"
    
    id = Column(Integer, primary_key=True)
    name = Column(String(255), nullable=False)
    acronym = Column(String(50))

class ClarisaImpactArea(Base):
    """Impact Areas from CLARISA."""
    __tablename__ = "clarisa_impacts_areas"
    
    id = Column(Integer, primary_key=True)
    name = Column(String(255), nullable=False)
    description = Column(Text)

class CropType(Base):
    """Crop types."""
    __tablename__ = "crop_types"
    
    id = Column(Integer, primary_key=True)
    name = Column(String(255), nullable=False)
    category = Column(String(100))

class InterventionType(Base):
    """Intervention types."""
    __tablename__ = "intervention_types"
    
    id = Column(Integer, primary_key=True)
    name = Column(String(255), nullable=False)
    description = Column(Text)

class Keyword(Base):
    """Keywords for studies."""
    __tablename__ = "keywords"
    
    id = Column(Integer, primary_key=True)
    name = Column(String(255), nullable=False, unique=True)

class StudyCategory(Base):
    """Study categories."""
    __tablename__ = "studies_categories"
    
    id = Column(Integer, primary_key=True)
    name = Column(String(255), nullable=False)
    description = Column(Text)
