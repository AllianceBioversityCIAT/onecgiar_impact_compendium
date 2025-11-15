from sqlalchemy import Column, Integer, String
from sqlalchemy.orm import relationship

from app.db.connection import Base


class Center(Base):
    __tablename__ = "clarisa_centers"

    id = Column(Integer, primary_key=True, index=True)
    name = Column(String(255), nullable=False)

    # Relationships
    studies = relationship(
        "Study", secondary="studies_centers", back_populates="centers"
    )
