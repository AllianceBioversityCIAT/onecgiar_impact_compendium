# Utilities

## Overview

This document covers the utility functions and helper modules that support the Cognito integration.

## Email Utilities (`email_utils.py`)

### `extract_username_from_email(email: str) -> str`

Extracts the username portion from an email address.

```python
from app.utils.email_utils import extract_username_from_email

# Examples
username = extract_username_from_email("john.doe@example.com")
print(username)  # "john.doe"

username = extract_username_from_email("user123@company.org")
print(username)  # "user123"
```

**Use Cases:**
- Creating usernames from email addresses
- Extracting display names
- Form pre-population

### `generate_readable_username(email: str, max_attempts: int = 5) -> str`

Generates a clean, readable username from an email address.

```python
from app.utils.email_utils import generate_readable_username

# Examples
username = generate_readable_username("john.doe@example.com")
print(username)  # "johndoe"

username = generate_readable_username("maria_garcia@company.org")
print(username)  # "mariagarcia"

username = generate_readable_username("user.123@test.com")
print(username)  # "user123"
```

**Features:**
- Removes dots, underscores, and dashes
- Preserves alphanumeric characters
- Fallback to original if cleaned version is too short
- Consistent output for same input

**Algorithm:**
1. Extract username from email
2. Remove special characters (., _, -)
3. Validate minimum length (3 characters)
4. Return cleaned username or fallback to original

## Authentication Utilities

### Token Validation Helpers

```python
def is_token_expired(token: str) -> bool:
    """Check if JWT token is expired"""
    import jwt
    from datetime import datetime
    
    try:
        payload = jwt.decode(token, options={"verify_signature": False})
        exp = payload.get('exp')
        if exp:
            return datetime.now().timestamp() > exp
        return False
    except:
        return True

def get_token_expiry(token: str) -> datetime:
    """Get token expiration datetime"""
    import jwt
    from datetime import datetime
    
    try:
        payload = jwt.decode(token, options={"verify_signature": False})
        exp = payload.get('exp')
        if exp:
            return datetime.fromtimestamp(exp)
        return None
    except:
        return None

def extract_user_info(token: str) -> dict:
    """Extract user information from JWT token"""
    import jwt
    
    try:
        payload = jwt.decode(token, options={"verify_signature": False})
        return {
            "username": payload.get("username"),
            "email": payload.get("email"),
            "groups": payload.get("cognito:groups", []),
            "sub": payload.get("sub")
        }
    except:
        return {}
```

### Permission Helpers

```python
def get_user_permissions(groups: list) -> list:
    """Get permissions based on user groups"""
    permissions = set()
    
    group_permissions = {
        "admin": ["read", "write", "delete", "admin", "manage_users"],
        "managers": ["read", "write", "manage", "view_reports"],
        "researchers": ["read", "write", "create_studies"],
        "viewers": ["read", "view_reports"]
    }
    
    for group in groups:
        if group in group_permissions:
            permissions.update(group_permissions[group])
    
    return list(permissions)

def has_permission(user_groups: list, required_permission: str) -> bool:
    """Check if user has specific permission"""
    user_permissions = get_user_permissions(user_groups)
    return required_permission in user_permissions

def has_any_permission(user_groups: list, required_permissions: list) -> bool:
    """Check if user has any of the required permissions"""
    user_permissions = get_user_permissions(user_groups)
    return any(perm in user_permissions for perm in required_permissions)
```

## Password Utilities

### Password Generation

```python
import secrets
import string

def generate_secure_password(
    length: int = 12,
    include_uppercase: bool = True,
    include_lowercase: bool = True,
    include_numbers: bool = True,
    include_symbols: bool = True,
    exclude_ambiguous: bool = True
) -> str:
    """Generate a secure password meeting specified criteria"""
    
    characters = ""
    
    if include_lowercase:
        chars = string.ascii_lowercase
        if exclude_ambiguous:
            chars = chars.replace('l', '').replace('o', '')
        characters += chars
    
    if include_uppercase:
        chars = string.ascii_uppercase
        if exclude_ambiguous:
            chars = chars.replace('I', '').replace('O', '')
        characters += chars
    
    if include_numbers:
        chars = string.digits
        if exclude_ambiguous:
            chars = chars.replace('0', '').replace('1', '')
        characters += chars
    
    if include_symbols:
        chars = "!@#$%^&*"
        characters += chars
    
    if not characters:
        raise ValueError("At least one character type must be included")
    
    # Generate password
    password = ''.join(secrets.choice(characters) for _ in range(length))
    
    # Ensure at least one character from each required type
    if include_uppercase and not any(c.isupper() for c in password):
        password = password[:-1] + secrets.choice(string.ascii_uppercase)
    
    if include_lowercase and not any(c.islower() for c in password):
        password = password[:-1] + secrets.choice(string.ascii_lowercase)
    
    if include_numbers and not any(c.isdigit() for c in password):
        password = password[:-1] + secrets.choice(string.digits)
    
    if include_symbols and not any(c in "!@#$%^&*" for c in password):
        password = password[:-1] + secrets.choice("!@#$%^&*")
    
    return password

def validate_password_strength(password: str) -> dict:
    """Validate password strength against common criteria"""
    result = {
        "valid": True,
        "score": 0,
        "issues": [],
        "suggestions": []
    }
    
    # Length check
    if len(password) < 8:
        result["valid"] = False
        result["issues"].append("Password must be at least 8 characters long")
    else:
        result["score"] += 1
    
    # Character type checks
    if not any(c.isupper() for c in password):
        result["valid"] = False
        result["issues"].append("Password must contain uppercase letters")
    else:
        result["score"] += 1
    
    if not any(c.islower() for c in password):
        result["valid"] = False
        result["issues"].append("Password must contain lowercase letters")
    else:
        result["score"] += 1
    
    if not any(c.isdigit() for c in password):
        result["valid"] = False
        result["issues"].append("Password must contain numbers")
    else:
        result["score"] += 1
    
    if not any(c in "!@#$%^&*()_+-=[]{}|;:,.<>?" for c in password):
        result["suggestions"].append("Consider adding special characters for stronger security")
    else:
        result["score"] += 1
    
    # Additional strength checks
    if len(password) >= 12:
        result["score"] += 1
    
    if len(set(password)) / len(password) > 0.7:  # Character diversity
        result["score"] += 1
    
    return result
```

### Password Policy Validation

```python
def validate_cognito_password(password: str, policy: dict = None) -> dict:
    """Validate password against Cognito password policy"""
    
    default_policy = {
        "MinimumLength": 8,
        "RequireUppercase": True,
        "RequireLowercase": True,
        "RequireNumbers": True,
        "RequireSymbols": False
    }
    
    if policy:
        default_policy.update(policy)
    
    result = {"valid": True, "errors": []}
    
    # Length check
    if len(password) < default_policy["MinimumLength"]:
        result["valid"] = False
        result["errors"].append(f"Password must be at least {default_policy['MinimumLength']} characters")
    
    # Character requirements
    if default_policy["RequireUppercase"] and not any(c.isupper() for c in password):
        result["valid"] = False
        result["errors"].append("Password must contain uppercase characters")
    
    if default_policy["RequireLowercase"] and not any(c.islower() for c in password):
        result["valid"] = False
        result["errors"].append("Password must contain lowercase characters")
    
    if default_policy["RequireNumbers"] and not any(c.isdigit() for c in password):
        result["valid"] = False
        result["errors"].append("Password must contain numbers")
    
    if default_policy["RequireSymbols"] and not any(c in "!@#$%^&*()_+-=[]{}|;:,.<>?" for c in password):
        result["valid"] = False
        result["errors"].append("Password must contain symbols")
    
    return result
```

## Data Validation Utilities

### Email Validation

```python
import re

def validate_email(email: str) -> dict:
    """Validate email address format"""
    result = {"valid": True, "errors": []}
    
    if not email:
        result["valid"] = False
        result["errors"].append("Email is required")
        return result
    
    # Basic email regex
    email_pattern = r'^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$'
    
    if not re.match(email_pattern, email):
        result["valid"] = False
        result["errors"].append("Invalid email format")
    
    # Length check
    if len(email) > 254:
        result["valid"] = False
        result["errors"].append("Email too long (max 254 characters)")
    
    # Local part length check
    local_part = email.split('@')[0] if '@' in email else email
    if len(local_part) > 64:
        result["valid"] = False
        result["errors"].append("Email local part too long (max 64 characters)")
    
    return result

def normalize_email(email: str) -> str:
    """Normalize email address"""
    if not email:
        return email
    
    # Convert to lowercase
    email = email.lower().strip()
    
    # Remove dots from Gmail addresses (optional)
    # if email.endswith('@gmail.com'):
    #     local, domain = email.split('@')
    #     local = local.replace('.', '')
    #     email = f"{local}@{domain}"
    
    return email
```

### Username Validation

```python
def validate_username(username: str) -> dict:
    """Validate username format"""
    result = {"valid": True, "errors": []}
    
    if not username:
        result["valid"] = False
        result["errors"].append("Username is required")
        return result
    
    # Length check
    if len(username) < 3:
        result["valid"] = False
        result["errors"].append("Username must be at least 3 characters")
    
    if len(username) > 50:
        result["valid"] = False
        result["errors"].append("Username must be less than 50 characters")
    
    # Character check
    if not re.match(r'^[a-zA-Z0-9._-]+$', username):
        result["valid"] = False
        result["errors"].append("Username can only contain letters, numbers, dots, underscores, and hyphens")
    
    # Cannot start or end with special characters
    if username.startswith(('.', '_', '-')) or username.endswith(('.', '_', '-')):
        result["valid"] = False
        result["errors"].append("Username cannot start or end with special characters")
    
    return result
```

## Formatting Utilities

### Date/Time Formatting

```python
from datetime import datetime, timezone
from typing import Optional

def format_cognito_date(date_str: str) -> str:
    """Format Cognito date string to readable format"""
    try:
        # Parse Cognito date format
        dt = datetime.fromisoformat(date_str.replace('Z', '+00:00'))
        return dt.strftime('%Y-%m-%d %H:%M:%S UTC')
    except:
        return date_str

def format_relative_time(date_str: str) -> str:
    """Format date as relative time (e.g., '2 hours ago')"""
    try:
        dt = datetime.fromisoformat(date_str.replace('Z', '+00:00'))
        now = datetime.now(timezone.utc)
        diff = now - dt
        
        if diff.days > 0:
            return f"{diff.days} day{'s' if diff.days != 1 else ''} ago"
        elif diff.seconds > 3600:
            hours = diff.seconds // 3600
            return f"{hours} hour{'s' if hours != 1 else ''} ago"
        elif diff.seconds > 60:
            minutes = diff.seconds // 60
            return f"{minutes} minute{'s' if minutes != 1 else ''} ago"
        else:
            return "Just now"
    except:
        return date_str

def get_current_iso_timestamp() -> str:
    """Get current timestamp in ISO format"""
    return datetime.now(timezone.utc).isoformat()
```

### User Display Formatting

```python
def format_user_display_name(user: dict) -> str:
    """Generate display name for user"""
    # Try name attribute first
    if user.get('name'):
        return user['name']
    
    # Fall back to username
    if user.get('username'):
        return user['username']
    
    # Fall back to email prefix
    if user.get('email'):
        return user['email'].split('@')[0]
    
    return "Unknown User"

def format_user_status(status: str) -> dict:
    """Format user status with display info"""
    status_map = {
        'CONFIRMED': {'label': 'Active', 'color': 'green', 'icon': '✅'},
        'FORCE_CHANGE_PASSWORD': {'label': 'Pending', 'color': 'orange', 'icon': '⏳'},
        'UNCONFIRMED': {'label': 'Unconfirmed', 'color': 'red', 'icon': '❌'},
        'ARCHIVED': {'label': 'Archived', 'color': 'gray', 'icon': '📦'},
        'COMPROMISED': {'label': 'Compromised', 'color': 'red', 'icon': '⚠️'},
        'UNKNOWN': {'label': 'Unknown', 'color': 'gray', 'icon': '❓'}
    }
    
    return status_map.get(status, status_map['UNKNOWN'])

def format_groups_display(groups: list) -> str:
    """Format groups list for display"""
    if not groups:
        return "No groups"
    
    if len(groups) == 1:
        return groups[0]
    
    if len(groups) <= 3:
        return ", ".join(groups)
    
    return f"{', '.join(groups[:2])}, +{len(groups) - 2} more"
```

## Error Handling Utilities

### Exception Helpers

```python
from typing import Dict, Any
import traceback

def format_error_response(error: Exception, status_code: int = 500) -> Dict[str, Any]:
    """Format error for API response"""
    return {
        "error": str(error),
        "status_code": status_code,
        "type": type(error).__name__,
        "timestamp": get_current_iso_timestamp()
    }

def log_error_with_context(error: Exception, context: Dict[str, Any] = None):
    """Log error with additional context"""
    import logging
    logger = logging.getLogger(__name__)
    
    error_info = {
        "error": str(error),
        "type": type(error).__name__,
        "traceback": traceback.format_exc(),
        "context": context or {}
    }
    
    logger.error(f"Error occurred: {error_info}")

def safe_execute(func, default_value=None, log_errors=True):
    """Safely execute function with error handling"""
    try:
        return func()
    except Exception as e:
        if log_errors:
            log_error_with_context(e, {"function": func.__name__})
        return default_value
```

## Configuration Utilities

### Environment Helpers

```python
import os
from typing import Union, Optional

def get_env_var(
    key: str, 
    default: Optional[str] = None, 
    required: bool = False,
    var_type: type = str
) -> Union[str, int, bool, None]:
    """Get environment variable with type conversion"""
    value = os.getenv(key, default)
    
    if required and value is None:
        raise ValueError(f"Required environment variable '{key}' not set")
    
    if value is None:
        return None
    
    # Type conversion
    if var_type == bool:
        return value.lower() in ('true', '1', 'yes', 'on')
    elif var_type == int:
        try:
            return int(value)
        except ValueError:
            if required:
                raise ValueError(f"Environment variable '{key}' must be an integer")
            return default
    elif var_type == float:
        try:
            return float(value)
        except ValueError:
            if required:
                raise ValueError(f"Environment variable '{key}' must be a float")
            return default
    
    return value

def validate_required_env_vars(required_vars: list) -> dict:
    """Validate that all required environment variables are set"""
    missing = []
    present = {}
    
    for var in required_vars:
        value = os.getenv(var)
        if value:
            present[var] = value
        else:
            missing.append(var)
    
    return {
        "valid": len(missing) == 0,
        "missing": missing,
        "present": list(present.keys())
    }
```

## Testing Utilities

### Mock Data Generators

```python
import random
import string
from datetime import datetime, timedelta

def generate_mock_user(username: str = None) -> dict:
    """Generate mock user data for testing"""
    if not username:
        username = ''.join(random.choices(string.ascii_lowercase, k=8))
    
    return {
        "username": username,
        "email": f"{username}@example.com",
        "status": random.choice(["CONFIRMED", "FORCE_CHANGE_PASSWORD"]),
        "enabled": random.choice([True, False]),
        "created_date": (datetime.now() - timedelta(days=random.randint(1, 365))).isoformat(),
        "last_modified_date": (datetime.now() - timedelta(days=random.randint(0, 30))).isoformat(),
        "mfa_enabled": random.choice([True, False]),
        "groups": random.sample(["admin", "researchers", "viewers"], random.randint(0, 2))
    }

def generate_mock_users(count: int) -> list:
    """Generate multiple mock users"""
    return [generate_mock_user() for _ in range(count)]

def generate_mock_jwt_payload(username: str = "testuser") -> dict:
    """Generate mock JWT payload for testing"""
    now = datetime.now()
    return {
        "sub": "12345678-1234-1234-1234-123456789012",
        "username": username,
        "email": f"{username}@example.com",
        "cognito:groups": ["admin"],
        "iss": "https://cognito-idp.us-east-1.amazonaws.com/us-east-1_TestPool",
        "aud": "test-client-id",
        "token_use": "access",
        "scope": "aws.cognito.signin.user.admin",
        "auth_time": int(now.timestamp()),
        "iat": int(now.timestamp()),
        "exp": int((now + timedelta(hours=1)).timestamp())
    }
```

## Usage Examples

### Complete Utility Usage

```python
from app.utils.email_utils import generate_readable_username, extract_username_from_email

# Email processing
email = "john.doe@company.com"
username = generate_readable_username(email)
print(f"Generated username: {username}")  # "johndoe"

# Password generation
password = generate_secure_password(length=12, exclude_ambiguous=True)
validation = validate_cognito_password(password)
print(f"Password valid: {validation['valid']}")

# User formatting
user_data = {
    "username": "johndoe",
    "email": "john@example.com",
    "status": "CONFIRMED",
    "groups": ["admin", "researchers"]
}

display_name = format_user_display_name(user_data)
status_info = format_user_status(user_data["status"])
groups_display = format_groups_display(user_data["groups"])

print(f"User: {display_name}")
print(f"Status: {status_info['label']} {status_info['icon']}")
print(f"Groups: {groups_display}")
```

These utilities provide a comprehensive foundation for working with the Cognito integration module, handling common tasks like data validation, formatting, and testing support.
