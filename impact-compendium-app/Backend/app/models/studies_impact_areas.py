from sqlalchemy import Column, Integer, ForeignKey, Table
from app.db.connection import Base

# Association table for many-to-many relationship
studies_impact_areas = Table(
    'studies_impact_areas',
    Base.metadata,
    Column('study_id', Integer, ForeignKey('studies.study_id'), primary_key=True),
    Column('impact_area_id', Integer, ForeignKey('clarisa_impacts_areas.id'), primary_key=True)
)
