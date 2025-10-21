# RDS Integration Architecture

## Overview

This document describes the database integration architecture for the Impact Compendium application, detailing the connection between the FastAPI backend and the external MySQL RDS instance.

## Database Configuration

### External RDS Instance
- **Host**: `db-impact-compendium.c9s2e8cg81v6.us-east-2.rds.amazonaws.com`
- **Port**: `3306`
- **Database**: `database`
- **Engine**: MySQL 8.0
- **Region**: `us-east-2`

### Connection Details
- **Driver**: PyMySQL
- **Connection Pool**: SQLAlchemy QueuePool
- **Pool Size**: 5 connections
- **Max Overflow**: 10 connections
- **Pool Recycle**: 3600 seconds (1 hour)

## Architecture Components

### 1. Database Connection Layer (`app/db/connection.py`)

```python
# Key features:
- Singleton database connection manager
- Connection pooling with automatic retry
- Environment-based configuration
- Session management with automatic cleanup
```

**Connection String Format**:
```
mysql+pymysql://user:pass@db-impact-compendium.c9s2e8cg81v6.us-east-2.rds.amazonaws.com:3306/database
```

### 2. Model Layer

#### Core Models
- **Study**: Research impact studies with metadata
- **User**: Application users with CGIAR integration
- **Indicator**: Metrics and measurements
- **CLARISA Models**: Reference data from CGIAR systems

#### Association Tables
- **StudyContributor**: Many-to-many study contributors
- **StudyCountry**: Geographic associations
- **StudyIndicator**: Study metrics relationships
- **StudyKeyword**: Tagging system

### 3. Migration System (Alembic)

```bash
# Initialize migrations
alembic init alembic

# Create migration
alembic revision --autogenerate -m "Initial schema"

# Apply migrations
alembic upgrade head
```

**Configuration**:
- Auto-detection of model changes
- Environment-based database URLs
- Version control for schema changes

## Database Schema

### Primary Tables

```sql
-- Studies table
CREATE TABLE studies (
    id INT PRIMARY KEY AUTO_INCREMENT,
    title VARCHAR(500) NOT NULL,
    description TEXT,
    category_id INT,
    methodology TEXT,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    created_by INT,
    FOREIGN KEY (created_by) REFERENCES users(id),
    FOREIGN KEY (category_id) REFERENCES studies_categories(id)
);

-- Users table
CREATE TABLE users (
    id INT PRIMARY KEY AUTO_INCREMENT,
    email VARCHAR(255) UNIQUE NOT NULL,
    name VARCHAR(255) NOT NULL,
    role ENUM('admin', 'researcher', 'viewer') DEFAULT 'researcher',
    organization VARCHAR(255),
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);
```

### Reference Data Tables

```sql
-- CLARISA Centers
CREATE TABLE clarisa_centers (
    id INT PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    acronym VARCHAR(50),
    active BOOLEAN DEFAULT TRUE
);

-- CLARISA Countries
CREATE TABLE clarissa_countries (
    id INT PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    iso_alpha_2 VARCHAR(2),
    iso_alpha_3 VARCHAR(3)
);
```

## Environment Configuration

### Development Environment
```bash
# .env file
DB_HOST=db-impact-compendium.c9s2e8cg81v6.us-east-2.rds.amazonaws.com
DB_PORT=3306
DB_NAME=database
DB_USER=user
DB_PASSWORD=pass
DB_ECHO=false
ENVIRONMENT=dev
```

### Production Environment
```yaml
# Lambda environment variables
Environment:
  Variables:
    DB_HOST: db-impact-compendium.c9s2e8cg81v6.us-east-2.rds.amazonaws.com
    DB_PORT: 3306
    DB_NAME: database
    DB_USER: user
    DB_PASSWORD: pass
```

## Connection Management

### Session Lifecycle
1. **Request Start**: New session created from pool
2. **Request Processing**: Session used for all database operations
3. **Request End**: Session automatically closed and returned to pool
4. **Error Handling**: Automatic rollback on exceptions

### Connection Pooling
```python
engine = create_engine(
    database_url,
    poolclass=QueuePool,
    pool_size=5,           # Base pool size
    max_overflow=10,       # Additional connections
    pool_pre_ping=True,    # Validate connections
    pool_recycle=3600      # Recycle after 1 hour
)
```

## Security Considerations

### Connection Security
- SSL/TLS encryption in transit
- VPC security groups (when deployed in VPC)
- IAM database authentication (future enhancement)
- Secrets Manager integration (future enhancement)

### Access Control
- Database-level user permissions
- Application-level role-based access
- Audit logging for sensitive operations

## Performance Optimization

### Connection Pooling
- Reuse database connections
- Automatic connection validation
- Connection recycling to prevent stale connections

### Query Optimization
- SQLAlchemy ORM with lazy loading
- Indexed columns for frequent queries
- Relationship loading strategies

### Monitoring
- Connection pool metrics
- Query performance logging
- Error rate monitoring

## Deployment Architecture

### Lambda Integration
```yaml
StudiesFunction:
  Type: AWS::Serverless::Function
  Properties:
    Environment:
      Variables:
        DB_HOST: db-impact-compendium.c9s2e8cg81v6.us-east-2.rds.amazonaws.com
        DB_PORT: 3306
        DB_NAME: database
```

### Network Configuration
- External RDS instance (us-east-2)
- Lambda functions with internet access
- No VPC configuration required for external database

## Testing Strategy

### Unit Tests
```python
# Database connection tests
def test_database_connection():
    engine = db_connection.get_engine()
    with engine.connect() as conn:
        result = conn.execute("SELECT 1")
        assert result.fetchone()[0] == 1
```

### Integration Tests
```python
# CRUD operation tests
def test_study_crud():
    session = next(db_connection.get_session())
    study = Study(title="Test Study")
    session.add(study)
    session.commit()
    assert study.id is not None
```

## Maintenance Procedures

### Database Migrations
1. Create migration: `alembic revision --autogenerate -m "description"`
2. Review generated migration
3. Test migration on development database
4. Apply to production: `alembic upgrade head`

### Backup Strategy
- RDS automated backups (external responsibility)
- Point-in-time recovery capability
- Cross-region backup replication (if required)

### Monitoring
- CloudWatch metrics for Lambda functions
- Database connection pool monitoring
- Error rate and latency tracking

## Troubleshooting

### Common Issues
1. **Connection Timeouts**: Check network connectivity and security groups
2. **Pool Exhaustion**: Monitor connection pool usage and adjust pool_size
3. **Migration Failures**: Review migration scripts and database state

### Debugging Tools
```python
# Enable SQL logging
DB_ECHO=true

# Connection pool status
engine.pool.status()

# Active connections
engine.pool.checkedout()
```

## Future Enhancements

### Security
- AWS Secrets Manager integration
- IAM database authentication
- VPC deployment with private subnets

### Performance
- Read replicas for query optimization
- Connection pooling optimization
- Query caching strategies

### Monitoring
- Enhanced CloudWatch metrics
- Custom dashboard for database health
- Automated alerting for connection issues

---

**Document Version**: 1.0  
**Last Updated**: October 21, 2025  
**Author**: Amazon Q - Sprint 4 Implementation
