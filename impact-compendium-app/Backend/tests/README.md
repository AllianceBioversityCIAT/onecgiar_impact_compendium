# Impact Compendium Backend Tests

## Overview

Comprehensive unit test suite for the Impact Compendium Backend API, focusing on the core studies CRUD operations. The tests use mocked database connections to ensure fast, reliable testing without requiring a live database.

## Test Structure

### Core Test Files

- **`test_studies_crud.py`** - Main test suite for studies CRUD operations
- **`conftest.py`** - Shared test fixtures and configuration
- **`test_models.py`** - Model unit tests (existing)

### Test Categories

1. **Unit Tests** - Fast, isolated tests with mocked dependencies
2. **Integration Tests** - Tests with actual database connections (marked with `@pytest.mark.integration`)
3. **Performance Tests** - Load and performance testing (marked with `@pytest.mark.performance`)

## Test Coverage

### ✅ GET /api/studies/ (List Studies)
- **Success Cases**:
  - Basic list retrieval with pagination
  - Search functionality with query parameters
  - Filtering by year range and category
  - Sorting by different fields
- **Error Cases**:
  - Database connection failures
  - Invalid query parameters
- **Edge Cases**:
  - Empty result sets
  - Large datasets with pagination

### ✅ GET /api/studies/{id} (Study Details)
- **Success Cases**:
  - Retrieve existing study with all relationships
  - Handle studies with minimal data
  - Proper data formatting and structure
- **Error Cases**:
  - Non-existent study (404)
  - Invalid ID format (400)
  - Database errors (500)
- **Edge Cases**:
  - Studies with no relationships
  - Studies with complex relationship data

### ✅ POST /api/studies/complete (Create Study)
- **Success Cases**:
  - Create complete study with all relationships
  - Create study with minimal required data
  - Proper ID mapping (frontend → database)
  - User tracking and audit logging
- **Error Cases**:
  - Validation errors (422)
  - Duplicate study ID conflicts
  - Foreign key constraint violations
  - Database transaction failures
- **Edge Cases**:
  - Large indicator datasets
  - Complex relationship combinations

### ✅ PUT /api/studies/{id}/complete (Update Study)
- **Success Cases**:
  - Update existing study with new data
  - Update relationships and indicators
  - Partial updates with unchanged fields
- **Error Cases**:
  - Update non-existent study (404)
  - Validation errors (422)
  - Database constraint violations
  - Transaction rollback scenarios
- **Edge Cases**:
  - Clearing existing relationships
  - Adding new relationships to existing study

### ✅ DELETE /api/studies/{id} (Delete Study)
- **Success Cases**:
  - Delete study with proper constraint handling
  - Clean up all related data
  - Handle complex foreign key relationships
- **Error Cases**:
  - Delete non-existent study (404)
  - Foreign key constraint violations
  - Database transaction failures
- **Edge Cases**:
  - Studies with extensive relationships
  - Circular reference handling

### ✅ GET /api/studies/check-id/{id} (Check Study ID)
- **Success Cases**:
  - Check existing study ID
  - Check non-existent study ID
- **Error Cases**:
  - Database connection failures
- **Edge Cases**:
  - Various ID formats

## Running Tests

### Prerequisites

```bash
# Install test dependencies
pip install pytest pytest-asyncio pytest-cov pytest-mock

# Or install all dependencies
pip install -r requirements.txt
```

### Test Commands

```bash
# Run all studies CRUD tests
python run_tests.py unit

# Run all tests
python run_tests.py all

# Run with coverage report
python run_tests.py coverage

# Run integration tests only
python run_tests.py integration

# Run performance tests only
python run_tests.py performance

# Run specific test class
pytest tests/test_studies_crud.py::TestGetStudies -v

# Run specific test method
pytest tests/test_studies_crud.py::TestGetStudies::test_get_studies_success -v
```

### Test Output Example

```
🧪 Running Impact Compendium Backend Tests
==================================================
Running unit tests...

tests/test_studies_crud.py::TestGetStudies::test_get_studies_success PASSED
tests/test_studies_crud.py::TestGetStudies::test_get_studies_with_search PASSED
tests/test_studies_crud.py::TestGetStudyDetails::test_get_study_details_success PASSED
tests/test_studies_crud.py::TestCreateStudy::test_create_study_success PASSED
tests/test_studies_crud.py::TestUpdateStudy::test_update_study_success PASSED
tests/test_studies_crud.py::TestDeleteStudy::test_delete_study_success PASSED

========================= 25 passed in 2.34s =========================
✅ Unit tests completed successfully!
```

## Test Architecture

### Mocking Strategy

The tests use comprehensive mocking to isolate the API layer from database dependencies:

```python
@pytest.fixture
def override_get_db(mock_db):
    """Override database dependency with mock"""
    def _override_get_db():
        yield mock_db
    
    app.dependency_overrides[get_db] = _override_get_db
    yield mock_db
    app.dependency_overrides.clear()
```

### Database Operation Mocking

```python
# Mock successful database query
mock_result = Mock()
mock_result.fetchall.return_value = [
    (99999, "Test Study", 2024, "Test summary", 31, None)
]
override_get_db.execute.return_value = mock_result
```

### Error Scenario Testing

```python
# Mock database error
override_get_db.execute.side_effect = Exception("Database connection failed")
```

## Test Data

### Sample Study Data

```python
SAMPLE_STUDY_DATA = {
    "studyId": 99999,
    "title": "Test Climate Smart Agriculture Study",
    "summary": "Test study for unit testing purposes",
    "year": 2024,
    "category": "1",
    "interventionType": "104",
    "countries": [1, 2],
    "indicators": [
        {
            "indicatorMeasure": "Test Yield Increase",
            "unitMeasure": "%",
            "resultReported": "30%"
        }
    ]
}
```

### Mock Response Data

```python
SAMPLE_STUDY_RESPONSE = {
    "study_id": 99999,
    "title": "Test Climate Smart Agriculture Study",
    "year": 2024,
    "category": {"id": 31, "name": "Impact Study"},
    "created_at": "2024-10-26T16:01:28"
}
```

## Test Scenarios

### Success Path Testing

1. **Happy Path**: All operations succeed with valid data
2. **Minimal Data**: Operations with minimum required fields
3. **Complex Data**: Operations with full relationship data
4. **Edge Cases**: Boundary conditions and special cases

### Error Path Testing

1. **Validation Errors**: Invalid input data
2. **Database Errors**: Connection failures, constraint violations
3. **Not Found Errors**: Operations on non-existent resources
4. **Conflict Errors**: Duplicate data, constraint conflicts

### Performance Testing

1. **Large Datasets**: Pagination with large result sets
2. **Complex Queries**: Multiple filters and relationships
3. **Concurrent Operations**: Multiple simultaneous requests

## Assertions and Validations

### Response Structure Validation

```python
# Verify response structure
assert response.status_code == 200
data = response.json()
assert data["success"] is True
assert "data" in data
assert "message" in data
```

### Data Integrity Validation

```python
# Verify study data
study = data["data"]
assert study["study_id"] == 99999
assert study["title"] == "Test Study"
assert study["category"]["name"] == "Impact Study"
```

### Database Operation Validation

```python
# Verify database calls
assert override_get_db.execute.called
assert override_get_db.commit.called
assert override_get_db.rollback.called  # For error cases
```

## Continuous Integration

### GitHub Actions Integration

```yaml
- name: Run Tests
  run: |
    pip install -r requirements.txt
    python run_tests.py all
    
- name: Generate Coverage Report
  run: |
    python run_tests.py coverage
    
- name: Upload Coverage
  uses: codecov/codecov-action@v1
```

### Pre-commit Hooks

```bash
# Install pre-commit hooks
pip install pre-commit
pre-commit install

# Run tests before commit
pre-commit run --all-files
```

## Test Maintenance

### Adding New Tests

1. **Create Test Class**: Group related tests in classes
2. **Use Fixtures**: Leverage shared fixtures for common data
3. **Mock Dependencies**: Isolate units under test
4. **Test Edge Cases**: Include boundary and error conditions
5. **Document Tests**: Clear test names and docstrings

### Test Data Management

1. **Consistent IDs**: Use consistent test IDs (99999 range)
2. **Realistic Data**: Use realistic but safe test data
3. **Fixtures**: Share common test data via fixtures
4. **Cleanup**: Ensure tests don't affect each other

### Performance Considerations

1. **Fast Tests**: Keep unit tests under 100ms each
2. **Parallel Execution**: Tests should be parallelizable
3. **Resource Cleanup**: Proper cleanup of mocks and fixtures
4. **Selective Running**: Use markers for different test types

## Troubleshooting

### Common Issues

1. **Import Errors**: Ensure PYTHONPATH includes app directory
2. **Mock Failures**: Verify mock setup matches actual code
3. **Async Issues**: Use pytest-asyncio for async tests
4. **Database Errors**: Check mock database setup

### Debug Tips

```bash
# Run with verbose output
pytest tests/test_studies_crud.py -v -s

# Run with pdb debugger
pytest tests/test_studies_crud.py --pdb

# Run specific failing test
pytest tests/test_studies_crud.py::TestCreateStudy::test_create_study_success -v -s
```

## Coverage Goals

- **Line Coverage**: > 90%
- **Branch Coverage**: > 85%
- **Function Coverage**: 100%
- **Critical Paths**: 100% (CRUD operations, error handling)

## Future Enhancements

1. **Integration Tests**: Tests with real database connections
2. **Load Testing**: Performance testing with realistic loads
3. **Contract Testing**: API contract validation
4. **Security Testing**: Authentication and authorization tests
5. **End-to-End Tests**: Full workflow testing
