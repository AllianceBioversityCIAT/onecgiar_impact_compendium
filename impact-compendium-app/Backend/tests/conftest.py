"""
Test configuration and fixtures
===============================

Global test configuration and shared fixtures for the test suite.
"""

import pytest
from fastapi.testclient import TestClient
from unittest.mock import Mock
from sqlalchemy.orm import Session

from app.main import app
from app.db.connection import get_db

@pytest.fixture
def client():
    """FastAPI test client"""
    return TestClient(app)

@pytest.fixture
def mock_db_session():
    """Mock database session"""
    return Mock(spec=Session)

@pytest.fixture
def mock_request():
    """Mock FastAPI request object"""
    request = Mock()
    request.headers = {"authorization": "Bearer test-token", "x-user-email": "test@example.com"}
    request.cookies = {}
    return request

# Test data fixtures
@pytest.fixture
def sample_study_data():
    """Sample study data for testing"""
    return {
        "studyId": 99999,
        "title": "Test Study",
        "summary": "Test summary",
        "year": 2024,
        "category": "1",
        "periodStart": "2023",
        "periodEnd": "2024",
        "interventionType": "104",
        "interventionDetails": "Test intervention",
        "primaryCGIARImpactArea": "1",
        "countries": [1, 2],
        "regions": [1],
        "indicators": [
            {
                "indicatorMeasure": "Test Metric",
                "unitMeasure": "%",
                "resultReported": "25%"
            }
        ]
    }

@pytest.fixture
def sample_study_response():
    """Sample study response data"""
    return {
        "study_id": 99999,
        "title": "Test Study",
        "summary": "Test summary",
        "year": 2024,
        "category": {"id": 31, "name": "Impact Study"},
        "created_at": "2024-10-26T16:01:28"
    }
