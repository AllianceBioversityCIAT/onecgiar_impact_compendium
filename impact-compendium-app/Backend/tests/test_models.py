"""Unit tests for Study models and relationships."""

import pytest
from app.models.studies import Study
from app.models.study_categories import StudyCategory
from app.models.clarisa_impacts_areas import ImpactArea
from app.models.clarisa_initiatives import Initiative

def test_study_model_creation():
    """Test Study model can be instantiated."""
    
    study = Study(
        title="Test Study",
        summary="Test summary",
        year=2024,
        is_active=True
    )
    
    assert study.title == "Test Study"
    assert study.summary == "Test summary"
    assert study.year == 2024
    assert study.is_active is True

def test_study_model_fields():
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
    
    assert study.title == "Complete Study"
    assert study.year == 2024
    assert study.period_start == 2023
    assert study.period_end == 2024
    assert study.doi == "10.1000/test"
    assert study.is_active is True

def test_study_category_model():
    """Test StudyCategory model."""
    
    category = StudyCategory(name="Research")
    assert category.name == "Research"

def test_impact_area_model():
    """Test ImpactArea model."""
    
    impact_area = ImpactArea(name="Climate Change")
    assert impact_area.name == "Climate Change"

def test_initiative_model():
    """Test Initiative model."""
    
    initiative = Initiative(name="CGIAR Initiative")
    assert initiative.name == "CGIAR Initiative"
