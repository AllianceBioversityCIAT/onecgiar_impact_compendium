# User Management

## Overview

The user management module (`cognito_user_service.py`) provides comprehensive CRUD operations for AWS Cognito users with both boto3 and AWS CLI implementations.

## CognitoUserService Class

### Initialization

```python
from app.services.cognito_user_service import CognitoUserService

user_service = CognitoUserService()
```

The service automatically:
- Detects AWS credentials configuration
- Falls back to AWS CLI if boto3 fails
- Enables mock mode for development

## Core Methods

### `create_user(email: str, temporary_password: str, send_email: bool = True) -> dict`

Creates a new user with readable username generation.

```python
result = user_service.create_user(
    email="john.doe@example.com",
    temporary_password="TempPass123!",
    send_email=True  # Cognito sends welcome email
)

print(result)
# {
#     'username': 'johndoe',
#     'email': 'john.doe@example.com',
#     'status': 'FORCE_CHANGE_PASSWORD',
#     'created': '2025-10-29T08:26:04.169000-05:00'
# }
```

**Features:**
- Generates readable usernames from email
- Optional email notifications
- AWS CLI fallback for reliability
- Automatic email verification

### `list_users() -> List[dict]`

Lists all users in the User Pool with detailed information.

```python
users = user_service.list_users()

for user in users:
    print(f"Username: {user['username']}")
    print(f"Email: {user['email']}")
    print(f"Status: {user['status']}")
    print(f"Groups: {user['groups']}")
    print(f"Enabled: {user['enabled']}")
    print("---")
```

**Returns:**
```python
[
    {
        'username': 'johndoe',
        'email': 'john@example.com',
        'status': 'CONFIRMED',
        'enabled': True,
        'created_date': '2025-10-29T08:26:04.169000-05:00',
        'last_modified_date': '2025-10-29T08:26:04.169000-05:00',
        'mfa_enabled': False,
        'groups': ['admin', 'researchers']
    }
]
```

### `update_user(username: str, name: str, role: str) -> dict`

Updates user attributes.

```python
result = user_service.update_user(
    username="johndoe",
    name="John Doe",
    role="researcher"
)
```

### `delete_user(username: str) -> dict`

Deletes a user from the User Pool.

```python
result = user_service.delete_user("johndoe")
print(result)  # {'username': 'johndoe', 'deleted': True}
```

### `reset_password(username: str) -> dict`

Resets user password (forces password change).

```python
result = user_service.reset_password("johndoe")
print(result)
# {
#     'username': 'johndoe',
#     'password_reset': True,
#     'status': 'FORCE_CHANGE_PASSWORD'
# }
```

## Username Generation

### Email Utilities Integration

The service uses `email_utils.py` for intelligent username generation:

```python
from app.utils.email_utils import extract_username_from_email, generate_readable_username

# Examples
extract_username_from_email("john.doe@example.com")  # "john.doe"
generate_readable_username("john.doe@example.com")   # "johndoe"
generate_readable_username("maria_garcia@company.org")  # "mariagarcia"
```

### Username Rules

1. **Clean Format**: Removes dots, underscores, dashes
2. **Readable**: No random suffixes
3. **Consistent**: Same email always generates same username
4. **Fallback**: Uses original if cleaned version is too short

## AWS CLI Integration

### Automatic Fallback

The service automatically uses AWS CLI when boto3 fails:

```python
# This happens automatically in create_user()
cmd = [
    'aws', 'cognito-idp', 'admin-create-user',
    '--user-pool-id', self.user_pool_id,
    '--username', username,
    '--user-attributes', f'Name=email,Value={email}',
    '--temporary-password', temporary_password,
    '--message-action', 'RESEND' if send_email else 'SUPPRESS',
    '--profile', 'IBD-DEV',
    '--region', 'us-east-1'
]
```

### Benefits

- **Reliability**: Works when boto3 credentials fail
- **Consistency**: Same results as direct AWS CLI usage
- **Error Handling**: Detailed error messages from AWS CLI

## Email Notifications

### Automatic Email Sending

```python
# Send welcome email with temporary password
user_service.create_user(
    email="user@example.com",
    temporary_password="TempPass123!",
    send_email=True  # Cognito sends email
)

# Create user without email (manual password delivery)
user_service.create_user(
    email="user@example.com",
    temporary_password="TempPass123!",
    send_email=False  # You handle password delivery
)
```

### Email Configuration

The service respects the `send_email` parameter:
- `True`: Uses `--message-action RESEND` and `--desired-delivery-mediums EMAIL`
- `False`: Uses `--message-action SUPPRESS`

## Mock Mode

### Development Testing

```python
import os

# Enable mock mode
os.environ['COGNITO_USER_POOL_ID'] = ''

user_service = CognitoUserService()
print(user_service.mock_mode)  # True

# Mock responses for testing
users = user_service.list_users()
# Returns predefined mock data
```

### Mock Data

```python
def _mock_list_users(self) -> List[Dict[str, Any]]:
    return [
        {
            'username': 'user_12345678',
            'email': 'admin@example.com',
            'status': 'CONFIRMED',
            'enabled': True,
            'groups': ['admin']
        },
        {
            'username': 'user_87654321',
            'email': 'researcher@example.com',
            'status': 'CONFIRMED',
            'enabled': True,
            'groups': ['researchers']
        }
    ]
```

## Error Handling

### Exception Types

```python
try:
    result = user_service.create_user(
        email="invalid-email",
        temporary_password="weak"
    )
except subprocess.CalledProcessError as e:
    # AWS CLI errors
    print(f"AWS CLI error: {e.stderr}")
except Exception as e:
    # General errors
    print(f"Error: {str(e)}")
```

### Common Errors

1. **User Already Exists**: Username conflict
2. **Invalid Email**: Malformed email address
3. **Weak Password**: Doesn't meet policy requirements
4. **Credential Issues**: AWS authentication problems

## Usage Examples

### Complete User Lifecycle

```python
from app.services.cognito_user_service import CognitoUserService

user_service = CognitoUserService()

# 1. Create user
user = user_service.create_user(
    email="newuser@example.com",
    temporary_password="TempPass123!",
    send_email=True
)
print(f"Created user: {user['username']}")

# 2. List all users
users = user_service.list_users()
print(f"Total users: {len(users)}")

# 3. Update user
updated = user_service.update_user(
    username=user['username'],
    name="New User",
    role="researcher"
)

# 4. Reset password
reset_result = user_service.reset_password(user['username'])
print(f"Password reset: {reset_result['password_reset']}")

# 5. Delete user (if needed)
# deleted = user_service.delete_user(user['username'])
```

### Batch User Creation

```python
new_users = [
    {"email": "user1@example.com", "password": "TempPass123!"},
    {"email": "user2@example.com", "password": "TempPass456!"},
    {"email": "user3@example.com", "password": "TempPass789!"}
]

created_users = []
for user_data in new_users:
    try:
        result = user_service.create_user(
            email=user_data["email"],
            temporary_password=user_data["password"],
            send_email=False  # Handle email manually for batch
        )
        created_users.append(result)
        print(f"✅ Created: {result['username']}")
    except Exception as e:
        print(f"❌ Failed to create {user_data['email']}: {e}")

print(f"Successfully created {len(created_users)} users")
```

### User Search and Filtering

```python
# Get all users
all_users = user_service.list_users()

# Filter by status
confirmed_users = [u for u in all_users if u['status'] == 'CONFIRMED']
pending_users = [u for u in all_users if u['status'] == 'FORCE_CHANGE_PASSWORD']

# Filter by groups
admin_users = [u for u in all_users if 'admin' in u['groups']]
researcher_users = [u for u in all_users if 'researchers' in u['groups']]

print(f"Confirmed: {len(confirmed_users)}")
print(f"Pending: {len(pending_users)}")
print(f"Admins: {len(admin_users)}")
print(f"Researchers: {len(researcher_users)}")
```

## Configuration

### Environment Variables

```bash
COGNITO_USER_POOL_ID=us-east-1_YourPoolId
COGNITO_CLIENT_ID=your-client-id
COGNITO_REGION=us-east-1
AWS_REGION=us-east-1
AWS_PROFILE=your-profile
```

### Password Policy

Ensure your Cognito User Pool password policy matches your temporary passwords:

```json
{
  "MinimumLength": 8,
  "RequireUppercase": true,
  "RequireLowercase": true,
  "RequireNumbers": true,
  "RequireSymbols": false,
  "TemporaryPasswordValidityDays": 7
}
```

## Testing

### Unit Tests

```python
import pytest
from app.services.cognito_user_service import CognitoUserService

def test_user_service_initialization():
    service = CognitoUserService()
    assert service is not None

def test_username_generation():
    from app.utils.email_utils import generate_readable_username
    username = generate_readable_username("john.doe@example.com")
    assert username == "johndoe"

def test_mock_mode():
    import os
    os.environ['COGNITO_USER_POOL_ID'] = ''
    service = CognitoUserService()
    users = service.list_users()
    assert len(users) > 0  # Mock data
```

## Next Steps

- [Group Management](./04_group_management.md)
- [API Reference](./05_api_reference.md)
- [Utilities](./06_utilities.md)
