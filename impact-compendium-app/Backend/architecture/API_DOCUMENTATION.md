# API Documentation

## Overview

The Impact Compendium API provides comprehensive REST endpoints for managing research impact studies, reference data, and user authentication. All endpoints follow RESTful conventions and return JSON responses.

**Base URL**: `https://your-api-gateway-url/api`

## Authentication

### JWT Token Authentication

Most endpoints require authentication via JWT tokens obtained from AWS Cognito.

**Headers Required**:
```http
Authorization: Bearer <jwt-token>
Content-Type: application/json
```

**User Context Headers** (optional):
```http
X-User-Email: user@example.com
```

## Response Format

### Success Response
```json
{
  "success": true,
  "message": "Operation completed successfully",
  "data": { ... }
}
```

### Error Response
```json
{
  "error": "Descriptive error message",
  "status_code": 400,
  "path": "/api/studies/123"
}
```

### Paginated Response
```json
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

## Studies API

### List Studies

**Endpoint**: `GET /api/studies/`

**Description**: Retrieve paginated list of studies with filtering and search capabilities.

**Query Parameters**:
- `q` (string, optional): Search query for title/summary
- `page` (integer, default: 1): Page number (1-based)
- `pageSize` (integer, default: 25): Items per page (max: 100)
- `sort` (string, default: "year:desc"): Sort format (field:direction)
- `category` (string, optional): Filter by category name
- `year_from` (integer, optional): Filter from year
- `year_to` (integer, optional): Filter to year

**Example Request**:
```http
GET /api/studies/?q=climate&page=1&pageSize=10&sort=year:desc&year_from=2020
```

**Example Response**:
```json
{
  "success": true,
  "data": [
    {
      "id": 12345,
      "title": "Climate Smart Agriculture Impact",
      "summary": "Study on climate adaptation strategies",
      "year": 2024,
      "category": {"id": 31, "name": "Impact Study"},
      "doi": "10.1000/example",
      "created_at": "2024-10-26T16:01:28"
    }
  ],
  "total": 1,
  "pagination": {
    "total": 1,
    "count": 1,
    "page": 1,
    "pageSize": 10,
    "totalPages": 1
  }
}
```

### Get Study Details

**Endpoint**: `GET /api/studies/{study_id}`

**Description**: Retrieve detailed information for a specific study including all relationships.

**Path Parameters**:
- `study_id` (integer): Study ID or ICD-formatted ID

**Example Request**:
```http
GET /api/studies/12345
```

**Example Response**:
```json
{
  "success": true,
  "data": {
    "study_id": 12345,
    "title": "Climate Smart Agriculture Impact",
    "summary": "Study on climate adaptation strategies",
    "year": 2024,
    "period": {"start": 2023, "end": 2024},
    "category": {"id": 31, "name": "Impact Study"},
    "intervention": {
      "id": 104,
      "name": "Climate Smart Agriculture",
      "type": 104,
      "detailsShort": "Implementation of climate adaptation practices"
    },
    "intervention_details": "Detailed intervention information",
    "doi": "10.1000/example",
    "countries": [
      {"id": 1, "name": "Kenya"},
      {"id": 2, "name": "Ethiopia"}
    ],
    "crops": [
      {"id": 17, "name": "Maize"}
    ],
    "impact_areas": [
      {"id": 31, "name": "Nutrition, Health and Food Security"}
    ],
    "initiatives": [
      {"id": 101, "name": "CGIAR Initiative on Climate Resilience"}
    ],
    "centers": [
      {"id": 1, "acronym": "CIAT"}
    ],
    "regions": [
      {"id": 55, "name": "East Africa"}
    ],
    "keywords": [
      {"id": 1, "name": "Climate Change"}
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

### Create Study (Basic)

**Endpoint**: `POST /api/studies/`

**Description**: Create a new study with basic information.

**Request Body**:
```json
{
  "studyId": 12346,
  "title": "New Research Study",
  "summary": "Study description",
  "year": 2024,
  "doi": "10.1000/new-study",
  "category": "1",
  "periodStart": "2023",
  "periodEnd": "2024",
  "interventionType": "104",
  "interventionDetails": "Intervention description"
}
```

**Response**:
```json
{
  "success": true,
  "message": "Study created successfully",
  "data": {"study_id": 12346}
}
```

### Create Complete Study

**Endpoint**: `POST /api/studies/complete`

**Description**: Create a complete study with all relationships and indicators.

**Request Body**:
```json
{
  "studyId": 12347,
  "title": "Complete Research Study",
  "summary": "Comprehensive study with all data",
  "year": 2024,
  "doi": "10.1000/complete-study",
  "category": "1",
  "periodStart": "2023",
  "periodEnd": "2024",
  "interventionType": "104",
  "interventionDetails": "Detailed intervention description",
  "primaryCGIARImpactArea": "1",
  "secondaryCGIARImpactAreas": ["2", "3"],
  "countries": [1, 2, 3],
  "regions": [1],
  "cropProductType": [1, 2],
  "keywords": [1, 2, 3],
  "contributingInitiatives": [101, 102],
  "contributingCenters": [1, 2],
  "indicators": [
    {
      "indicatorMeasure": "Yield Increase",
      "unitMeasure": "%",
      "resultReported": "25%"
    },
    {
      "indicatorMeasure": "Income Improvement",
      "unitMeasure": "USD",
      "resultReported": "500"
    }
  ]
}
```

**Response**:
```json
{
  "success": true,
  "message": "Study 12347 saved successfully to database",
  "data": {"study_id": 12347}
}
```

### Update Study

**Endpoint**: `PUT /api/studies/{study_id}`

**Description**: Update basic study information.

**Path Parameters**:
- `study_id` (integer): Study ID to update

**Request Body**: Same as create study (partial updates supported)

### Update Complete Study

**Endpoint**: `PUT /api/studies/{study_id}/complete`

**Description**: Update complete study with all relationships.

**Path Parameters**:
- `study_id` (integer): Study ID to update

**Request Body**: Same as create complete study

### Delete Study

**Endpoint**: `DELETE /api/studies/{study_id}`

**Description**: Delete a study and all its relationships.

**Path Parameters**:
- `study_id` (integer): Study ID to delete

**Response**:
```json
{
  "success": true,
  "message": "Study 12345 deleted successfully by user@example.com",
  "data": {"study_id": 12345}
}
```

### Check Study ID

**Endpoint**: `GET /api/studies/check-id/{study_id}`

**Description**: Check if a study ID already exists.

**Path Parameters**:
- `study_id` (string): Study ID to check

**Response**:
```json
{
  "exists": false,
  "study_id": "12348"
}
```

## Reference Data API

### Study Categories

**Endpoint**: `GET /api/reference/categories`

**Description**: Get all available study categories.

**Response**:
```json
{
  "success": true,
  "data": [
    {"id": 31, "name": "Impact Study"},
    {"id": 32, "name": "Impact/Outcome Story"},
    {"id": 33, "name": "Other"},
    {"id": 34, "name": "Outcome Study"},
    {"id": 35, "name": "Synthesis Study"}
  ]
}
```

### Intervention Types

**Endpoint**: `GET /api/reference/intervention-types`

**Description**: Get all available intervention types.

**Response**:
```json
{
  "success": true,
  "data": [
    {"id": 101, "name": "Agricultural Technology"},
    {"id": 102, "name": "Capacity Building"},
    {"id": 103, "name": "Policy Intervention"},
    {"id": 104, "name": "Climate Smart Agriculture"}
  ]
}
```

### Keywords

**Endpoint**: `GET /api/reference/keywords`

**Description**: Get all available keywords.

### Crop Types

**Endpoint**: `GET /api/reference/crop-types`

**Description**: Get all available crop types.

## CLARISA Reference Data API

### Countries

**Endpoint**: `GET /api/clarisa/countries`

**Description**: Get all CLARISA countries.

**Query Parameters**:
- `active` (boolean, default: true): Filter by active status

**Response**:
```json
{
  "success": true,
  "data": [
    {
      "id": 1,
      "name": "Kenya",
      "iso_alpha_2": "KE",
      "iso_alpha_3": "KEN",
      "is_active": true
    }
  ]
}
```

### Regions

**Endpoint**: `GET /api/clarisa/regions`

**Description**: Get all CGIAR regions.

### Impact Areas

**Endpoint**: `GET /api/clarisa/impact-areas`

**Description**: Get all CGIAR impact areas.

### Initiatives

**Endpoint**: `GET /api/clarisa/initiatives`

**Description**: Get all CGIAR initiatives.

### Centers

**Endpoint**: `GET /api/clarisa/centers`

**Description**: Get all CGIAR research centers.

## Authentication API

### Login

**Endpoint**: `POST /api/auth/login`

**Description**: Authenticate user and obtain JWT token.

**Request Body**:
```json
{
  "username": "user@example.com",
  "password": "secure-password"
}
```

**Response**:
```json
{
  "success": true,
  "data": {
    "access_token": "jwt-token-here",
    "token_type": "bearer",
    "expires_in": 3600,
    "user": {
      "email": "user@example.com",
      "name": "User Name"
    }
  }
}
```

### Refresh Token

**Endpoint**: `POST /api/auth/refresh`

**Description**: Refresh JWT token.

### Logout

**Endpoint**: `POST /api/auth/logout`

**Description**: Logout user and invalidate token.

### User Profile

**Endpoint**: `GET /api/auth/profile`

**Description**: Get current user profile information.

## Indicators API

### List Indicators

**Endpoint**: `GET /api/indicators/`

**Description**: Get indicators for studies.

### Create Indicator

**Endpoint**: `POST /api/indicators/`

**Description**: Create new indicator.

## Reports API

### Study Statistics

**Endpoint**: `GET /api/reports/statistics`

**Description**: Get study statistics and analytics.

**Response**:
```json
{
  "success": true,
  "data": {
    "total_studies": 245,
    "studies_by_year": {
      "2024": 45,
      "2023": 67,
      "2022": 89
    },
    "studies_by_category": {
      "Impact Study": 120,
      "Outcome Study": 85,
      "Other": 40
    },
    "top_countries": [
      {"name": "Kenya", "count": 34},
      {"name": "Ethiopia", "count": 28}
    ]
  }
}
```

### Export Studies

**Endpoint**: `GET /api/reports/export`

**Description**: Export studies data in various formats.

**Query Parameters**:
- `format` (string): Export format (csv, xlsx, json)
- `filters` (object): Same filters as study list

## Admin API

### System Status

**Endpoint**: `GET /api/admin/status`

**Description**: Get system status and health information.

### User Management

**Endpoint**: `GET /api/admin/users`

**Description**: Manage user accounts (admin only).

## Error Codes

### HTTP Status Codes

- `200 OK`: Successful request
- `201 Created`: Resource created successfully
- `400 Bad Request`: Invalid request data
- `401 Unauthorized`: Authentication required
- `403 Forbidden`: Insufficient permissions
- `404 Not Found`: Resource not found
- `409 Conflict`: Resource already exists
- `422 Unprocessable Entity`: Validation error
- `500 Internal Server Error`: Server error

### Common Error Messages

**Validation Errors**:
```json
{
  "error": "Validation failed",
  "status_code": 422,
  "details": [
    {
      "field": "title",
      "message": "Title is required"
    }
  ]
}
```

**Authentication Errors**:
```json
{
  "error": "Authentication required",
  "status_code": 401,
  "path": "/api/studies/"
}
```

**Database Errors**:
```json
{
  "error": "Foreign key constraint violation",
  "status_code": 400,
  "path": "/api/studies/12345"
}
```

## Rate Limiting

**Limits**:
- 1000 requests per hour per IP
- 100 requests per minute per authenticated user
- 10 requests per minute for unauthenticated users

**Headers**:
```http
X-RateLimit-Limit: 1000
X-RateLimit-Remaining: 999
X-RateLimit-Reset: 1635724800
```

## Pagination

**Default Values**:
- Page size: 25 items
- Maximum page size: 100 items
- Page numbering: 1-based

**Query Parameters**:
- `page`: Page number (default: 1)
- `pageSize`: Items per page (default: 25, max: 100)

## Filtering and Searching

### Search Query Format

**Text Search**:
- Searches in title and summary fields
- Case-insensitive partial matching
- Example: `?q=climate` matches "Climate Change" and "climate adaptation"

**Date Range Filtering**:
- `year_from`: Minimum year (inclusive)
- `year_to`: Maximum year (inclusive)
- Example: `?year_from=2020&year_to=2024`

**Category Filtering**:
- `category`: Filter by category name
- Example: `?category=Impact Study`

### Sorting

**Sort Format**: `field:direction`

**Available Fields**:
- `year`: Study year
- `title`: Study title
- `category`: Study category
- `id`: Study ID

**Directions**:
- `asc`: Ascending order
- `desc`: Descending order

**Examples**:
- `?sort=year:desc`: Latest studies first
- `?sort=title:asc`: Alphabetical by title

## Data Validation

### Study ID Format

- Must be a positive integer
- Unique across all studies
- Can be provided as integer or ICD-formatted string (e.g., "ICD-12345")

### Required Fields

**Study Creation**:
- `studyId`: Unique identifier
- `title`: Study title (max 500 characters)
- `year`: Publication year

**Complete Study**:
- All basic study fields
- At least one indicator
- At least one country or region

### Field Constraints

- `title`: 1-500 characters
- `summary`: Max 5000 characters
- `year`: 1900-2100
- `doi`: Valid DOI format (optional)
- `category`: Must exist in reference data
- `interventionType`: Must exist in reference data

## SDK Examples

### JavaScript/Node.js

```javascript
const axios = require('axios');

const api = axios.create({
  baseURL: 'https://your-api-gateway-url/api',
  headers: {
    'Authorization': 'Bearer ' + token,
    'Content-Type': 'application/json'
  }
});

// Get studies
const studies = await api.get('/studies/', {
  params: {
    q: 'climate',
    page: 1,
    pageSize: 10
  }
});

// Create study
const newStudy = await api.post('/studies/complete', {
  studyId: 12345,
  title: 'New Study',
  year: 2024,
  category: '1',
  // ... other fields
});
```

### Python

```python
import requests

class ImpactCompendiumAPI:
    def __init__(self, base_url, token):
        self.base_url = base_url
        self.headers = {
            'Authorization': f'Bearer {token}',
            'Content-Type': 'application/json'
        }
    
    def get_studies(self, **params):
        response = requests.get(
            f'{self.base_url}/studies/',
            headers=self.headers,
            params=params
        )
        return response.json()
    
    def create_study(self, study_data):
        response = requests.post(
            f'{self.base_url}/studies/complete',
            headers=self.headers,
            json=study_data
        )
        return response.json()

# Usage
api = ImpactCompendiumAPI('https://your-api-gateway-url/api', token)
studies = api.get_studies(q='climate', page=1, pageSize=10)
```

### cURL Examples

```bash
# Get studies
curl -X GET "https://your-api-gateway-url/api/studies/?q=climate&page=1" \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json"

# Create study
curl -X POST "https://your-api-gateway-url/api/studies/complete" \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "studyId": 12345,
    "title": "New Study",
    "year": 2024,
    "category": "1"
  }'

# Delete study
curl -X DELETE "https://your-api-gateway-url/api/studies/12345" \
  -H "Authorization: Bearer $TOKEN"
```
