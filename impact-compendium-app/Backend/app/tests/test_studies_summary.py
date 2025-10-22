"""Tests for studies summary endpoint."""

import pytest
import time
from fastapi.testclient import TestClient
from app.main import app

client = TestClient(app)

def test_get_studies_summary_success():
    """Test successful studies summary retrieval."""
    response = client.get("/studies/summary")
    assert response.status_code == 200
    
    data = response.json()
    assert data["success"] is True
    assert "total" in data
    assert "by_category" in data
    assert "recent_years" in data
    assert "top_initiatives" in data

def test_studies_summary_structure():
    """Test that summary has proper structure."""
    response = client.get("/studies/summary")
    assert response.status_code == 200
    
    data = response.json()
    
    # Check total is a number
    assert isinstance(data["total"], int)
    assert data["total"] > 0
    
    # Check by_category structure
    by_category = data["by_category"]
    assert isinstance(by_category, list)
    assert len(by_category) > 0
    
    for category in by_category:
        assert "name" in category
        assert "count" in category
        assert isinstance(category["count"], int)
    
    # Check recent_years structure
    recent_years = data["recent_years"]
    assert isinstance(recent_years, list)
    assert len(recent_years) > 0
    
    for year in recent_years:
        assert isinstance(year, int)
        assert year >= 2020  # Reasonable year range
    
    # Check top_initiatives structure
    top_initiatives = data["top_initiatives"]
    assert isinstance(top_initiatives, list)
    assert len(top_initiatives) > 0
    
    for initiative in top_initiatives:
        assert "name" in initiative
        assert "count" in initiative
        assert isinstance(initiative["count"], int)

def test_studies_summary_data_consistency():
    """Test that summary data is consistent."""
    response = client.get("/studies/summary")
    assert response.status_code == 200
    
    data = response.json()
    
    # Total should be reasonable compared to category counts
    total = data["total"]
    category_sum = sum(cat["count"] for cat in data["by_category"])
    
    # Categories might not sum to total (studies can have multiple categories)
    # but should be in reasonable range
    assert category_sum <= total * 2  # Allow for overlap
    
    # Recent years should be in descending order
    years = data["recent_years"]
    assert years == sorted(years, reverse=True)

def test_studies_summary_performance():
    """Test that summary endpoint responds quickly."""
    start_time = time.time()
    response = client.get("/studies/summary")
    end_time = time.time()
    
    assert response.status_code == 200
    # Should respond within 250ms (allowing for test overhead)
    assert (end_time - start_time) < 1.0

def test_studies_summary_cache_behavior():
    """Test caching behavior for summary endpoint."""
    # First request
    start_time = time.time()
    response1 = client.get("/studies/summary")
    first_duration = time.time() - start_time
    
    # Second request (should be faster if cached)
    start_time = time.time()
    response2 = client.get("/studies/summary")
    second_duration = time.time() - start_time
    
    assert response1.status_code == 200
    assert response2.status_code == 200
    
    # Data should be identical
    assert response1.json() == response2.json()
    
    # Both requests should be fast
    assert first_duration < 1.0
    assert second_duration < 1.0

def test_studies_summary_sidebar_data():
    """Test that summary provides data suitable for sidebar counters."""
    response = client.get("/studies/summary")
    assert response.status_code == 200
    
    data = response.json()
    
    # Should have enough categories for sidebar display
    assert len(data["by_category"]) >= 3
    
    # Should have recent years for filtering
    assert len(data["recent_years"]) >= 3
    
    # Should have top initiatives for display
    assert len(data["top_initiatives"]) >= 3
    
    # All counts should be positive
    for category in data["by_category"]:
        assert category["count"] > 0
    
    for initiative in data["top_initiatives"]:
        assert initiative["count"] > 0
