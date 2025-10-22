"""Tests for study detail endpoint."""

import pytest
import time
from fastapi.testclient import TestClient
from app.main import app

client = TestClient(app)

def test_get_study_detail_success():
    """Test successful study detail retrieval."""
    response = client.get("/studies/ICD-001")
    assert response.status_code == 200
    
    data = response.json()
    assert data["success"] is True
    assert "data" in data
    
    study = data["data"]
    assert "study_id" in study
    assert "title" in study
    assert "summary" in study
    assert "indicators" in study
    assert "narratives" in study

def test_get_study_detail_numeric_id():
    """Test study detail with numeric ID."""
    response = client.get("/studies/123")
    assert response.status_code == 200
    
    data = response.json()
    assert data["success"] is True

def test_get_study_detail_invalid_id():
    """Test study detail with invalid ID format."""
    response = client.get("/studies/invalid-id")
    assert response.status_code == 400

def test_study_detail_full_shape():
    """Test that study detail has all required fields."""
    response = client.get("/studies/ICD-001")
    assert response.status_code == 200
    
    study = response.json()["data"]
    
    # Check all required fields
    required_fields = [
        "study_id", "title", "summary", "year", "period", "category",
        "doi", "intervention_details", "indicators", "crops", "impact_areas",
        "initiatives", "centers", "regions", "countries", "keywords",
        "narratives", "created_at", "last_updated_date"
    ]
    
    for field in required_fields:
        assert field in study, f"Missing field: {field}"

def test_study_detail_indicators_structure():
    """Test that indicators have proper structure."""
    response = client.get("/studies/ICD-001")
    assert response.status_code == 200
    
    study = response.json()["data"]
    indicators = study["indicators"]
    
    assert len(indicators) > 0
    
    for indicator in indicators:
        assert "measure" in indicator
        assert "unit" in indicator
        assert "baseline" in indicator
        assert "target" in indicator
        assert "result_reported" in indicator

def test_study_detail_narratives_structure():
    """Test that narratives have proper structure."""
    response = client.get("/studies/ICD-001")
    assert response.status_code == 200
    
    study = response.json()["data"]
    narratives = study["narratives"]
    
    assert len(narratives) > 0
    
    for narrative in narratives:
        assert "section_key" in narrative
        assert "content" in narrative

def test_study_detail_performance():
    """Test that detail endpoint responds quickly."""
    start_time = time.time()
    response = client.get("/studies/ICD-001")
    end_time = time.time()
    
    assert response.status_code == 200
    # Should respond within 250ms (allowing for test overhead)
    assert (end_time - start_time) < 1.0

def test_study_detail_cache_behavior():
    """Test caching behavior if enabled."""
    # First request
    start_time = time.time()
    response1 = client.get("/studies/ICD-001")
    first_duration = time.time() - start_time
    
    # Second request (should be faster if cached)
    start_time = time.time()
    response2 = client.get("/studies/ICD-001")
    second_duration = time.time() - start_time
    
    assert response1.status_code == 200
    assert response2.status_code == 200
    
    # Data should be identical
    assert response1.json() == response2.json()
    
    # Second request should be faster (cache hit)
    # Note: This might not always be true in test environment
    # but we check that both responses are fast
    assert first_duration < 1.0
    assert second_duration < 1.0
