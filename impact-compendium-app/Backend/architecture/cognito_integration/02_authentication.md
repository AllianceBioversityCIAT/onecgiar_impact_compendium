# Authentication Module

## Overview

The authentication module (`cognito_auth.py`) handles JWT token verification and user authentication using AWS Cognito User Pools.

## CognitoAuthService Class

### Initialization

```python
from app.services.cognito_auth import CognitoAuthService

auth_service = CognitoAuthService()
```

The service automatically:
- Loads configuration from environment variables
- Downloads JWKS (JSON Web Key Set) from Cognito
- Initializes JWT verification

### Key Methods

#### `verify_token(token: str) -> dict`

Verifies a JWT token and returns the payload.

```python
try:
    payload = auth_service.verify_token(jwt_token)
    username = payload['username']
    groups = payload.get('cognito:groups', [])
    print(f"User: {username}, Groups: {groups}")
except Exception as e:
    print(f"Token verification failed: {e}")
```

**Returns:**
```python
{
    'sub': 'user-uuid',
    'username': 'johndoe',
    'cognito:groups': ['admin', 'researchers'],
    'email': 'john@example.com',
    'exp': 1234567890,
    'iat': 1234567890,
    # ... other claims
}
```

#### `get_jwks() -> dict`

Downloads and caches JWKS from Cognito.

```python
jwks = auth_service.get_jwks()
```

## Authentication Decorators

### `require_auth(current_user: dict = Depends(get_current_user))`

Requires valid authentication:

```python
from fastapi import Depends
from app.services.cognito_auth import get_current_user

@app.get("/protected")
async def protected_endpoint(current_user: dict = Depends(get_current_user)):
    return {"user": current_user['username']}
```

### `require_admin(current_user: dict = Depends(require_auth))`

Requires admin group membership:

```python
from app.services.cognito_auth import require_admin

@app.post("/admin-only")
async def admin_endpoint(current_user: dict = Depends(require_admin)):
    return {"message": "Admin access granted"}
```

## Token Structure

### Access Token Claims

```json
{
  "sub": "443834b8-50f1-7060-cae1-f5b3398b28dc",
  "cognito:groups": ["admin"],
  "iss": "https://cognito-idp.us-east-1.amazonaws.com/us-east-1_YourPoolId",
  "client_id": "your-client-id",
  "origin_jti": "uuid",
  "event_id": "uuid",
  "token_use": "access",
  "scope": "aws.cognito.signin.user.admin",
  "auth_time": 1730217097,
  "exp": 1730220697,
  "iat": 1730217097,
  "jti": "uuid",
  "username": "JohnDoe"
}
```

### ID Token Claims

```json
{
  "sub": "443834b8-50f1-7060-cae1-f5b3398b28dc",
  "email_verified": true,
  "iss": "https://cognito-idp.us-east-1.amazonaws.com/us-east-1_YourPoolId",
  "cognito:username": "JohnDoe",
  "origin_jti": "uuid",
  "aud": "your-client-id",
  "event_id": "uuid",
  "token_use": "id",
  "auth_time": 1730217097,
  "exp": 1730220697,
  "iat": 1730217097,
  "email": "john@example.com"
}
```

## Error Handling

### Common Exceptions

```python
from app.services.cognito_auth import CognitoAuthService

auth_service = CognitoAuthService()

try:
    payload = auth_service.verify_token(token)
except Exception as e:
    if "expired" in str(e).lower():
        # Token expired
        return {"error": "Token expired"}
    elif "invalid" in str(e).lower():
        # Invalid token
        return {"error": "Invalid token"}
    else:
        # Other verification errors
        return {"error": "Authentication failed"}
```

### HTTP Status Codes

- `401 Unauthorized`: Invalid or expired token
- `403 Forbidden`: Valid token but insufficient permissions
- `500 Internal Server Error`: Authentication service error

## Configuration

### Environment Variables

```bash
COGNITO_USER_POOL_ID=us-east-1_YourPoolId
COGNITO_CLIENT_ID=your-client-id
COGNITO_REGION=us-east-1
```

### Mock Mode

For development/testing:

```python
# In your test environment
import os
os.environ['COGNITO_USER_POOL_ID'] = ''  # Empty to enable mock mode

auth_service = CognitoAuthService()
# Service will operate in mock mode
```

## Usage Examples

### Basic Authentication

```python
from fastapi import FastAPI, Depends, HTTPException
from app.services.cognito_auth import get_current_user

app = FastAPI()

@app.get("/profile")
async def get_profile(current_user: dict = Depends(get_current_user)):
    return {
        "username": current_user['username'],
        "email": current_user.get('email'),
        "groups": current_user.get('cognito:groups', [])
    }
```

### Group-Based Authorization

```python
from app.services.cognito_auth import get_current_user

def require_group(required_group: str):
    def group_checker(current_user: dict = Depends(get_current_user)):
        user_groups = current_user.get('cognito:groups', [])
        if required_group not in user_groups:
            raise HTTPException(status_code=403, detail="Insufficient permissions")
        return current_user
    return group_checker

@app.get("/researchers-only")
async def researchers_endpoint(
    current_user: dict = Depends(require_group("researchers"))
):
    return {"message": "Researchers access granted"}
```

### Custom Token Validation

```python
from app.services.cognito_auth import CognitoAuthService

auth_service = CognitoAuthService()

def validate_custom_token(token: str):
    try:
        payload = auth_service.verify_token(token)
        
        # Custom validation logic
        if payload.get('token_use') != 'access':
            raise ValueError("Invalid token type")
            
        if 'admin' not in payload.get('cognito:groups', []):
            raise ValueError("Admin access required")
            
        return payload
    except Exception as e:
        raise HTTPException(status_code=401, detail=str(e))
```

## Security Considerations

1. **Token Expiration**: Always check token expiration
2. **HTTPS Only**: Use HTTPS in production
3. **Token Storage**: Store tokens securely on client side
4. **Refresh Tokens**: Implement token refresh mechanism
5. **Rate Limiting**: Implement rate limiting for auth endpoints

## Testing

### Unit Tests

```python
import pytest
from app.services.cognito_auth import CognitoAuthService

def test_auth_service_initialization():
    service = CognitoAuthService()
    assert service is not None

def test_mock_mode():
    import os
    os.environ['COGNITO_USER_POOL_ID'] = ''
    service = CognitoAuthService()
    assert service.mock_mode is True
```

### Integration Tests

```python
def test_token_verification():
    # Use a valid test token
    auth_service = CognitoAuthService()
    payload = auth_service.verify_token(valid_test_token)
    assert 'username' in payload
    assert 'exp' in payload
```

## Next Steps

- [User Management](./03_user_management.md)
- [Group Management](./04_group_management.md)
- [API Reference](./05_api_reference.md)
