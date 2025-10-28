from sqlalchemy import Column, Integer, String, Text, ForeignKey
from sqlalchemy.orm import relationship
from app.db.connection import Base

class StudyIndicator(Base):
    __tablename__ = "studies_indicators"

    id = Column(Integer, primary_key=True, index=True)
    study_id = Column(Integer, ForeignKey("studies.id"), nullable=False)
    indicator_name = Column(String(255), nullable=False)
    indicator_value = Column(Text)

    # Relationships
    study = relationship("Study", back_populates="indicators")
