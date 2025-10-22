from sqlalchemy import Column, Integer, String
from sqlalchemy.orm import relationship
from app.db.connection import Base

class Region(Base):
    __tablename__ = "clarisa_cgiar_regions"

    id = Column(Integer, primary_key=True, index=True)
    name = Column(String(255), nullable=False)

    # Relationships
    studies = relationship("Study", secondary="studies_regions", back_populates="regions")
