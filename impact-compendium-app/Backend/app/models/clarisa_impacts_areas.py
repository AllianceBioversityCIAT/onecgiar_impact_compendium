from sqlalchemy import Column, Integer, String
from sqlalchemy.orm import relationship
from app.db.connection import Base

class ImpactArea(Base):
    __tablename__ = "clarisa_impacts_areas"

    id = Column(Integer, primary_key=True, index=True)
    name = Column(String(255), nullable=False)

    # Relationships
    studies = relationship("Study", secondary="studies_impact_areas", back_populates="impact_areas")
