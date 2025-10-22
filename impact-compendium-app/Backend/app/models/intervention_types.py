from sqlalchemy import Column, Integer, String
from app.db.connection import Base

class InterventionType(Base):
    __tablename__ = "intervention_types"

    id = Column(Integer, primary_key=True, index=True)
    name = Column(String(255), nullable=False)
