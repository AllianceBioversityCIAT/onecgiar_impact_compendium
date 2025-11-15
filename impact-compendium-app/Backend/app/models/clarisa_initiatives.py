from sqlalchemy import Column, Integer, String
from sqlalchemy.orm import relationship

from app.db.connection import Base


class Initiative(Base):
    __tablename__ = "clarisa_initiatives"

    id = Column(Integer, primary_key=True, index=True)
    name = Column(String(255), nullable=False)

    # Relationships
    studies = relationship(
        "Study", secondary="studies_initiatives", back_populates="initiatives"
    )
