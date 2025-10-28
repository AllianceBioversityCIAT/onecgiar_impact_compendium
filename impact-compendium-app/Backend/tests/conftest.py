"""
Test configuration and fixtures
===============================

Global test configuration and shared fixtures for the test suite.
"""

import pytest
from fastapi.testclient import TestClient
from unittest.mock import Mock, patch
from sqlalchemy.orm import Session

from app.main import app
from app.db.connection import get_db
from app.middleware.auth import get_current_user, require_admin, require_researcher

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

# JWT Authentication fixtures
@pytest.fixture
def mock_user():
    """Mock authenticated user"""
    return {
        "user_id": "test-user-123",
        "email": "test@example.com",
        "name": "Test User",
        "groups": ["researchers"],
        "is_authenticated": True
    }

@pytest.fixture
def mock_admin_user():
    """Mock admin user"""
    return {
        "user_id": "admin-user-123",
        "email": "admin@example.com",
        "name": "Admin User",
        "groups": ["admin"],
        "is_authenticated": True
    }

@pytest.fixture
def mock_researcher_user():
    """Mock researcher user"""
    return {
        "user_id": "researcher-user-123",
        "email": "researcher@example.com",
        "name": "Researcher User",
        "groups": ["researchers"],
        "is_authenticated": True
    }

@pytest.fixture
def auth_headers():
    """Authentication headers for API requests"""
    return {"Authorization": "Bearer mock_jwt_token_12345"}

@pytest.fixture
def authenticated_client(client, mock_user):
    """Test client with mocked authentication"""
    with patch('app.middleware.auth.get_current_user', return_value=mock_user):
        yield client

@pytest.fixture
def admin_client(client, mock_admin_user):
    """Test client with mocked admin authentication"""
    with patch('app.middleware.auth.get_current_user', return_value=mock_admin_user), \
         patch('app.middleware.auth.require_admin', return_value=mock_admin_user):
        yield client

@pytest.fixture
def researcher_client(client, mock_researcher_user):
    """Test client with mocked researcher authentication"""
    with patch('app.middleware.auth.get_current_user', return_value=mock_researcher_user), \
         patch('app.middleware.auth.require_researcher', return_value=mock_researcher_user):
        yield client

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
