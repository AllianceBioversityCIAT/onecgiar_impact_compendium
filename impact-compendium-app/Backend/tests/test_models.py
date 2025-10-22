"""Unit tests for Study models and relationships."""

import pytest
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker
from app.db.connection import Base
from app.models.studies import Study
from app.models.study_categories import StudyCategory
from app.models.clarisa_impacts_areas import ImpactArea
from app.models.clarisa_initiatives import Initiative

# Create in-memory SQLite database for testing
engine = create_engine("sqlite:///:memory:")
TestingSessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)

@pytest.fixture
def db_session():
    """Create a test database session."""
    Base.metadata.create_all(bind=engine)
    session = TestingSessionLocal()
    try:
        yield session
    finally:
        session.close()
        Base.metadata.drop_all(bind=engine)

def test_create_study_with_relationships(db_session):
    """Test creating a Study with joined impact areas and contributors."""
    
    # Create test data
    category = StudyCategory(name="Research")
    impact_area = ImpactArea(name="Climate Change")
    initiative = Initiative(name="CGIAR Initiative")
    
    db_session.add_all([category, impact_area, initiative])
    db_session.commit()
    
    # Create study with relationships
    study = Study(
        title="Test Study",
        summary="Test summary",
        year=2024,
        category_id=category.id,
        is_active=True
    )
    
    # Add many-to-many relationships
    study.impact_areas.append(impact_area)
    study.initiatives.append(initiative)
    
    db_session.add(study)
    db_session.commit()
    
    # Verify relationships
    retrieved_study = db_session.query(Study).filter_by(title="Test Study").first()
    assert retrieved_study is not None
    assert retrieved_study.category.name == "Research"
    assert len(retrieved_study.impact_areas) == 1
    assert retrieved_study.impact_areas[0].name == "Climate Change"
    assert len(retrieved_study.initiatives) == 1
    assert retrieved_study.initiatives[0].name == "CGIAR Initiative"

def test_study_model_fields(db_session):
    """Test Study model has all required fields."""
    
    study = Study(
        title="Complete Study",
        summary="Complete summary",
        year=2024,
        period_start=2023,
        period_end=2024,
        doi="10.1000/test",
        intervention_details="Test intervention",
        pdf_filename="test.pdf",
        is_active=True
    )
    
    db_session.add(study)
    db_session.commit()
    
    retrieved = db_session.query(Study).first()
    assert retrieved.title == "Complete Study"
    assert retrieved.year == 2024
    assert retrieved.period_start == 2023
    assert retrieved.period_end == 2024
    assert retrieved.doi == "10.1000/test"
    assert retrieved.is_active is True
