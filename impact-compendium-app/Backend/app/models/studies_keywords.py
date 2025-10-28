from sqlalchemy import Column, Integer, String, ForeignKey
from sqlalchemy.orm import relationship
from app.db.connection import Base

class StudyKeyword(Base):
    __tablename__ = "studies_keywords"

    id = Column(Integer, primary_key=True, index=True)
    study_id = Column(Integer, ForeignKey("studies.id"), nullable=False)
    keyword = Column(String(255), nullable=False)

    # Relationships
    study = relationship("Study", back_populates="keywords")
