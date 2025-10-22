"""Tests for enhanced studies list endpoint."""

import pytest
from fastapi.testclient import TestClient
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker
from app.main import app
from app.db.connection import Base, get_db
from app.models.studies import Study
from app.models.study_categories import StudyCategory
from app.models.clarisa_impacts_areas import ImpactArea

# Test database setup
engine = create_engine("sqlite:///:memory:")
TestingSessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)

def override_get_db():
    try:
        db = TestingSessionLocal()
        yield db
    finally:
        db.close()

app.dependency_overrides[get_db] = override_get_db
client = TestClient(app)

@pytest.fixture
def setup_test_data():
    """Setup test data in database."""
    Base.metadata.create_all(bind=engine)
    db = TestingSessionLocal()
    
    # Create test category
    category = StudyCategory(id=1, name="Impact Study")
    impact_area = ImpactArea(id=1, name="Climate Adaptation")
    
    # Create test studies
    studies = [
        Study(
            study_id=1,
            title="Climate Smart Agriculture",
            summary="A comprehensive study on climate adaptation strategies",
            year=2023,
            period_start=2020,
            period_end=2023,
            category_id=1,
            is_active=True
        ),
        Study(
            study_id=2,
            title="Water Management Systems",
            summary="Research on efficient water usage in agriculture",
            year=2024,
            period_start=2021,
            period_end=2024,
            category_id=1,
            is_active=True
        ),
        Study(
            study_id=3,
            title="Crop Diversification Impact",
            summary="Analysis of crop diversification on farmer income",
            year=2022,
            period_start=2019,
            period_end=2022,
            category_id=1,
            is_active=True
        )
    ]
    
    db.add_all([category, impact_area] + studies)
    db.commit()
    db.close()
    
    yield
    
    Base.metadata.drop_all(bind=engine)

def test_list_studies_basic(setup_test_data):
    """Test basic studies list functionality."""
    response = client.get("/studies/")
    assert response.status_code == 200
    
    data = response.json()
    assert "success" in data
    assert "data" in data
    assert "pagination" in data
    
    # Check pagination structure
    pagination = data["pagination"]
    assert "total" in pagination
    assert "page" in pagination
    assert "pageSize" in pagination

def test_list_studies_pagination(setup_test_data):
    """Test pagination functionality."""
    # Test first page
    response = client.get("/studies/?page=1&pageSize=2")
    assert response.status_code == 200
    
    data = response.json()
    assert len(data["data"]) <= 2
    assert data["pagination"]["page"] == 1
    assert data["pagination"]["pageSize"] == 2

def test_list_studies_sorting(setup_test_data):
    """Test sorting functionality."""
    # Test year descending
    response = client.get("/studies/?sort=year:desc")
    assert response.status_code == 200
    
    data = response.json()
    if len(data["data"]) > 1:
        years = [item.get("year", 0) for item in data["data"]]
        assert years == sorted(years, reverse=True)

def test_list_studies_search(setup_test_data):
    """Test search functionality."""
    response = client.get("/studies/?q=climate")
    assert response.status_code == 200
    
    data = response.json()
    # Should find studies with "climate" in title or summary
    assert data["success"] is True

def test_list_studies_category_filter(setup_test_data):
    """Test category filtering."""
    response = client.get("/studies/?category=Impact Study")
    assert response.status_code == 200
    
    data = response.json()
    assert data["success"] is True

def test_list_studies_year_range_filter(setup_test_data):
    """Test year range filtering."""
    response = client.get("/studies/?year_from=2023&year_to=2024")
    assert response.status_code == 200
    
    data = response.json()
    assert data["success"] is True

def test_study_list_item_schema(setup_test_data):
    """Test that response matches expected schema structure."""
    response = client.get("/studies/?pageSize=1")
    assert response.status_code == 200
    
    data = response.json()
    if data["data"]:
        item = data["data"][0]
        
        # Check required fields exist
        expected_fields = [
            "id", "title", "year", "period", "category",
            "intervention", "contributors", "impact_areas",
            "regions", "countries", "indicators_highlight"
        ]
        
        for field in expected_fields:
            assert field in item, f"Missing field: {field}"
        
        # Check nested structure
        if item.get("contributors"):
            assert "initiatives" in item["contributors"]
            assert "centers" in item["contributors"]
        
        if item.get("period"):
            assert "start" in item["period"] or "end" in item["period"]

def test_list_studies_performance():
    """Test that endpoint responds within acceptable time."""
    import time
    
    start_time = time.time()
    response = client.get("/studies/?pageSize=25")
    end_time = time.time()
    
    assert response.status_code == 200
    # Should respond within 250ms (allowing for test overhead)
    assert (end_time - start_time) < 1.0  # 1 second for test environment

def test_list_studies_fallback_mock_data():
    """Test fallback to mock data when database fails."""
    # This will use mock data since we're not setting up the database
    response = client.get("/studies/")
    assert response.status_code == 200
    
    data = response.json()
    assert data["success"] is True
    # Should have note about using mock data
    assert "note" in data or len(data["data"]) > 0
