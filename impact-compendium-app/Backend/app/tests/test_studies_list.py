"""Tests for enhanced studies list endpoint."""

import pytest
from fastapi.testclient import TestClient
from app.main import app
from app.db.connection import get_db

client = TestClient(app)

def test_list_studies_basic():
    """Test basic studies list functionality."""
    response = client.get("/api/studies/")
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

def test_list_studies_pagination():
    """Test pagination functionality."""
    # Test first page
    response = client.get("/api/studies/?page=1&pageSize=2")
    assert response.status_code == 200
    
    data = response.json()
    assert len(data["data"]) <= 2
    assert data["pagination"]["page"] == 1
    assert data["pagination"]["pageSize"] == 2

def test_list_studies_sorting():
    """Test sorting functionality."""
    # Test year descending
    response = client.get("/api/studies/?sort=year:desc")
    assert response.status_code == 200
    
    data = response.json()
    if len(data["data"]) > 1:
        years = [item.get("year", 0) for item in data["data"]]
        assert years == sorted(years, reverse=True)

def test_list_studies_search():
    """Test search functionality."""
    response = client.get("/api/studies/?q=climate")
    assert response.status_code == 200
    
    data = response.json()
    # Should find studies with "climate" in title or summary
    assert data["success"] is True

def test_list_studies_category_filter():
    """Test category filtering."""
    response = client.get("/api/studies/?category=Impact Study")
    assert response.status_code == 200
    
    data = response.json()
    assert data["success"] is True

def test_list_studies_year_range_filter():
    """Test year range filtering."""
    response = client.get("/api/studies/?year_from=2023&year_to=2024")
    assert response.status_code == 200
    
    data = response.json()
    assert data["success"] is True

def test_study_list_item_schema():
    """Test that response matches expected schema structure."""
    response = client.get("/api/studies/?pageSize=1")
    assert response.status_code == 200
    
    data = response.json()
    if data["data"]:
        item = data["data"][0]
        
        # Check required fields exist
        expected_fields = ["id", "title", "year", "category"]
        
        for field in expected_fields:
            assert field in item, f"Missing field: {field}"

def test_list_studies_performance():
    """Test that endpoint responds within acceptable time."""
    import time
    
    start_time = time.time()
    response = client.get("/api/studies/?pageSize=25")
    end_time = time.time()
    
    assert response.status_code == 200
    # Should respond within acceptable time for RDS connection
    assert (end_time - start_time) < 5.0  # 5 seconds for RDS connection

def test_list_studies_fallback_behavior():
    """Test endpoint behavior with RDS database."""
    response = client.get("/api/studies/")
    assert response.status_code == 200
    
    data = response.json()
    assert data["success"] is True
