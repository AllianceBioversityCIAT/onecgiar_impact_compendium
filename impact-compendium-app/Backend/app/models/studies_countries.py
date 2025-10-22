from sqlalchemy import Column, Integer, ForeignKey, Table
from app.db.connection import Base

# Association table for many-to-many relationship
studies_countries = Table(
    'studies_countries',
    Base.metadata,
    Column('study_id', Integer, ForeignKey('studies.study_id'), primary_key=True),
    Column('country_id', Integer, ForeignKey('clarisa_countries.id'), primary_key=True)
)
