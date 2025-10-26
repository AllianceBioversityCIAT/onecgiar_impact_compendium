# Impact Compendium Backend Architecture

## Overview

The Impact Compendium Backend is a FastAPI-based REST API that manages research impact studies for CGIAR. It provides comprehensive CRUD operations, reference data management, and reporting capabilities with a focus on agricultural research impact assessment.

## Architecture Principles

- **Clean Architecture**: Separation of concerns with distinct layers
- **RESTful Design**: Standard HTTP methods and status codes
- **Database-First**: MySQL RDS as the single source of truth
- **Scalable**: Designed for AWS Lambda deployment
- **Secure**: JWT authentication and input validation

## Technology Stack

- **Framework**: FastAPI 0.104.1
- **Database**: MySQL (AWS RDS)
- **ORM**: SQLAlchemy 2.0.23
- **Authentication**: JWT with AWS Cognito
- **Deployment**: AWS Lambda with Mangum
- **Migration**: Alembic
- **Testing**: Pytest

## Project Structure

```
Backend/
├── app/                          # Main application package
│   ├── main.py                   # FastAPI application entry point
│   ├── routers/                  # API route handlers
│   │   ├── studies.py           # Core studies CRUD operations
│   │   ├── clarisa.py           # CLARISA reference data
│   │   ├── reference.py         # General reference data
│   │   ├── indicators.py        # Study indicators management
│   │   ├── auth.py              # Authentication endpoints
│   │   ├── admin.py             # Administrative functions
│   │   ├── reports.py           # Reporting and analytics
│   │   └── study_relations.py   # Study relationship management
│   ├── models/                   # SQLAlchemy database models
│   │   ├── associations.py      # Many-to-many relationship tables
│   │   ├── clarisa_*.py         # CLARISA reference data models
│   │   ├── studies_*.py         # Study-related junction tables
│   │   └── *.py                 # Individual entity models
│   ├── schemas/                  # Pydantic request/response models
│   │   ├── study.py             # Study-related schemas
│   │   ├── user.py              # User authentication schemas
│   │   ├── indicator.py         # Indicator schemas
│   │   └── pagination.py        # Pagination schemas
│   ├── services/                 # Business logic layer
│   │   ├── auth_service.py      # Authentication business logic
│   │   ├── cognito_auth.py      # AWS Cognito integration
│   │   └── studies_service.py   # Studies business logic
│   ├── db/                       # Database configuration
│   │   └── connection.py        # Database connection management
│   ├── config/                   # Application configuration
│   │   ├── settings.py          # Environment settings
│   │   └── database.py          # Database configuration
│   ├── middleware/               # Custom middleware
│   │   └── auth.py              # Authentication middleware
│   └── utils/                    # Utility functions
│       ├── logging.py           # Logging configuration
│       ├── pagination.py        # Pagination utilities
│       └── filters.py           # Query filtering utilities
├── tests/                        # Test suite
│   └── test_models.py           # Model unit tests
├── alembic/                      # Database migrations
│   ├── versions/                # Migration files
│   └── env.py                   # Alembic configuration
├── requirements.txt              # Python dependencies
├── .env                         # Environment variables
├── create_db.py                 # Database initialization script
└── alembic.ini                  # Alembic configuration
```

## Core Components

### 1. API Layer (Routers)

**Purpose**: Handle HTTP requests and responses, input validation, and route organization.

**Key Files**:
- `studies.py`: Main studies CRUD operations with comprehensive relationship handling
- `clarisa.py`: CLARISA reference data endpoints
- `auth.py`: Authentication and authorization endpoints

**Responsibilities**:
- Request/response handling
- Input validation via Pydantic schemas
- HTTP status code management
- Error handling and logging

### 2. Data Layer (Models)

**Purpose**: Define database schema and relationships using SQLAlchemy ORM.

**Key Patterns**:
- **Entity Models**: Core business entities (studies, users, indicators)
- **Junction Tables**: Many-to-many relationships (studies_contributors, studies_impact_areas)
- **Reference Data**: CLARISA integration models for standardized data

**Relationships**:
- Studies have many-to-many relationships with impact areas, countries, regions
- Foreign key constraints ensure data integrity
- Soft deletes using `is_active` flags

### 3. Business Logic Layer (Services)

**Purpose**: Implement business rules and complex operations.

**Key Services**:
- `studies_service.py`: Study management business logic
- `auth_service.py`: Authentication and authorization logic
- `cognito_auth.py`: AWS Cognito integration

### 4. Database Layer

**Purpose**: Manage database connections and transactions.

**Features**:
- Connection pooling for performance
- Automatic retry and reconnection
- Transaction management
- Environment-based configuration

## Data Flow

### Request Processing Flow

```
1. HTTP Request → FastAPI Router
2. Router → Pydantic Schema Validation
3. Router → Service Layer (Business Logic)
4. Service → Database Layer (SQLAlchemy)
5. Database → MySQL RDS
6. Response ← Formatted JSON
```

### Study Creation Flow

```
1. POST /api/studies/complete
2. Validate StudyCompleteRequest schema
3. Extract user from JWT token
4. Begin database transaction
5. Create main study record
6. Handle foreign key constraints (categories, intervention types)
7. Create relationship records (contributors, countries, regions, etc.)
8. Commit transaction or rollback on error
9. Return success/error response
```

## Database Design

### Core Entities

- **studies**: Main study records with metadata
- **studies_categories**: Study classification
- **intervention_types**: Types of interventions studied
- **studies_indicators**: Quantitative impact measurements

### Reference Data (CLARISA Integration)

- **clarisa_countries**: Standardized country data
- **clarisa_impacts_areas**: CGIAR impact areas
- **clarisa_initiatives**: CGIAR research initiatives
- **clarisa_centers**: CGIAR research centers

### Junction Tables

- **studies_contributors**: Links studies to initiatives/centers
- **studies_impact_areas**: Links studies to impact areas
- **studies_countries**: Links studies to countries
- **studies_regions**: Links studies to geographical regions

## Security Architecture

### Authentication Flow

1. User authenticates via AWS Cognito
2. Cognito returns JWT token
3. Token included in Authorization header
4. Middleware validates token on protected routes
5. User context extracted for audit logging

### Authorization Levels

- **Public**: Health check, documentation
- **Authenticated**: Study viewing, reference data
- **Admin**: Study creation/modification, user management

## Deployment Architecture

### AWS Lambda Deployment

- **Handler**: Mangum ASGI adapter for Lambda
- **Environment**: Environment variables for configuration
- **Scaling**: Automatic scaling based on request volume
- **Monitoring**: CloudWatch logs and metrics

### Database Connection

- **RDS MySQL**: Primary database
- **Connection Pooling**: SQLAlchemy connection pool
- **SSL**: Encrypted connections to RDS
- **Backup**: Automated RDS backups

## Error Handling Strategy

### HTTP Error Responses

```json
{
  "error": "Descriptive error message",
  "status_code": 400,
  "path": "/api/studies/123"
}
```

### Database Error Handling

- **Foreign Key Violations**: Graceful handling with user-friendly messages
- **Connection Errors**: Automatic retry with exponential backoff
- **Transaction Rollback**: Automatic rollback on any error

## Performance Considerations

### Database Optimization

- **Indexes**: Strategic indexing on frequently queried columns
- **Query Optimization**: Efficient JOIN operations for relationships
- **Connection Pooling**: Reuse database connections

### API Performance

- **Pagination**: Limit result sets for large queries
- **Caching**: Response caching for reference data
- **Async Operations**: Non-blocking I/O operations

## Monitoring and Logging

### Logging Strategy

- **Request Logging**: All HTTP requests with timing
- **Error Logging**: Detailed error information with stack traces
- **Business Logic Logging**: Key business operations
- **Database Logging**: Query performance and errors

### Health Monitoring

- **Health Check Endpoint**: `/health` for load balancer checks
- **Database Health**: Connection status verification
- **Service Dependencies**: External service availability

## Development Guidelines

### Code Organization

- **Single Responsibility**: Each module has a clear purpose
- **Dependency Injection**: Use FastAPI's dependency system
- **Type Hints**: Full type annotation for better IDE support
- **Documentation**: Comprehensive docstrings and comments

### Testing Strategy

- **Unit Tests**: Individual component testing
- **Integration Tests**: Database and API testing
- **Mock Data**: Consistent test data sets
- **Coverage**: Aim for >80% code coverage

## Future Enhancements

### Planned Features

- **GraphQL API**: Alternative query interface
- **Real-time Updates**: WebSocket support for live data
- **Advanced Analytics**: Machine learning integration
- **Multi-tenant Support**: Organization-based data isolation

### Scalability Improvements

- **Read Replicas**: Database read scaling
- **Caching Layer**: Redis for frequently accessed data
- **API Gateway**: Rate limiting and request routing
- **Microservices**: Service decomposition for specific domains
