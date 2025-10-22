from sqlalchemy import Column, Integer, ForeignKey, Table
from app.db.connection import Base

# Association table for many-to-many relationship
studies_crop_types = Table(
    'studies_crop_types',
    Base.metadata,
    Column('study_id', Integer, ForeignKey('studies.study_id'), primary_key=True),
    Column('crop_type_id', Integer, ForeignKey('crop_types.id'), primary_key=True)
)
