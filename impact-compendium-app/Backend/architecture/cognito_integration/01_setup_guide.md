# Setup Guide

## Prerequisites

- AWS Account with Cognito User Pool configured
- Python 3.8+
- AWS CLI configured with appropriate permissions
- FastAPI application

## Installation

### 1. Install Dependencies

```bash
pip install boto3 PyJWT cryptography requests fastapi uvicorn
```

### 2. AWS CLI Configuration

```bash
# Configure AWS CLI with your profile
aws configure --profile your-profile
```

### 3. Environment Variables

Create a `.env` file:

```bash
# Cognito Configuration
COGNITO_USER_POOL_ID=us-east-1_YourPoolId
COGNITO_CLIENT_ID=your-client-id
COGNITO_REGION=us-east-1
AWS_REGION=us-east-1
AWS_PROFILE=your-profile

# Database Configuration (if needed)
DB_HOST=your-db-host
DB_PORT=3306
DB_NAME=your-database
DB_USER=your-user
DB_PASSWORD=your-password

# Environment
ENVIRONMENT=dev
LOG_LEVEL=INFO
```

## AWS Cognito User Pool Setup

### 1. Create User Pool

```bash
aws cognito-idp create-user-pool \
  --pool-name "your-app-users" \
  --policies '{
    "PasswordPolicy": {
      "MinimumLength": 8,
      "RequireUppercase": true,
      "RequireLowercase": true,
      "RequireNumbers": true,
      "RequireSymbols": false
    }
  }' \
  --admin-create-user-config '{
    "AllowAdminCreateUserOnly": false,
    "UnusedAccountValidityDays": 7
  }' \
  --email-configuration '{
    "EmailSendingAccount": "COGNITO_DEFAULT"
  }'
```

### 2. Create User Pool Client

```bash
aws cognito-idp create-user-pool-client \
  --user-pool-id us-east-1_YourPoolId \
  --client-name "your-app-client" \
  --generate-secret \
  --explicit-auth-flows ADMIN_NO_SRP_AUTH ALLOW_USER_PASSWORD_AUTH ALLOW_REFRESH_TOKEN_AUTH
```

### 3. Create Groups

```bash
# Admin group
aws cognito-idp create-group \
  --group-name "admin" \
  --user-pool-id us-east-1_YourPoolId \
  --description "Administrators"

# Researchers group
aws cognito-idp create-group \
  --group-name "researchers" \
  --user-pool-id us-east-1_YourPoolId \
  --description "Researchers"
```

## File Structure

```
app/
├── services/
│   ├── cognito_auth.py          # Authentication service
│   ├── cognito_user_service.py  # User management service
├── utils/
│   ├── email_utils.py           # Email utilities
├── routers/
│   ├── auth.py                  # Authentication routes
│   ├── users.py                 # User management routes
│   ├── admin.py                 # Admin routes
├── config/
│   ├── settings.py              # Configuration
└── main.py                      # FastAPI application
```

## Integration Steps

### 1. Copy Service Files

Copy the following files to your project:

- `app/services/cognito_auth.py`
- `app/services/cognito_user_service.py`
- `app/utils/email_utils.py`

### 2. Update Configuration

Update your `settings.py`:

```python
import os
from pydantic import BaseSettings

class Settings(BaseSettings):
    cognito_user_pool_id: str = os.getenv("COGNITO_USER_POOL_ID")
    cognito_client_id: str = os.getenv("COGNITO_CLIENT_ID")
    cognito_region: str = os.getenv("COGNITO_REGION", "us-east-1")
    aws_region: str = os.getenv("AWS_REGION", "us-east-1")
    aws_profile: str = os.getenv("AWS_PROFILE")

settings = Settings()
```

### 3. Initialize Services

In your `main.py`:

```python
from fastapi import FastAPI
from app.services.cognito_auth import CognitoAuthService
from app.services.cognito_user_service import CognitoUserService

app = FastAPI()

# Initialize services (optional - services auto-initialize)
# auth_service = CognitoAuthService()
# user_service = CognitoUserService()
```

### 4. Add Routes

```python
from app.routers import auth, users, admin

app.include_router(auth.router, prefix="/api/auth", tags=["authentication"])
app.include_router(users.router, prefix="/api/users", tags=["users"])
app.include_router(admin.router, prefix="/api/admin", tags=["admin"])
```

## Verification

### 1. Test Authentication Service

```python
from app.services.cognito_auth import CognitoAuthService

auth_service = CognitoAuthService()
# This should not raise any errors
print("Authentication service initialized successfully")
```

### 2. Test User Service

```python
from app.services.cognito_user_service import CognitoUserService

user_service = CognitoUserService()
users = user_service.list_users()
print(f"Found {len(users)} users")
```

### 3. Test API Endpoints

```bash
# Health check
curl http://localhost:8000/api/auth/health

# List users (requires admin token)
curl -H "Authorization: Bearer YOUR_TOKEN" http://localhost:8000/api/users/
```

## Troubleshooting

### Common Issues

1. **Credential Configuration**: If boto3 fails, the module automatically falls back to AWS CLI
2. **Email Delivery**: Check spam folders for Cognito emails
3. **Token Verification**: Ensure COGNITO_USER_POOL_ID and COGNITO_CLIENT_ID are correct

### Debug Mode

Enable debug logging:

```python
import logging
logging.basicConfig(level=logging.DEBUG)
```

## Next Steps

- [Authentication Module](./02_authentication.md)
- [User Management](./03_user_management.md)
- [API Reference](./05_api_reference.md)
