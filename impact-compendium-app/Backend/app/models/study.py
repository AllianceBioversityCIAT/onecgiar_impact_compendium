"""
Study model for Impact Compendium database.
"""

from sqlalchemy import Column, Integer, String, Text, DateTime, Boolean, ForeignKey
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func
from app.db.connection import Base

class Study(Base):
    """Study model representing research impact studies."""
    __tablename__ = "studies"
    
    # Primary key
    id = Column(Integer, primary_key=True, index=True)
    
    # Basic information
    title = Column(String(500), nullable=False, index=True)
    description = Column(Text)
    abstract = Column(Text)
    
    # Study classification
    category_id = Column(Integer, ForeignKey("studies_categories.id"))
    
    # Geographic information
    geographic_scope = Column(String(255))
    
    # Temporal information
    start_date = Column(DateTime)
    end_date = Column(DateTime)
    publication_year = Column(Integer)
    
    # Research details
    methodology = Column(Text)
    data_sources = Column(Text)
    sample_size = Column(Integer)
    outcomes = Column(Text)
    
    # Publication information
    doi = Column(String(255), unique=True)
    url = Column(String(500))
    citation = Column(Text)
    
    # Status
    is_published = Column(Boolean, default=False)
    
    # Metadata
    created_at = Column(DateTime, server_default=func.now())
    updated_at = Column(DateTime, server_default=func.now(), onupdate=func.now())
    created_by = Column(Integer, ForeignKey("users.id"))
    
    # Relationships
    creator = relationship("User", back_populates="studies")
    category = relationship("StudyCategory")
    
    def __repr__(self):
        return f"<Study(id={self.id}, title='{self.title[:50]}...')>"
