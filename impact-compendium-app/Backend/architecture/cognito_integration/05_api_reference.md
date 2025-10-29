# API Reference

## Overview

This document provides a complete reference for all REST API endpoints provided by the Cognito integration module.

## Authentication Endpoints

### Base URL: `/api/auth`

#### `GET /api/auth/health`

Health check endpoint for authentication service.

**Response:**
```json
{
  "status": "healthy",
  "service": "cognito_auth",
  "timestamp": "2025-10-29T08:26:04.169Z"
}
```

#### `POST /api/auth/login`

Authenticate user and return tokens (if implemented).

**Request:**
```json
{
  "username": "johndoe",
  "password": "userpassword"
}
```

**Response:**
```json
{
  "access_token": "eyJhbGciOiJSUzI1NiIs...",
  "id_token": "eyJhbGciOiJSUzI1NiIs...",
  "refresh_token": "eyJjdHkiOiJKV1QiLCJlbmMi...",
  "expires_in": 3600,
  "token_type": "Bearer"
}
```

#### `POST /api/auth/refresh`

Refresh access token using refresh token.

**Request:**
```json
{
  "refresh_token": "eyJjdHkiOiJKV1QiLCJlbmMi..."
}
```

**Response:**
```json
{
  "access_token": "eyJhbGciOiJSUzI1NiIs...",
  "expires_in": 3600,
  "token_type": "Bearer"
}
```

## User Management Endpoints

### Base URL: `/api/users`

#### `GET /api/users/`

List all users in the User Pool.

**Authentication:** Required (Admin)

**Response:**
```json
[
  {
    "username": "johndoe",
    "email": "john@example.com",
    "status": "CONFIRMED",
    "enabled": true,
    "created_date": "2025-10-29T08:26:04.169Z",
    "last_modified_date": "2025-10-29T08:26:04.169Z",
    "mfa_enabled": false,
    "groups": ["researchers"]
  }
]
```

#### `POST /api/users/`

Create a new user.

**Authentication:** Required (Admin)

**Request:**
```json
{
  "email": "newuser@example.com",
  "temporary_password": "TempPass123!",
  "send_email": true
}
```

**Response:**
```json
{
  "username": "newuser",
  "email": "newuser@example.com",
  "status": "FORCE_CHANGE_PASSWORD",
  "created": "2025-10-29T08:26:04.169Z"
}
```

#### `GET /api/users/{username}`

Get specific user details.

**Authentication:** Required (Admin or Self)

**Response:**
```json
{
  "username": "johndoe",
  "email": "john@example.com",
  "status": "CONFIRMED",
  "enabled": true,
  "created_date": "2025-10-29T08:26:04.169Z",
  "last_modified_date": "2025-10-29T08:26:04.169Z",
  "mfa_enabled": false,
  "groups": ["researchers"],
  "attributes": {
    "name": "John Doe",
    "email_verified": "true"
  }
}
```

#### `PUT /api/users/{username}`

Update user information.

**Authentication:** Required (Admin or Self)

**Request:**
```json
{
  "name": "John Doe Updated",
  "role": "senior_researcher"
}
```

**Response:**
```json
{
  "username": "johndoe",
  "name": "John Doe Updated",
  "role": "senior_researcher",
  "updated": true
}
```

#### `DELETE /api/users/{username}`

Delete a user.

**Authentication:** Required (Admin)

**Response:**
```json
{
  "username": "johndoe",
  "deleted": true
}
```

#### `POST /api/users/{username}/reset-password`

Reset user password.

**Authentication:** Required (Admin)

**Response:**
```json
{
  "username": "johndoe",
  "password_reset": true,
  "status": "FORCE_CHANGE_PASSWORD"
}
```

#### `PUT /api/users/{username}/status`

Enable or disable a user.

**Authentication:** Required (Admin)

**Request:**
```json
{
  "enabled": false
}
```

**Response:**
```json
{
  "username": "johndoe",
  "enabled": false,
  "updated": true
}
```

## Group Management Endpoints

### Base URL: `/api/users/groups`

#### `GET /api/users/groups/`

List all groups.

**Authentication:** Required (Admin)

**Response:**
```json
[
  {
    "GroupName": "admin",
    "Description": "Administrators group",
    "CreationDate": "2024-01-01T00:00:00Z",
    "LastModifiedDate": "2024-01-01T00:00:00Z"
  },
  {
    "GroupName": "researchers",
    "Description": "Researchers group",
    "CreationDate": "2024-01-01T00:00:00Z",
    "LastModifiedDate": "2024-01-01T00:00:00Z"
  }
]
```

#### `POST /api/users/groups/`

Create a new group.

**Authentication:** Required (Admin)

**Request:**
```json
{
  "group_name": "data_analysts",
  "description": "Data analysts and statisticians"
}
```

**Response:**
```json
{
  "group_name": "data_analysts",
  "description": "Data analysts and statisticians",
  "created": true
}
```

#### `DELETE /api/users/groups/{group_name}`

Delete a group.

**Authentication:** Required (Admin)

**Response:**
```json
{
  "group_name": "data_analysts",
  "deleted": true
}
```

#### `POST /api/users/{username}/groups/{group_name}`

Add user to group.

**Authentication:** Required (Admin)

**Response:**
```json
{
  "username": "johndoe",
  "group_name": "researchers",
  "added": true
}
```

#### `DELETE /api/users/{username}/groups/{group_name}`

Remove user from group.

**Authentication:** Required (Admin)

**Response:**
```json
{
  "username": "johndoe",
  "group_name": "researchers",
  "removed": true
}
```

## Admin Endpoints

### Base URL: `/api/admin`

#### `GET /api/admin/stats`

Get system statistics.

**Authentication:** Required (Admin)

**Response:**
```json
{
  "total_users": 150,
  "active_users": 142,
  "total_groups": 4,
  "users_by_status": {
    "CONFIRMED": 142,
    "FORCE_CHANGE_PASSWORD": 8
  },
  "users_by_group": {
    "admin": 5,
    "researchers": 120,
    "viewers": 25
  }
}
```

#### `GET /api/admin/users/report`

Generate detailed user report.

**Authentication:** Required (Admin)

**Query Parameters:**
- `format`: `json` or `csv` (default: `json`)
- `include_groups`: `true` or `false` (default: `true`)

**Response:**
```json
{
  "generated_at": "2025-10-29T08:26:04.169Z",
  "total_users": 150,
  "users": [
    {
      "username": "johndoe",
      "email": "john@example.com",
      "status": "CONFIRMED",
      "groups": ["researchers"],
      "last_login": "2025-10-28T15:30:00Z",
      "created_date": "2025-01-15T10:00:00Z"
    }
  ]
}
```

## Request/Response Models

### CreateUserRequest

```python
class CreateUserRequest(BaseModel):
    email: str = Field(..., description="User email address")
    temporary_password: str = Field(..., min_length=8, description="Temporary password")
    send_email: bool = Field(True, description="Send welcome email")
```

### UpdateUserRequest

```python
class UpdateUserRequest(BaseModel):
    name: Optional[str] = Field(None, description="User display name")
    role: Optional[str] = Field(None, description="User role")
```

### CreateGroupRequest

```python
class CreateGroupRequest(BaseModel):
    group_name: str = Field(..., description="Group name")
    description: str = Field("", description="Group description")
```

### UserStatusRequest

```python
class UserStatusRequest(BaseModel):
    enabled: bool = Field(..., description="Enable or disable user")
```

## Error Responses

### Standard Error Format

```json
{
  "error": "Error message",
  "status_code": 400,
  "path": "/api/users/",
  "timestamp": "2025-10-29T08:26:04.169Z",
  "details": {
    "field": "email",
    "message": "Invalid email format"
  }
}
```

### HTTP Status Codes

- `200 OK`: Successful operation
- `201 Created`: Resource created successfully
- `400 Bad Request`: Invalid request data
- `401 Unauthorized`: Authentication required
- `403 Forbidden`: Insufficient permissions
- `404 Not Found`: Resource not found
- `409 Conflict`: Resource already exists
- `500 Internal Server Error`: Server error

### Common Error Messages

#### Authentication Errors

```json
{
  "error": "Authentication required",
  "status_code": 401,
  "path": "/api/users/"
}
```

```json
{
  "error": "Invalid token",
  "status_code": 401,
  "path": "/api/users/"
}
```

```json
{
  "error": "Token expired",
  "status_code": 401,
  "path": "/api/users/"
}
```

#### Authorization Errors

```json
{
  "error": "Admin access required",
  "status_code": 403,
  "path": "/api/users/"
}
```

```json
{
  "error": "Group 'admin' required",
  "status_code": 403,
  "path": "/api/admin/stats"
}
```

#### Validation Errors

```json
{
  "error": "Validation error",
  "status_code": 400,
  "path": "/api/users/",
  "details": [
    {
      "field": "email",
      "message": "Invalid email format"
    },
    {
      "field": "temporary_password",
      "message": "Password must be at least 8 characters"
    }
  ]
}
```

#### Resource Errors

```json
{
  "error": "User not found",
  "status_code": 404,
  "path": "/api/users/nonexistent"
}
```

```json
{
  "error": "User already exists",
  "status_code": 409,
  "path": "/api/users/"
}
```

## Rate Limiting

### Default Limits

- **Authentication endpoints**: 10 requests per minute per IP
- **User management**: 100 requests per minute per authenticated user
- **Admin endpoints**: 200 requests per minute per admin user

### Rate Limit Headers

```
X-RateLimit-Limit: 100
X-RateLimit-Remaining: 95
X-RateLimit-Reset: 1730217097
```

### Rate Limit Exceeded Response

```json
{
  "error": "Rate limit exceeded",
  "status_code": 429,
  "retry_after": 60
}
```

## Pagination

### Query Parameters

- `page`: Page number (default: 1)
- `limit`: Items per page (default: 50, max: 100)
- `sort`: Sort field (default: username)
- `order`: Sort order - `asc` or `desc` (default: asc)

### Paginated Response

```json
{
  "data": [...],
  "pagination": {
    "page": 1,
    "limit": 50,
    "total": 150,
    "pages": 3,
    "has_next": true,
    "has_prev": false
  }
}
```

## Filtering and Search

### Query Parameters

- `search`: Search term for username or email
- `status`: Filter by user status
- `group`: Filter by group membership
- `enabled`: Filter by enabled status

### Example

```
GET /api/users/?search=john&status=CONFIRMED&group=researchers&limit=25
```

## Webhooks (Optional)

### User Events

```json
{
  "event_type": "user.created",
  "timestamp": "2025-10-29T08:26:04.169Z",
  "data": {
    "username": "johndoe",
    "email": "john@example.com",
    "status": "FORCE_CHANGE_PASSWORD"
  }
}
```

### Group Events

```json
{
  "event_type": "user.group.added",
  "timestamp": "2025-10-29T08:26:04.169Z",
  "data": {
    "username": "johndoe",
    "group_name": "researchers"
  }
}
```

## SDK Examples

### Python SDK Usage

```python
import requests

# Authentication
headers = {"Authorization": "Bearer YOUR_TOKEN"}

# List users
response = requests.get("http://localhost:8000/api/users/", headers=headers)
users = response.json()

# Create user
user_data = {
    "email": "newuser@example.com",
    "temporary_password": "TempPass123!",
    "send_email": True
}
response = requests.post("http://localhost:8000/api/users/", 
                        json=user_data, headers=headers)
new_user = response.json()

# Add user to group
response = requests.post(
    f"http://localhost:8000/api/users/{new_user['username']}/groups/researchers",
    headers=headers
)
```

### JavaScript/TypeScript SDK

```typescript
class CognitoAPI {
  constructor(private baseUrl: string, private token: string) {}

  private get headers() {
    return {
      'Authorization': `Bearer ${this.token}`,
      'Content-Type': 'application/json'
    };
  }

  async listUsers(): Promise<User[]> {
    const response = await fetch(`${this.baseUrl}/api/users/`, {
      headers: this.headers
    });
    return response.json();
  }

  async createUser(userData: CreateUserRequest): Promise<User> {
    const response = await fetch(`${this.baseUrl}/api/users/`, {
      method: 'POST',
      headers: this.headers,
      body: JSON.stringify(userData)
    });
    return response.json();
  }

  async addUserToGroup(username: string, groupName: string): Promise<void> {
    await fetch(`${this.baseUrl}/api/users/${username}/groups/${groupName}`, {
      method: 'POST',
      headers: this.headers
    });
  }
}
```

## Next Steps

- [Utilities](./06_utilities.md)
- [Troubleshooting](./07_troubleshooting.md)
- [Implementation Guide](./08_implementation_guide.md)
