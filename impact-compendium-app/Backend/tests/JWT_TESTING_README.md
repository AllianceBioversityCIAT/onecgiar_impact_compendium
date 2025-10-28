# JWT Authentication Testing

## Overview
Updated unit tests to work with the new JWT authentication implementation using AWS Cognito.

## Test Structure

### 1. Test Fixtures (`conftest.py`)
- **`mock_user`**: Standard authenticated user
- **`mock_admin_user`**: Admin user with admin role
- **`mock_researcher_user`**: Researcher user with researcher role
- **`auth_headers`**: JWT authentication headers
- **`authenticated_client`**: Test client with mocked authentication
- **`admin_client`**: Test client with mocked admin authentication
- **`researcher_client`**: Test client with mocked researcher authentication

### 2. JWT Authentication Tests (`test_jwt_auth.py`)
- Token validation tests
- Role-based access control tests
- Cognito service tests
- Mock mode tests

### 3. API Endpoints Tests (`test_api_endpoints.py`)
- Public endpoint tests (no auth required)
- Protected endpoint tests (auth required)
- Admin endpoint tests (admin role required)
- Authentication failure tests

### 4. Studies CRUD Tests (`test_studies_crud.py`)
- Create study tests (researcher auth required)
- Update study tests (researcher auth required)
- Delete study tests (researcher auth required)
- Read operations (public access)

### 5. User Management Tests (`test_user_management.py`)
- All operations require admin authentication
- CRUD operations for user management
- Authentication failure tests

## Running Tests

### Individual Test Files
```bash
# JWT authentication tests
pytest tests/test_jwt_auth.py -v

# API endpoint tests
pytest tests/test_api_endpoints.py -v

# User management tests
pytest tests/test_user_management.py -v

# Studies CRUD tests
pytest tests/test_studies_crud.py -v
```

### All Tests
```bash
pytest tests/ -v
```

### With Coverage
```bash
pytest tests/ --cov=app --cov-report=html
```

## Test Categories

### Public Endpoints (No Authentication)
- Health checks
- Auth status
- Studies list (read-only)
- Studies detail (read-only)

### Researcher Endpoints (Researcher or Admin Role)
- Create studies
- Update studies
- Delete studies

### Admin Endpoints (Admin Role Only)
- Admin statistics
- User management (CRUD)
- User password reset

## Mocking Strategy

### Authentication Mocking
Tests use `unittest.mock.patch` to mock authentication dependencies:
- `get_current_user` - Returns mock user data
- `require_admin` - Returns mock admin user
- `require_researcher` - Returns mock researcher user

### Database Mocking
Database operations are mocked using:
- Mock SQLAlchemy sessions
- Mock query results
- Mock transaction operations

### Cognito Service Mocking
Cognito operations are mocked to avoid AWS API calls:
- User listing
- User creation
- User updates
- Password resets

## Test Data

### Mock Users
```python
# Standard user
{
    "user_id": "test-user-123",
    "email": "test@example.com",
    "name": "Test User",
    "groups": ["researchers"],
    "is_authenticated": True
}

# Admin user
{
    "user_id": "admin-user-123",
    "email": "admin@example.com",
    "name": "Admin User",
    "groups": ["admin"],
    "is_authenticated": True
}
```

### Mock JWT Token
```
Bearer mock_jwt_token_12345
```

## Authentication Flow Testing

### 1. Valid Authentication
- Mock valid JWT token
- Mock user extraction from token
- Test successful endpoint access

### 2. Invalid Authentication
- Test missing Authorization header
- Test invalid JWT token
- Test expired token scenarios

### 3. Role-Based Access
- Test admin-only endpoints with admin user
- Test admin-only endpoints with regular user (should fail)
- Test researcher endpoints with researcher user
- Test researcher endpoints with admin user (should pass)

## Integration with CI/CD

### GitHub Actions
```yaml
- name: Run JWT Authentication Tests
  run: |
    cd Backend
    pytest tests/test_jwt_auth.py -v
    pytest tests/test_api_endpoints.py -v
    pytest tests/test_user_management.py -v
```

### Local Development
```bash
# Quick test run
python run_jwt_tests.py

# Full test suite
pytest tests/ -v --tb=short
```

## Best Practices

### 1. Test Isolation
- Each test is independent
- Mock external dependencies
- Clean up after tests

### 2. Authentication Testing
- Test both success and failure cases
- Test different user roles
- Test missing authentication

### 3. Error Handling
- Test HTTP status codes
- Test error messages
- Test exception scenarios

### 4. Mock Management
- Use appropriate mock scopes
- Reset mocks between tests
- Verify mock calls when needed

## Troubleshooting

### Common Issues
1. **Import Errors**: Ensure all dependencies are installed
2. **Mock Failures**: Check mock patch paths
3. **Authentication Errors**: Verify mock user data structure
4. **Database Errors**: Ensure database mocks are properly configured

### Debug Tips
```bash
# Run with verbose output
pytest tests/ -v -s

# Run specific test
pytest tests/test_jwt_auth.py::TestJWTAuthentication::test_get_current_user_valid_token -v

# Run with pdb debugger
pytest tests/ --pdb
```
