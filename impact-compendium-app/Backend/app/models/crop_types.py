from sqlalchemy import Column, Integer, String
from sqlalchemy.orm import relationship
from app.db.connection import Base

class CropType(Base):
    __tablename__ = "crop_types"

    id = Column(Integer, primary_key=True, index=True)
    name = Column(String(255), nullable=False)

    # Relationships
    studies = relationship("Study", secondary="studies_crop_types", back_populates="crops")
