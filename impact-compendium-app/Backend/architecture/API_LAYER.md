# API Layer Documentation

## Overview

The API layer consists of FastAPI routers that handle HTTP requests and responses. Each router is responsible for a specific domain of functionality and follows RESTful principles.

## Router Structure

### Studies Router (`app/routers/studies.py`)

**Purpose**: Core CRUD operations for research studies

**Key Endpoints**:

```python
GET    /api/studies/              # List studies with pagination and filtering
GET    /api/studies/{id}          # Get study details
POST   /api/studies/              # Create new study (basic)
POST   /api/studies/complete      # Create complete study with relationships
PUT    /api/studies/{id}          # Update study (basic)
PUT    /api/studies/{id}/complete # Update complete study with relationships
DELETE /api/studies/{id}          # Delete study and all relationships
GET    /api/studies/check-id/{id} # Check if study ID exists
```

**Key Features**:
- **Comprehensive CRUD**: Full create, read, update, delete operations
- **Relationship Management**: Handles complex many-to-many relationships
- **Foreign Key Handling**: Proper constraint management for RDS
- **User Tracking**: Audit trail with user information
- **Error Handling**: Graceful handling of database constraints

**Request/Response Examples**:

```python
# Create Complete Study Request
{
  "studyId": 12345,
  "title": "Climate Smart Agriculture Impact",
  "summary": "Study on climate adaptation strategies",
  "year": 2024,
  "category": "1",  # Maps to database ID 31
  "interventionType": "104",
  "countries": [1, 2, 3],
  "regions": [1],
  "contributingInitiatives": [101, 102],
  "indicators": [
    {
      "indicatorMeasure": "Yield Increase",
      "unitMeasure": "%",
      "resultReported": "25%"
    }
  ]
}
```

### CLARISA Router (`app/routers/clarisa.py`)

**Purpose**: CLARISA reference data integration

**Key Endpoints**:
```python
GET /api/clarisa/countries        # Get all countries
GET /api/clarisa/regions          # Get all regions  
GET /api/clarisa/impact-areas     # Get impact areas
GET /api/clarisa/initiatives      # Get CGIAR initiatives
GET /api/clarisa/centers          # Get CGIAR centers
```

**Features**:
- **Standardized Data**: CGIAR-standard reference data
- **Caching**: Efficient data retrieval
- **Filtering**: Active/inactive status filtering

### Reference Router (`app/routers/reference.py`)

**Purpose**: General reference data management

**Key Endpoints**:
```python
GET /api/reference/categories     # Study categories
GET /api/reference/intervention-types  # Intervention types
GET /api/reference/keywords       # Available keywords
GET /api/reference/crop-types     # Crop classifications
```

### Authentication Router (`app/routers/auth.py`)

**Purpose**: User authentication and authorization

**Key Endpoints**:
```python
POST /api/auth/login             # User login
POST /api/auth/refresh           # Token refresh
POST /api/auth/logout            # User logout
GET  /api/auth/profile           # User profile
```

**Features**:
- **JWT Tokens**: Secure token-based authentication
- **AWS Cognito**: Integration with AWS Cognito User Pools
- **Role-based Access**: Different permission levels

## Request Processing Pattern

### Standard Flow

```python
@router.post("/endpoint")
async def endpoint_handler(
    request_data: RequestSchema,      # 1. Pydantic validation
    request: Request,                 # 2. FastAPI request object
    db: Session = Depends(get_db)     # 3. Database dependency injection
):
    """
    Standard endpoint pattern with:
    - Input validation via Pydantic schemas
    - Database session management
    - Error handling and logging
    - Consistent response format
    """
    
    # 4. Extract user context
    current_user = get_current_user_from_request(request)
    
    # 5. Business logic execution
    try:
        # Database operations
        result = perform_database_operations(db, request_data)
        
        # 6. Success response
        return {
            "success": True,
            "message": "Operation completed successfully",
            "data": result
        }
        
    except Exception as e:
        # 7. Error handling
        logger.error(f"Operation failed: {e}")
        raise HTTPException(status_code=500, detail=str(e))
```

### Error Response Format

```python
# HTTP Exception Response
{
  "error": "Descriptive error message",
  "status_code": 400,
  "path": "/api/studies/123"
}

# Success Response Format  
{
  "success": true,
  "message": "Operation completed successfully",
  "data": { ... }
}
```

## Input Validation

### Pydantic Schemas

**StudyCompleteRequest Schema**:
```python
class StudyCompleteRequest(BaseModel):
    # Step 1: Basic study information
    studyId: int
    title: str
    summary: Optional[str] = None
    year: int
    doi: Optional[str] = None
    category: str                    # Frontend ID (1-5)
    periodStart: str
    periodEnd: str
    interventionType: str
    interventionDetails: Optional[str] = None
    
    # Step 2: Relationships
    primaryCGIARImpactArea: Union[str, int]
    secondaryCGIARImpactAreas: List[Union[str, int]] = []
    countries: List[Union[str, int]] = []
    regions: List[Union[str, int]] = []
    cropProductType: List[Union[str, int]] = []
    keywords: List[Union[str, int]] = []
    contributingInitiatives: List[Union[str, int]] = []
    contributingCenters: List[Union[str, int]] = []
    
    # Step 3: Indicators
    indicators: List[Dict[str, Any]] = []
    
    # Audit fields
    created_by: Optional[str] = None
```

### Validation Features

- **Type Checking**: Automatic type validation
- **Required Fields**: Mandatory field enforcement
- **Optional Fields**: Default value handling
- **Custom Validators**: Business rule validation
- **Error Messages**: User-friendly validation errors

## Database Integration

### Connection Management

```python
# Database dependency injection
def get_db() -> Generator[Optional[Session], None, None]:
    """FastAPI dependency for database sessions with error handling"""
    yield from db_connection.get_session()
```

### Transaction Handling

```python
# Transaction pattern in routers
try:
    # Multiple database operations
    db.execute(query1)
    db.execute(query2)
    db.execute(query3)
    
    # Commit all changes
    db.commit()
    
    return success_response
    
except Exception as e:
    # Rollback on any error
    db.rollback()
    logger.error(f"Transaction failed: {e}")
    raise HTTPException(status_code=500, detail=str(e))
```

## Foreign Key Constraint Handling

### Challenge

The RDS database has complex foreign key relationships that require careful handling during CRUD operations.

### Solution Pattern

```python
# Delete operation with proper constraint handling
def delete_study_with_constraints(db: Session, study_id: int):
    """
    Delete study with proper foreign key constraint handling
    """
    
    # 1. Get junction table IDs that might be referenced
    junction_result = db.execute(
        text("SELECT study_intervention_type_id FROM studies_internvetion_types WHERE study_id = :study_id"),
        {"study_id": study_id}
    )
    junction_ids = [row[0] for row in junction_result]
    
    # 2. Clear ALL references to these junction IDs from ALL studies
    for junction_id in junction_ids:
        db.execute(
            text("UPDATE studies SET study_intervention_types_intervention_type_id = NULL WHERE study_intervention_types_intervention_type_id = :junction_id"),
            {"junction_id": junction_id}
        )
    
    # 3. Delete relationship records in correct order
    relationship_tables = [
        ("studies_contributors", "study_id"),
        ("studies_countries", "study_id"),
        ("studies_regions", "study_id"),
        ("studies_impact_areas", "studies_study_id"),
        ("studies_keywords", "study_id"),
        ("studies_crop_types", "study_id"),
        ("studies_indicators", "study_id")
    ]
    
    for table_name, column_name in relationship_tables:
        db.execute(
            text(f"DELETE FROM {table_name} WHERE {column_name} = :study_id"),
            {"study_id": study_id}
        )
    
    # 4. Delete junction table records
    db.execute(
        text("DELETE FROM studies_internvetion_types WHERE study_id = :study_id"),
        {"study_id": study_id}
    )
    
    # 5. Finally delete the main study record
    result = db.execute(
        text("DELETE FROM studies WHERE study_id = :study_id"),
        {"study_id": study_id}
    )
    
    return result.rowcount > 0
```

## User Context and Security

### User Extraction

```python
def get_current_user_from_request(request: Request) -> str:
    """
    Extract current user from request headers or authentication
    Supports multiple authentication methods for flexibility
    """
    
    # Try Authorization header (JWT token)
    auth_header = request.headers.get("authorization", "")
    if auth_header:
        # In production: decode JWT token to get user info
        user_email = request.headers.get("x-user-email", "")
        if user_email:
            return user_email
    
    # Try cookies
    user_cookie = request.cookies.get("user_email", "")
    if user_cookie:
        return user_cookie
    
    # Fallback for development
    return "system"
```

### Audit Logging

```python
# User tracking in database operations
db.execute(study_insert, {
    "study_id": study_data.studyId,
    "title": study_data.title,
    "created_by": current_user,  # Track who created the record
    "created_at": "NOW()"
})
```

## Response Formatting

### Pagination Response

```python
{
  "success": true,
  "data": [...],
  "total": 150,
  "pagination": {
    "total": 150,
    "count": 25,
    "page": 1,
    "pageSize": 25,
    "totalPages": 6
  }
}
```

### Study Detail Response

```python
{
  "success": true,
  "data": {
    "study_id": 12345,
    "title": "Climate Smart Agriculture Impact",
    "summary": "Study on climate adaptation strategies",
    "year": 2024,
    "category": {"id": 31, "name": "Impact Study"},
    "intervention": {
      "id": 104,
      "name": "Climate Smart Agriculture",
      "detailsShort": "Implementation of climate adaptation practices"
    },
    "countries": [
      {"id": 1, "name": "Kenya"},
      {"id": 2, "name": "Ethiopia"}
    ],
    "indicators": [
      {
        "indicator_measure": "Yield Increase",
        "unit_measure": "%",
        "result_reported": "25%"
      }
    ],
    "created_at": "2024-10-26T16:01:28",
    "last_updated_date": "2024-10-26T16:01:28"
  }
}
```

## Performance Optimization

### Query Optimization

- **Selective Loading**: Only load required fields
- **JOIN Optimization**: Efficient relationship queries
- **Pagination**: Limit result sets with OFFSET/LIMIT
- **Indexing**: Strategic database indexes

### Caching Strategy

- **Reference Data**: Cache frequently accessed lookup data
- **Response Caching**: Cache expensive query results
- **Connection Pooling**: Reuse database connections

## Testing Approach

### Unit Testing

```python
def test_create_study():
    """Test study creation endpoint"""
    response = client.post("/api/studies/", json=test_study_data)
    assert response.status_code == 200
    assert response.json()["success"] is True
```

### Integration Testing

```python
def test_study_with_relationships():
    """Test complete study creation with relationships"""
    response = client.post("/api/studies/complete", json=complete_study_data)
    assert response.status_code == 200
    
    # Verify relationships were created
    study_id = response.json()["data"]["study_id"]
    detail_response = client.get(f"/api/studies/{study_id}")
    assert len(detail_response.json()["data"]["countries"]) > 0
```
