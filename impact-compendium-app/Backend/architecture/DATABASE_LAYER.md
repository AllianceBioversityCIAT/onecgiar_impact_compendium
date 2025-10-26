# Database Layer Documentation

## Overview

The database layer manages all data persistence using SQLAlchemy ORM with MySQL RDS as the backend. It provides connection management, transaction handling, and data modeling for the Impact Compendium application.

## Database Architecture

### Connection Management (`app/db/connection.py`)

**Purpose**: Centralized database connection handling with pooling and error recovery.

```python
class DatabaseConnection:
    """
    Database connection manager with:
    - Connection pooling for performance
    - Automatic retry and reconnection
    - Environment-based configuration
    - Session lifecycle management
    """
    
    def __init__(self):
        self._engine: Optional[Engine] = None
        self._session_factory = None
    
    def _create_engine(self) -> Engine:
        """Create SQLAlchemy engine with optimized settings"""
        database_url = f"mysql+pymysql://{db_user}:{db_password}@{db_host}:{db_port}/{db_name}"
        
        return create_engine(
            database_url,
            poolclass=QueuePool,      # Connection pooling
            pool_size=5,              # Base pool size
            max_overflow=10,          # Additional connections
            pool_pre_ping=True,       # Validate connections
            pool_recycle=3600,        # Recycle after 1 hour
            echo=False                # SQL logging (dev only)
        )
```

**Key Features**:
- **Connection Pooling**: Efficient connection reuse
- **Health Checks**: Pre-ping validation
- **Auto-Recovery**: Automatic reconnection on failure
- **Configuration**: Environment-based settings

### Session Management

```python
def get_db() -> Generator[Optional[Session], None, None]:
    """
    FastAPI dependency for database sessions
    Provides automatic session cleanup and error handling
    """
    session_factory = db_connection.get_session_factory()
    if not session_factory:
        yield None
        return
        
    session = session_factory()
    try:
        yield session
    except Exception as e:
        logger.warning(f"Database session error: {e}")
        session.rollback()
        yield None
    finally:
        session.close()
```

## Data Models

### Core Entity Models

#### Studies Model

**Purpose**: Main entity representing research impact studies

```python
# Conceptual model structure (actual implementation in app/models/)
class Study(Base):
    """
    Core study entity with comprehensive metadata
    """
    __tablename__ = "studies"
    
    # Primary identification
    study_id = Column(Integer, primary_key=True)
    title = Column(String(500), nullable=False)
    summary = Column(Text)
    year = Column(Integer)
    
    # Study period
    period_start = Column(Date)
    period_end = Column(Date)
    
    # Classification
    category_id = Column(Integer, ForeignKey("studies_categories.study_category_id"))
    study_intervention_types_intervention_type_id = Column(Integer, ForeignKey("studies_internvetion_types.study_intervention_type_id"))
    
    # Additional metadata
    doi = Column(String(255))
    intervention_details = Column(Text)
    pdf_filename = Column(String(255))
    
    # Audit fields
    is_active = Column(Boolean, default=True)
    created_at = Column(DateTime, default=func.now())
    created_by = Column(String(255))
    last_updated_date = Column(DateTime, onupdate=func.now())
    last_updated_by = Column(String(255))
```

**Key Relationships**:
- **Category**: Many-to-one with studies_categories
- **Intervention Type**: Many-to-one with intervention_types (via junction table)
- **Contributors**: Many-to-many with initiatives and centers
- **Geographic**: Many-to-many with countries and regions
- **Impact Areas**: Many-to-many with CLARISA impact areas
- **Indicators**: One-to-many with studies_indicators

### Reference Data Models

#### CLARISA Integration Models

**Purpose**: Standardized CGIAR reference data integration

```python
# CLARISA Countries
class ClarisaCountry(Base):
    """Standardized country data from CLARISA"""
    __tablename__ = "clarisa_countries"
    
    country_id = Column(Integer, primary_key=True)
    country_name = Column(String(255), nullable=False)
    iso_alpha_2 = Column(String(2))
    iso_alpha_3 = Column(String(3))
    is_active = Column(Boolean, default=True)

# CLARISA Impact Areas  
class ClarisaImpactArea(Base):
    """CGIAR impact areas from CLARISA"""
    __tablename__ = "clarisa_impacts_areas"
    
    impact_area_id = Column(Integer, primary_key=True)
    name = Column(String(255), nullable=False)
    description = Column(Text)
    is_active = Column(Boolean, default=True)

# CLARISA Initiatives
class ClarisaInitiative(Base):
    """CGIAR research initiatives from CLARISA"""
    __tablename__ = "clarisa_initiatives"
    
    initiative_id = Column(Integer, primary_key=True)
    name = Column(String(255), nullable=False)
    acronym = Column(String(50))
    is_active = Column(Boolean, default=True)
```

### Junction Table Models

**Purpose**: Handle many-to-many relationships between studies and reference data

```python
# Study Contributors (Initiatives and Centers)
class StudyContributor(Base):
    """Links studies to contributing initiatives and centers"""
    __tablename__ = "studies_contributors"
    
    id = Column(Integer, primary_key=True)
    study_id = Column(Integer, ForeignKey("studies.study_id"), nullable=False)
    clarisa_initiatives_initiative_id = Column(Integer, ForeignKey("clarisa_initiatives.initiative_id"))
    clarisa_centers_center_id = Column(Integer, ForeignKey("clarisa_centers.center_id"))

# Study Impact Areas
class StudyImpactArea(Base):
    """Links studies to CGIAR impact areas"""
    __tablename__ = "studies_impact_areas"
    
    id = Column(Integer, primary_key=True)
    studies_study_id = Column(Integer, ForeignKey("studies.study_id"), nullable=False)
    clarisa_impacts_areas_impact_area_id = Column(Integer, ForeignKey("clarisa_impacts_areas.impact_area_id"), nullable=False)

# Study Countries
class StudyCountry(Base):
    """Links studies to countries"""
    __tablename__ = "studies_countries"
    
    id = Column(Integer, primary_key=True)
    study_id = Column(Integer, ForeignKey("studies.study_id"), nullable=False)
    country_id = Column(Integer, ForeignKey("clarisa_countries.country_id"), nullable=False)
```

## Database Schema Design

### Entity Relationship Overview

```
studies (1) ←→ (M) studies_contributors ←→ (M) clarisa_initiatives
studies (1) ←→ (M) studies_contributors ←→ (M) clarisa_centers
studies (1) ←→ (M) studies_impact_areas ←→ (M) clarisa_impacts_areas
studies (1) ←→ (M) studies_countries ←→ (M) clarisa_countries
studies (1) ←→ (M) studies_regions ←→ (M) clarisa_cgiar_regions
studies (1) ←→ (M) studies_keywords ←→ (M) keywords
studies (1) ←→ (M) studies_crop_types ←→ (M) crop_types
studies (1) ←→ (M) studies_indicators
studies (M) ←→ (1) studies_categories
studies (M) ←→ (1) intervention_types (via junction table)
```

### Foreign Key Constraints

**Challenge**: Complex foreign key relationships require careful handling during CRUD operations.

**Key Constraints**:
1. **studies.category_id** → studies_categories.study_category_id
2. **studies.study_intervention_types_intervention_type_id** → studies_internvetion_types.study_intervention_type_id
3. **studies_internvetion_types.intervention_type_id** → intervention_types.intervention_type_id
4. **studies_contributors.study_id** → studies.study_id

**Constraint Handling Strategy**:
```python
# Deletion order to avoid constraint violations
def delete_study_safely(db: Session, study_id: int):
    """
    Safe study deletion with proper constraint handling
    """
    
    # 1. Clear foreign key references first
    junction_ids = get_junction_ids(db, study_id)
    clear_all_references_to_junction_ids(db, junction_ids)
    
    # 2. Delete relationship records
    delete_relationship_records(db, study_id)
    
    # 3. Delete junction table records
    delete_junction_records(db, study_id)
    
    # 4. Finally delete main study record
    delete_main_study(db, study_id)
```

## Data Mapping and Transformations

### Frontend to Database ID Mapping

**Challenge**: Frontend uses simple IDs (1-5) while database uses different ID ranges.

**Solution**: Mapping dictionaries for consistent data transformation.

```python
# Category mapping: Frontend ID → Database ID
CATEGORY_MAPPING = {
    "1": 31,  # Impact Study
    "2": 32,  # Impact/Outcome Story  
    "3": 33,  # Other
    "4": 34,  # Outcome Study
    "5": 35   # Synthesis Study
}

# Region mapping: Frontend ID → Database ID
REGION_MAPPING = {
    "1": 55   # Global → Valid DB region ID
}

# Impact area mapping: Frontend ID → Database ID
IMPACT_AREA_MAPPING = {
    "1": 31   # Default impact area
}

# Crop type mapping: Frontend ID → Database ID
CROP_MAPPING = {
    "1": 736  # All/Not Specific
}
```

**Usage in Data Operations**:
```python
def map_frontend_to_database_ids(frontend_data):
    """Transform frontend IDs to database IDs"""
    
    # Map category
    db_category_id = CATEGORY_MAPPING.get(str(frontend_data.category), 31)
    
    # Map regions
    db_region_ids = []
    for region_id in frontend_data.regions:
        db_region_id = REGION_MAPPING.get(str(region_id), int(region_id))
        db_region_ids.append(db_region_id)
    
    return {
        "category_id": db_category_id,
        "region_ids": db_region_ids
    }
```

## Query Patterns

### Complex Relationship Queries

**Study Detail with All Relationships**:
```sql
-- Get study with all related data
SELECT 
    s.study_id, s.title, s.year, s.summary,
    sc.name as category_name,
    it.name as intervention_type_name
FROM studies s
LEFT JOIN studies_categories sc ON s.category_id = sc.study_category_id
LEFT JOIN intervention_types it ON s.study_intervention_types_intervention_type_id = it.intervention_type_id
WHERE s.study_id = ? AND s.is_active = 1;

-- Get study countries
SELECT sc.country_id, cc.country_name 
FROM studies_countries sc
JOIN clarisa_countries cc ON sc.country_id = cc.country_id
WHERE sc.study_id = ? AND cc.is_active = 1;

-- Get study impact areas
SELECT sia.clarisa_impacts_areas_impact_area_id, cia.name 
FROM studies_impact_areas sia
JOIN clarisa_impacts_areas cia ON sia.clarisa_impacts_areas_impact_area_id = cia.impact_area_id
WHERE sia.studies_study_id = ? AND cia.is_active = 1;
```

### Pagination and Filtering

```sql
-- Paginated study list with search and filters
SELECT s.study_id, s.title, s.year, s.summary, s.category_id, s.doi
FROM studies s
WHERE s.is_active = 1
  AND (s.title LIKE ? OR s.summary LIKE ?)  -- Search
  AND s.year >= ?                           -- Year filter
  AND s.year <= ?                           -- Year filter
ORDER BY s.study_id DESC                    -- Latest first
LIMIT ? OFFSET ?;                           -- Pagination
```

### Aggregation Queries

```sql
-- Study count by category
SELECT sc.name, COUNT(s.study_id) as study_count
FROM studies_categories sc
LEFT JOIN studies s ON sc.study_category_id = s.category_id AND s.is_active = 1
WHERE sc.is_active = 1
GROUP BY sc.study_category_id, sc.name
ORDER BY study_count DESC;

-- Studies by year
SELECT s.year, COUNT(*) as count
FROM studies s
WHERE s.is_active = 1 AND s.year IS NOT NULL
GROUP BY s.year
ORDER BY s.year DESC;
```

## Transaction Management

### ACID Compliance

**Atomicity**: All operations in a transaction succeed or fail together
**Consistency**: Database constraints are maintained
**Isolation**: Concurrent transactions don't interfere
**Durability**: Committed changes are permanent

### Transaction Patterns

```python
# Standard transaction pattern
def create_study_with_relationships(db: Session, study_data):
    """
    Create study with all relationships in a single transaction
    """
    try:
        # 1. Create main study record
        study_result = db.execute(study_insert_query, study_params)
        
        # 2. Create relationship records
        for country_id in study_data.countries:
            db.execute(country_insert_query, {"study_id": study_id, "country_id": country_id})
        
        for impact_area_id in study_data.impact_areas:
            db.execute(impact_area_insert_query, {"study_id": study_id, "impact_area_id": impact_area_id})
        
        # 3. Create indicators
        for indicator in study_data.indicators:
            db.execute(indicator_insert_query, indicator_params)
        
        # 4. Commit all changes
        db.commit()
        
        return {"success": True, "study_id": study_id}
        
    except Exception as e:
        # 5. Rollback on any error
        db.rollback()
        logger.error(f"Transaction failed: {e}")
        raise
```

## Performance Optimization

### Database Indexes

**Strategic Indexing**:
```sql
-- Primary indexes for frequent queries
CREATE INDEX idx_studies_active ON studies(is_active);
CREATE INDEX idx_studies_year ON studies(year);
CREATE INDEX idx_studies_category ON studies(category_id);
CREATE INDEX idx_studies_title ON studies(title);

-- Composite indexes for complex queries
CREATE INDEX idx_studies_active_year ON studies(is_active, year);
CREATE INDEX idx_studies_search ON studies(is_active, title, summary);

-- Foreign key indexes for JOIN performance
CREATE INDEX idx_study_countries_study ON studies_countries(study_id);
CREATE INDEX idx_study_countries_country ON studies_countries(country_id);
CREATE INDEX idx_study_impact_areas_study ON studies_impact_areas(studies_study_id);
```

### Query Optimization

**Efficient JOIN Operations**:
```python
# Optimized query with selective loading
def get_study_with_relationships(db: Session, study_id: int):
    """
    Efficient study loading with minimal queries
    """
    
    # 1. Main study data
    study_query = text("""
        SELECT study_id, title, year, summary, category_id, doi, 
               study_intervention_types_intervention_type_id
        FROM studies 
        WHERE study_id = :study_id AND is_active = 1
    """)
    
    # 2. Batch load relationships
    relationships = {
        "countries": load_study_countries(db, study_id),
        "impact_areas": load_study_impact_areas(db, study_id),
        "indicators": load_study_indicators(db, study_id)
    }
    
    return combine_study_data(study_data, relationships)
```

### Connection Pool Optimization

```python
# Optimized connection pool settings
engine = create_engine(
    database_url,
    poolclass=QueuePool,
    pool_size=5,              # Base connections
    max_overflow=10,          # Additional connections under load
    pool_pre_ping=True,       # Validate connections before use
    pool_recycle=3600,        # Recycle connections every hour
    pool_timeout=30,          # Wait time for connection
    echo=False                # Disable SQL logging in production
)
```

## Error Handling and Recovery

### Connection Error Recovery

```python
def execute_with_retry(db: Session, query, params, max_retries=3):
    """
    Execute query with automatic retry on connection errors
    """
    for attempt in range(max_retries):
        try:
            return db.execute(query, params)
        except (ConnectionError, TimeoutError) as e:
            if attempt == max_retries - 1:
                raise
            logger.warning(f"Database connection error, retrying... ({attempt + 1}/{max_retries})")
            time.sleep(2 ** attempt)  # Exponential backoff
```

### Constraint Violation Handling

```python
def handle_foreign_key_error(error):
    """
    Convert database constraint errors to user-friendly messages
    """
    error_message = str(error)
    
    if "fk_contrib_study" in error_message:
        return "Cannot delete study: has associated contributors"
    elif "fk_studies_intervention_type" in error_message:
        return "Cannot delete: intervention type is referenced by studies"
    else:
        return "Database constraint violation"
```

## Data Migration and Versioning

### Alembic Integration

**Migration Management**:
```python
# alembic/env.py configuration
def run_migrations_online():
    """Run migrations in 'online' mode with proper configuration"""
    
    configuration = config.get_section(config.config_ini_section)
    configuration["sqlalchemy.url"] = get_database_url()
    
    connectable = engine_from_config(
        configuration,
        prefix="sqlalchemy.",
        poolclass=pool.NullPool,
    )
    
    with connectable.connect() as connection:
        context.configure(
            connection=connection,
            target_metadata=target_metadata,
            compare_type=True,
            compare_server_default=True
        )
        
        with context.begin_transaction():
            context.run_migrations()
```

**Migration Best Practices**:
- **Backward Compatibility**: Ensure migrations can be rolled back
- **Data Preservation**: Never lose existing data
- **Index Management**: Add/remove indexes efficiently
- **Constraint Handling**: Manage foreign key constraints carefully

## Monitoring and Diagnostics

### Query Performance Monitoring

```python
# Query timing decorator
def log_query_performance(func):
    """Log slow queries for performance monitoring"""
    def wrapper(*args, **kwargs):
        start_time = time.time()
        result = func(*args, **kwargs)
        execution_time = time.time() - start_time
        
        if execution_time > 1.0:  # Log queries > 1 second
            logger.warning(f"Slow query detected: {func.__name__} took {execution_time:.2f}s")
        
        return result
    return wrapper
```

### Health Monitoring

```python
def check_database_health():
    """Comprehensive database health check"""
    try:
        engine = db_connection.get_engine()
        with engine.connect() as conn:
            # Test basic connectivity
            conn.execute(text("SELECT 1"))
            
            # Test table access
            conn.execute(text("SELECT COUNT(*) FROM studies LIMIT 1"))
            
            # Check connection pool status
            pool = engine.pool
            pool_status = {
                "size": pool.size(),
                "checked_in": pool.checkedin(),
                "checked_out": pool.checkedout(),
                "overflow": pool.overflow(),
                "invalid": pool.invalid()
            }
            
            return {
                "status": "healthy",
                "connection_pool": pool_status
            }
            
    except Exception as e:
        return {
            "status": "unhealthy",
            "error": str(e)
        }
```
