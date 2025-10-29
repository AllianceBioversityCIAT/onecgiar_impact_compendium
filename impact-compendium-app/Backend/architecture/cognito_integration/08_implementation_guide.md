# Implementation Guide

## Overview

This guide provides step-by-step instructions for implementing the Cognito integration module in other applications.

## Quick Integration Checklist

- [ ] AWS Cognito User Pool configured
- [ ] Environment variables set
- [ ] Dependencies installed
- [ ] Service files copied
- [ ] Routes integrated
- [ ] Authentication middleware configured
- [ ] Testing completed

## Step 1: Prerequisites Setup

### AWS Cognito User Pool

1. **Create User Pool**:
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
  }'
```

2. **Create User Pool Client**:
```bash
aws cognito-idp create-user-pool-client \
  --user-pool-id us-east-1_YourPoolId \
  --client-name "your-app-client" \
  --explicit-auth-flows ADMIN_NO_SRP_AUTH ALLOW_USER_PASSWORD_AUTH ALLOW_REFRESH_TOKEN_AUTH
```

3. **Create Default Groups**:
```bash
aws cognito-idp create-group \
  --group-name "admin" \
  --user-pool-id us-east-1_YourPoolId \
  --description "Administrators"

aws cognito-idp create-group \
  --group-name "users" \
  --user-pool-id us-east-1_YourPoolId \
  --description "Regular users"
```

### Dependencies

```bash
pip install boto3 PyJWT cryptography requests fastapi uvicorn python-dotenv
```

## Step 2: File Structure Setup

Create the following directory structure in your project:

```
your_app/
├── services/
│   ├── __init__.py
│   ├── cognito_auth.py
│   └── cognito_user_service.py
├── utils/
│   ├── __init__.py
│   └── email_utils.py
├── routers/
│   ├── __init__.py
│   ├── auth.py
│   ├── users.py
│   └── admin.py
├── config/
│   ├── __init__.py
│   └── settings.py
├── .env
└── main.py
```

## Step 3: Copy Core Files

### 1. Copy Service Files

Copy these files from the reference implementation:

- `app/services/cognito_auth.py` → `your_app/services/cognito_auth.py`
- `app/services/cognito_user_service.py` → `your_app/services/cognito_user_service.py`
- `app/utils/email_utils.py` → `your_app/utils/email_utils.py`

### 2. Update Import Paths

Update import statements in copied files:

```python
# Change from:
from app.utils.email_utils import extract_username_from_email

# To:
from your_app.utils.email_utils import extract_username_from_email
```

## Step 4: Configuration

### Environment Variables (.env)

```bash
# Cognito Configuration
COGNITO_USER_POOL_ID=us-east-1_YourPoolId
COGNITO_CLIENT_ID=your-client-id
COGNITO_REGION=us-east-1
AWS_REGION=us-east-1
AWS_PROFILE=your-profile

# Application Configuration
ENVIRONMENT=dev
LOG_LEVEL=INFO
```

### Settings Configuration

Create `your_app/config/settings.py`:

```python
import os
from pydantic import BaseSettings

class Settings(BaseSettings):
    # Cognito settings
    cognito_user_pool_id: str = os.getenv("COGNITO_USER_POOL_ID", "")
    cognito_client_id: str = os.getenv("COGNITO_CLIENT_ID", "")
    cognito_region: str = os.getenv("COGNITO_REGION", "us-east-1")
    
    # AWS settings
    aws_region: str = os.getenv("AWS_REGION", "us-east-1")
    aws_profile: str = os.getenv("AWS_PROFILE", "default")
    
    # Application settings
    environment: str = os.getenv("ENVIRONMENT", "dev")
    log_level: str = os.getenv("LOG_LEVEL", "INFO")
    
    class Config:
        env_file = ".env"

settings = Settings()
```

## Step 5: FastAPI Integration

### Main Application (main.py)

```python
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
import logging
import os
from dotenv import load_dotenv

# Load environment variables
load_dotenv()

# Configure logging
logging.basicConfig(
    level=getattr(logging, os.getenv("LOG_LEVEL", "INFO")),
    format="%(asctime)s - %(name)s - %(levelname)s - %(message)s"
)

app = FastAPI(
    title="Your Application API",
    description="API with Cognito integration",
    version="1.0.0"
)

# CORS middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # Configure appropriately for production
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Include routers
from your_app.routers import auth, users, admin

app.include_router(auth.router, prefix="/api/auth", tags=["authentication"])
app.include_router(users.router, prefix="/api/users", tags=["users"])
app.include_router(admin.router, prefix="/api/admin", tags=["admin"])

@app.get("/")
async def root():
    return {"message": "Your Application API", "status": "running"}

@app.get("/health")
async def health_check():
    return {"status": "healthy", "service": "your_app"}

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)
```

## Step 6: Create API Routes

### Authentication Routes (routers/auth.py)

```python
from fastapi import APIRouter, Depends, HTTPException
from your_app.services.cognito_auth import CognitoAuthService, get_current_user

router = APIRouter()
auth_service = CognitoAuthService()

@router.get("/health")
async def auth_health():
    """Health check for authentication service"""
    return {
        "status": "healthy",
        "service": "cognito_auth",
        "mock_mode": auth_service.mock_mode
    }

@router.get("/me")
async def get_current_user_info(current_user: dict = Depends(get_current_user)):
    """Get current user information"""
    return {
        "username": current_user.get("username"),
        "email": current_user.get("email"),
        "groups": current_user.get("cognito:groups", []),
        "sub": current_user.get("sub")
    }

@router.post("/verify-token")
async def verify_token(token: str):
    """Verify JWT token"""
    try:
        payload = auth_service.verify_token(token)
        return {"valid": True, "payload": payload}
    except Exception as e:
        raise HTTPException(status_code=401, detail=str(e))
```

### User Management Routes (routers/users.py)

```python
from fastapi import APIRouter, Depends, HTTPException
from typing import List
from pydantic import BaseModel
from your_app.services.cognito_user_service import CognitoUserService
from your_app.services.cognito_auth import require_admin, get_current_user

router = APIRouter()
user_service = CognitoUserService()

class CreateUserRequest(BaseModel):
    email: str
    temporary_password: str
    send_email: bool = True

class UpdateUserRequest(BaseModel):
    name: str = None
    role: str = None

@router.get("/")
async def list_users(current_user: dict = Depends(require_admin)):
    """List all users (Admin only)"""
    try:
        users = user_service.list_users()
        return users
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@router.post("/")
async def create_user(
    user_data: CreateUserRequest,
    current_user: dict = Depends(require_admin)
):
    """Create a new user (Admin only)"""
    try:
        result = user_service.create_user(
            email=user_data.email,
            temporary_password=user_data.temporary_password,
            send_email=user_data.send_email
        )
        return result
    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e))

@router.get("/{username}")
async def get_user(
    username: str,
    current_user: dict = Depends(get_current_user)
):
    """Get user details (Admin or self)"""
    # Check if user is admin or requesting their own info
    if (current_user.get("username") != username and 
        "admin" not in current_user.get("cognito:groups", [])):
        raise HTTPException(status_code=403, detail="Access denied")
    
    try:
        users = user_service.list_users()
        user = next((u for u in users if u["username"] == username), None)
        if not user:
            raise HTTPException(status_code=404, detail="User not found")
        return user
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@router.delete("/{username}")
async def delete_user(
    username: str,
    current_user: dict = Depends(require_admin)
):
    """Delete a user (Admin only)"""
    try:
        result = user_service.delete_user(username)
        return result
    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e))
```

### Admin Routes (routers/admin.py)

```python
from fastapi import APIRouter, Depends, HTTPException
from your_app.services.cognito_user_service import CognitoUserService
from your_app.services.cognito_auth import require_admin

router = APIRouter()
user_service = CognitoUserService()

@router.get("/stats")
async def get_stats(current_user: dict = Depends(require_admin)):
    """Get system statistics (Admin only)"""
    try:
        users = user_service.list_users()
        groups = user_service.list_groups()
        
        stats = {
            "total_users": len(users),
            "total_groups": len(groups),
            "users_by_status": {},
            "users_by_group": {}
        }
        
        # Count users by status
        for user in users:
            status = user.get("status", "UNKNOWN")
            stats["users_by_status"][status] = stats["users_by_status"].get(status, 0) + 1
        
        # Count users by group
        for group in groups:
            group_name = group["GroupName"]
            users_in_group = [u for u in users if group_name in u.get("groups", [])]
            stats["users_by_group"][group_name] = len(users_in_group)
        
        return stats
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@router.get("/users/report")
async def get_user_report(current_user: dict = Depends(require_admin)):
    """Generate user report (Admin only)"""
    try:
        users = user_service.list_users()
        return {
            "generated_at": "2025-10-29T08:26:04.169Z",
            "total_users": len(users),
            "users": users
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
```

## Step 7: Testing Integration

### Basic Functionality Test

Create `test_integration.py`:

```python
import os
import sys
sys.path.append('.')

from your_app.services.cognito_auth import CognitoAuthService
from your_app.services.cognito_user_service import CognitoUserService

def test_services():
    print("Testing Cognito integration...")
    
    # Test auth service
    auth_service = CognitoAuthService()
    print(f"Auth service initialized - Mock mode: {auth_service.mock_mode}")
    
    # Test user service
    user_service = CognitoUserService()
    print(f"User service initialized - Mock mode: {user_service.mock_mode}")
    
    # Test listing users
    try:
        users = user_service.list_users()
        print(f"Found {len(users)} users")
    except Exception as e:
        print(f"Error listing users: {e}")
    
    # Test listing groups
    try:
        groups = user_service.list_groups()
        print(f"Found {len(groups)} groups")
    except Exception as e:
        print(f"Error listing groups: {e}")
    
    print("Integration test completed!")

if __name__ == "__main__":
    test_services()
```

Run the test:
```bash
python test_integration.py
```

### API Testing

Start your application:
```bash
python main.py
```

Test endpoints:
```bash
# Health check
curl http://localhost:8000/health

# Auth health check
curl http://localhost:8000/api/auth/health

# List users (requires admin token)
curl -H "Authorization: Bearer YOUR_ADMIN_TOKEN" http://localhost:8000/api/users/
```

## Step 8: Production Considerations

### Security Configuration

1. **Environment Variables**:
```bash
# Production .env
COGNITO_USER_POOL_ID=us-east-1_ProdPoolId
COGNITO_CLIENT_ID=prod-client-id
ENVIRONMENT=production
LOG_LEVEL=WARNING
```

2. **CORS Configuration**:
```python
app.add_middleware(
    CORSMiddleware,
    allow_origins=["https://yourdomain.com"],  # Specific domains only
    allow_credentials=True,
    allow_methods=["GET", "POST", "PUT", "DELETE"],
    allow_headers=["Authorization", "Content-Type"],
)
```

3. **Rate Limiting**:
```python
from slowapi import Limiter, _rate_limit_exceeded_handler
from slowapi.util import get_remote_address
from slowapi.errors import RateLimitExceeded

limiter = Limiter(key_func=get_remote_address)
app.state.limiter = limiter
app.add_exception_handler(RateLimitExceeded, _rate_limit_exceeded_handler)

@router.post("/")
@limiter.limit("10/minute")
async def create_user(request: Request, ...):
    # Your endpoint logic
```

### Monitoring and Logging

1. **Structured Logging**:
```python
import structlog

logger = structlog.get_logger()

@router.post("/")
async def create_user(user_data: CreateUserRequest, ...):
    logger.info("User creation requested", 
                email=user_data.email, 
                admin_user=current_user["username"])
    # ... rest of the logic
```

2. **Health Checks**:
```python
@app.get("/health/detailed")
async def detailed_health():
    health_status = {
        "status": "healthy",
        "timestamp": datetime.utcnow().isoformat(),
        "services": {}
    }
    
    # Test Cognito connectivity
    try:
        auth_service = CognitoAuthService()
        health_status["services"]["cognito_auth"] = "healthy"
    except Exception as e:
        health_status["services"]["cognito_auth"] = f"unhealthy: {str(e)}"
        health_status["status"] = "degraded"
    
    return health_status
```

## Step 9: Customization Options

### Custom User Attributes

Modify `cognito_user_service.py` to support custom attributes:

```python
def create_user(self, email: str, temporary_password: str, 
                custom_attributes: dict = None, send_email: bool = True):
    # ... existing code ...
    
    user_attributes = [
        f'Name=email,Value={email}',
        f'Name=name,Value={base_username}',
        'Name=email_verified,Value=true'
    ]
    
    # Add custom attributes
    if custom_attributes:
        for key, value in custom_attributes.items():
            user_attributes.append(f'Name=custom:{key},Value={value}')
    
    # ... rest of the method
```

### Custom Authorization

Create custom authorization decorators:

```python
def require_permission(permission: str):
    def permission_checker(current_user: dict = Depends(get_current_user)):
        user_permissions = get_user_permissions(current_user.get("cognito:groups", []))
        if permission not in user_permissions:
            raise HTTPException(status_code=403, detail=f"Permission '{permission}' required")
        return current_user
    return permission_checker

def get_user_permissions(groups: list) -> list:
    permissions = []
    if "admin" in groups:
        permissions.extend(["read", "write", "delete", "admin"])
    elif "managers" in groups:
        permissions.extend(["read", "write", "manage"])
    elif "users" in groups:
        permissions.extend(["read", "write"])
    return permissions
```

### Email Templates

For custom email handling:

```python
def send_custom_welcome_email(email: str, username: str, temporary_password: str):
    # Your custom email logic here
    # Could use SES, SendGrid, etc.
    pass

# In create_user method:
if send_email and not use_cognito_email:
    send_custom_welcome_email(email, username, temporary_password)
```

## Step 10: Deployment

### Docker Configuration

Create `Dockerfile`:

```dockerfile
FROM python:3.9-slim

WORKDIR /app

COPY requirements.txt .
RUN pip install -r requirements.txt

COPY . .

EXPOSE 8000

CMD ["uvicorn", "main:app", "--host", "0.0.0.0", "--port", "8000"]
```

### Docker Compose

Create `docker-compose.yml`:

```yaml
version: '3.8'

services:
  api:
    build: .
    ports:
      - "8000:8000"
    environment:
      - COGNITO_USER_POOL_ID=${COGNITO_USER_POOL_ID}
      - COGNITO_CLIENT_ID=${COGNITO_CLIENT_ID}
      - AWS_REGION=${AWS_REGION}
      - AWS_PROFILE=${AWS_PROFILE}
    volumes:
      - ~/.aws:/root/.aws:ro  # Mount AWS credentials
    env_file:
      - .env
```

### AWS ECS/Fargate Deployment

Create task definition with appropriate IAM roles:

```json
{
  "family": "your-app",
  "taskRoleArn": "arn:aws:iam::account:role/your-app-task-role",
  "executionRoleArn": "arn:aws:iam::account:role/your-app-execution-role",
  "containerDefinitions": [
    {
      "name": "your-app",
      "image": "your-account.dkr.ecr.region.amazonaws.com/your-app:latest",
      "portMappings": [
        {
          "containerPort": 8000,
          "protocol": "tcp"
        }
      ],
      "environment": [
        {
          "name": "COGNITO_USER_POOL_ID",
          "value": "us-east-1_YourPoolId"
        }
      ]
    }
  ]
}
```

## Troubleshooting Common Issues

### 1. Credential Configuration

If you encounter AWS credential issues:

```python
# Add debug logging to services
import logging
logging.basicConfig(level=logging.DEBUG)

# Check AWS credentials
import boto3
session = boto3.Session()
credentials = session.get_credentials()
print(f"Access Key: {credentials.access_key[:10]}...")
```

### 2. Token Verification Issues

```python
# Add token debugging
def debug_token(token: str):
    import jwt
    try:
        # Decode without verification to see payload
        payload = jwt.decode(token, options={"verify_signature": False})
        print(f"Token payload: {payload}")
    except Exception as e:
        print(f"Token decode error: {e}")
```

### 3. CORS Issues

```python
# Add CORS debugging middleware
@app.middleware("http")
async def cors_debug(request: Request, call_next):
    print(f"Origin: {request.headers.get('origin')}")
    print(f"Method: {request.method}")
    response = await call_next(request)
    return response
```

## Next Steps

After successful integration:

1. **Monitor Performance**: Set up logging and monitoring
2. **Security Audit**: Review security configurations
3. **Load Testing**: Test with expected user loads
4. **Documentation**: Update your API documentation
5. **Training**: Train your team on the new system

## Support and Resources

- [AWS Cognito Documentation](https://docs.aws.amazon.com/cognito/)
- [FastAPI Documentation](https://fastapi.tiangolo.com/)
- [JWT.io](https://jwt.io/) for token debugging
- [Troubleshooting Guide](./07_troubleshooting.md)

This implementation guide provides a complete foundation for integrating the Cognito module into any FastAPI application. Customize as needed for your specific requirements.
