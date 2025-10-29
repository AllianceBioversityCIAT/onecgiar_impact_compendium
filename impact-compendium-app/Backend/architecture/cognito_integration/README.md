# AWS Cognito Integration Module

## Overview

This module provides a complete AWS Cognito integration for user authentication, user management, and group management. It includes both boto3 SDK and AWS CLI implementations to handle credential configuration issues in different environments.

## Architecture Components

- **Authentication Service** (`cognito_auth.py`) - JWT token verification and user authentication
- **User Management Service** (`cognito_user_service.py`) - User CRUD operations and group management
- **Email Utilities** (`email_utils.py`) - Username extraction and email handling
- **API Routes** (`users.py`, `auth.py`, `admin.py`) - REST API endpoints

## Key Features

- ✅ JWT token authentication with Cognito
- ✅ User creation with email notifications
- ✅ User management (CRUD operations)
- ✅ Group management and user assignments
- ✅ AWS CLI fallback for credential issues
- ✅ Readable username generation
- ✅ Mock mode for development/testing

## Documentation Structure

1. [Setup Guide](./01_setup_guide.md) - Installation and configuration
2. [Authentication Module](./02_authentication.md) - JWT token handling
3. [User Management](./03_user_management.md) - User CRUD operations
4. [Group Management](./04_group_management.md) - Group operations
5. [API Reference](./05_api_reference.md) - REST API endpoints
6. [Utilities](./06_utilities.md) - Helper functions and utilities
7. [Troubleshooting](./07_troubleshooting.md) - Common issues and solutions
8. [Implementation Guide](./08_implementation_guide.md) - How to integrate in other applications

## Quick Start

```python
from app.services.cognito_user_service import CognitoUserService
from app.services.cognito_auth import CognitoAuthService

# Initialize services
user_service = CognitoUserService()
auth_service = CognitoAuthService()

# Create a user
result = user_service.create_user(
    email="user@example.com",
    temporary_password="TempPass123!",
    send_email=True
)

# Verify token
payload = auth_service.verify_token(jwt_token)
```

## Environment Variables

```bash
COGNITO_USER_POOL_ID=us-east-1_YourPoolId
COGNITO_CLIENT_ID=your-client-id
COGNITO_REGION=us-east-1
AWS_REGION=us-east-1
AWS_PROFILE=your-profile
```

## Dependencies

- `boto3` - AWS SDK for Python
- `PyJWT` - JWT token handling
- `cryptography` - JWT signature verification
- `requests` - HTTP requests for JWKS

## License

This module is part of the Impact Compendium application and follows the same licensing terms.
