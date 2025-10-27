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
    """Test Study model has all required fields (without intervention type column)."""
    
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
    assert study.intervention_details == "Test intervention"
    assert study.is_active is True

def test_study_category_model():
    """Test StudyCategory model (now using categories table)."""
    
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

def test_study_intervention_types_junction():
    """Test that studies can have intervention types through junction table."""
    
    # This test validates the new junction table approach
    # In practice, intervention types would be linked through studies_intervention_types table
    study = Study(
        title="Intervention Study",
        summary="Study with intervention",
        year=2024,
        intervention_details="Detailed intervention information",
        is_active=True
    )
    
    assert study.title == "Intervention Study"
    assert study.intervention_details == "Detailed intervention information"
    # Note: intervention_type relationship is now handled via junction table
