from sqlalchemy import Column, Integer, String, Text, ForeignKey
from sqlalchemy.orm import relationship
from app.db.connection import Base

class Narrative(Base):
    __tablename__ = "narratives"

    id = Column(Integer, primary_key=True, index=True)
    study_id = Column(Integer, ForeignKey("studies.study_id"), nullable=False)
    title = Column(String(500))
    content = Column(Text)

    # Relationships
    study = relationship("Study", back_populates="narratives")
