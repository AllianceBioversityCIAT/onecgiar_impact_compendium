from sqlalchemy import Column, Integer, ForeignKey, Table
from app.db.connection import Base

# Association table for many-to-many relationship
studies_regions = Table(
    'studies_regions',
    Base.metadata,
    Column('study_id', Integer, ForeignKey('studies.id'), primary_key=True),
    Column('region_id', Integer, ForeignKey('clarisa_cgiar_regions.id'), primary_key=True)
)
