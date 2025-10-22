from sqlalchemy import Column, Integer, String
from sqlalchemy.orm import relationship
from app.db.connection import Base

class StudyCategory(Base):
    __tablename__ = "study_categories"

    id = Column(Integer, primary_key=True, index=True)
    name = Column(String(255), nullable=False)

    # Relationships
    studies = relationship("Study", back_populates="category")
