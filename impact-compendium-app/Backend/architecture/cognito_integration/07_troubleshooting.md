# Troubleshooting Guide

## Common Issues and Solutions

### AWS Credential Issues

#### Problem: "NoCredentialsError" or "Unable to locate credentials"

**Symptoms:**
```
botocore.exceptions.NoCredentialsError: Unable to locate credentials
```

**Solutions:**

1. **Check AWS CLI Configuration:**
```bash
aws configure list
aws sts get-caller-identity --profile your-profile
```

2. **Verify Environment Variables:**
```bash
echo $AWS_PROFILE
echo $AWS_REGION
```

3. **Test AWS CLI Access:**
```bash
aws cognito-idp describe-user-pool --user-pool-id your-pool-id --profile your-profile
```

4. **Force AWS Profile in Code:**
```python
import os
os.environ['AWS_PROFILE'] = 'your-profile'
os.environ['AWS_DEFAULT_REGION'] = 'us-east-1'
```

#### Problem: "AccessDenied" errors

**Symptoms:**
```
botocore.exceptions.ClientError: An error occurred (AccessDenied) when calling the DescribeUserPool operation
```

**Solutions:**

1. **Check IAM Permissions:**
```json
{
    "Version": "2012-10-17",
    "Statement": [
        {
            "Effect": "Allow",
            "Action": [
                "cognito-idp:DescribeUserPool",
                "cognito-idp:ListUsers",
                "cognito-idp:AdminCreateUser",
                "cognito-idp:AdminDeleteUser",
                "cognito-idp:AdminUpdateUserAttributes",
                "cognito-idp:AdminResetUserPassword",
                "cognito-idp:ListGroups",
                "cognito-idp:CreateGroup",
                "cognito-idp:DeleteGroup",
                "cognito-idp:AdminAddUserToGroup",
                "cognito-idp:AdminRemoveUserFromGroup"
            ],
            "Resource": "arn:aws:cognito-idp:region:account:userpool/your-pool-id"
        }
    ]
}
```

2. **Test Specific Permissions:**
```bash
aws cognito-idp list-users --user-pool-id your-pool-id --profile your-profile
```

### Token Verification Issues

#### Problem: "Invalid token" errors

**Symptoms:**
```
JWT verification failed: Invalid token
```

**Solutions:**

1. **Check Token Format:**
```python
def debug_token(token: str):
    parts = token.split('.')
    print(f"Token parts: {len(parts)}")
    if len(parts) == 3:
        import base64
        import json
        # Decode header
        header = json.loads(base64.urlsafe_b64decode(parts[0] + '=='))
        print(f"Header: {header}")
        # Decode payload
        payload = json.loads(base64.urlsafe_b64decode(parts[1] + '=='))
        print(f"Payload: {payload}")
```

2. **Verify User Pool Configuration:**
```bash
aws cognito-idp describe-user-pool --user-pool-id your-pool-id
```

3. **Check JWKS URL:**
```python
import requests
jwks_url = f"https://cognito-idp.{region}.amazonaws.com/{user_pool_id}/.well-known/jwks.json"
response = requests.get(jwks_url)
print(f"JWKS Status: {response.status_code}")
print(f"JWKS Keys: {len(response.json().get('keys', []))}")
```

#### Problem: "Token expired" errors

**Symptoms:**
```
JWT verification failed: Token has expired
```

**Solutions:**

1. **Check Token Expiration:**
```python
import jwt
import datetime

def check_token_expiration(token: str):
    try:
        payload = jwt.decode(token, options={"verify_signature": False})
        exp = payload.get('exp')
        if exp:
            exp_time = datetime.datetime.fromtimestamp(exp)
            now = datetime.datetime.now()
            print(f"Token expires: {exp_time}")
            print(f"Current time: {now}")
            print(f"Expired: {now > exp_time}")
    except Exception as e:
        print(f"Error checking expiration: {e}")
```

2. **Implement Token Refresh:**
```python
async def refresh_token_if_needed(token: str, refresh_token: str):
    try:
        # Try to verify current token
        auth_service.verify_token(token)
        return token
    except Exception as e:
        if "expired" in str(e).lower():
            # Refresh token logic here
            return await refresh_access_token(refresh_token)
        raise e
```

### User Creation Issues

#### Problem: "UserNotFoundException" when creating users

**Symptoms:**
```
An error occurred (UserNotFoundException) when calling the AdminCreateUser operation
```

**Solutions:**

1. **Verify User Pool ID:**
```python
print(f"User Pool ID: {os.getenv('COGNITO_USER_POOL_ID')}")
```

2. **Check User Pool Exists:**
```bash
aws cognito-idp describe-user-pool --user-pool-id your-pool-id
```

3. **Use AWS CLI Fallback:**
```python
# The service automatically falls back to AWS CLI
# Check logs for "Creating user via AWS CLI" messages
```

#### Problem: "InvalidPasswordException"

**Symptoms:**
```
Password did not conform with policy: Password must have uppercase characters
```

**Solutions:**

1. **Check Password Policy:**
```bash
aws cognito-idp describe-user-pool --user-pool-id your-pool-id --query 'UserPool.Policies.PasswordPolicy'
```

2. **Generate Compliant Passwords:**
```python
import secrets
import string

def generate_temp_password(length=12):
    alphabet = string.ascii_letters + string.digits + "!@#$%^&*"
    password = ''.join(secrets.choice(alphabet) for _ in range(length))
    
    # Ensure policy compliance
    if not any(c.isupper() for c in password):
        password = password[:-1] + 'A'
    if not any(c.islower() for c in password):
        password = password[:-2] + 'a' + password[-1]
    if not any(c.isdigit() for c in password):
        password = password[:-3] + '1' + password[-2:]
    if not any(c in "!@#$%^&*" for c in password):
        password = password[:-4] + '!' + password[-3:]
    
    return password
```

### Email Delivery Issues

#### Problem: Users not receiving welcome emails

**Symptoms:**
- User created successfully but no email received
- Email in spam folder

**Solutions:**

1. **Check Email Configuration:**
```bash
aws cognito-idp describe-user-pool --user-pool-id your-pool-id --query 'UserPool.EmailConfiguration'
```

2. **Verify Message Action:**
```python
# Ensure send_email=True is being used
result = user_service.create_user(
    email="user@example.com",
    temporary_password="TempPass123!",
    send_email=True  # This should be True
)
```

3. **Check Spam Folders:**
- Emails from `no-reply@verificationemail.com` often go to spam
- Add to safe senders list

4. **Resend Welcome Message:**
```bash
aws cognito-idp admin-create-user \
  --user-pool-id your-pool-id \
  --username existing-username \
  --message-action RESEND
```

#### Problem: Email delivery delays

**Symptoms:**
- Emails arrive after 10-30 minutes
- Inconsistent delivery times

**Solutions:**

1. **Use Amazon SES:**
```bash
aws cognito-idp update-user-pool \
  --user-pool-id your-pool-id \
  --email-configuration EmailSendingAccount=DEVELOPER,SourceArn=arn:aws:ses:region:account:identity/yourdomain.com
```

2. **Monitor Email Limits:**
- Cognito default: 50 emails/day
- SES: Much higher limits

### FastAPI Integration Issues

#### Problem: "Module not found" errors

**Symptoms:**
```
ModuleNotFoundError: No module named 'app.services.cognito_auth'
```

**Solutions:**

1. **Check Import Paths:**
```python
# Ensure correct import paths
from your_app.services.cognito_auth import CognitoAuthService
```

2. **Verify File Structure:**
```
your_app/
├── __init__.py
├── services/
│   ├── __init__.py
│   └── cognito_auth.py
```

3. **Add to Python Path:**
```python
import sys
sys.path.append('/path/to/your/app')
```

#### Problem: Dependency injection not working

**Symptoms:**
```
FastAPI dependency injection fails for authentication
```

**Solutions:**

1. **Check Dependency Order:**
```python
# Correct order
async def endpoint(current_user: dict = Depends(get_current_user)):
    pass

# Not this
async def endpoint(current_user = Depends(get_current_user): dict):
    pass
```

2. **Verify Authentication Headers:**
```python
@app.middleware("http")
async def debug_auth(request: Request, call_next):
    auth_header = request.headers.get("authorization")
    print(f"Auth header: {auth_header}")
    response = await call_next(request)
    return response
```

### Mock Mode Issues

#### Problem: Mock mode not activating

**Symptoms:**
- Real AWS calls being made during testing
- Credential errors in test environment

**Solutions:**

1. **Force Mock Mode:**
```python
import os
os.environ['COGNITO_USER_POOL_ID'] = ''  # Empty string enables mock mode
```

2. **Check Mock Mode Status:**
```python
service = CognitoUserService()
print(f"Mock mode: {service.mock_mode}")
```

3. **Environment-Specific Configuration:**
```python
if os.getenv('ENVIRONMENT') == 'test':
    os.environ['COGNITO_USER_POOL_ID'] = ''
```

### Performance Issues

#### Problem: Slow token verification

**Symptoms:**
- API responses taking several seconds
- High latency on authenticated endpoints

**Solutions:**

1. **Cache JWKS:**
```python
import time
from functools import lru_cache

@lru_cache(maxsize=1)
def get_cached_jwks():
    return auth_service.get_jwks()

# Refresh cache periodically
def refresh_jwks_cache():
    get_cached_jwks.cache_clear()
    return get_cached_jwks()
```

2. **Optimize Token Verification:**
```python
# Cache decoded tokens for short periods
from functools import lru_cache
import hashlib

@lru_cache(maxsize=100)
def verify_token_cached(token_hash: str, token: str):
    return auth_service.verify_token(token)

def verify_with_cache(token: str):
    token_hash = hashlib.md5(token.encode()).hexdigest()
    return verify_token_cached(token_hash, token)
```

#### Problem: High memory usage

**Symptoms:**
- Memory usage increasing over time
- Out of memory errors

**Solutions:**

1. **Clear Caches Periodically:**
```python
import threading
import time

def cache_cleanup():
    while True:
        time.sleep(3600)  # Every hour
        get_cached_jwks.cache_clear()

# Start cleanup thread
cleanup_thread = threading.Thread(target=cache_cleanup, daemon=True)
cleanup_thread.start()
```

2. **Limit Cache Size:**
```python
@lru_cache(maxsize=50)  # Limit cache size
def cached_function():
    pass
```

## Debugging Tools

### Enable Debug Logging

```python
import logging

# Enable debug logging for specific modules
logging.getLogger('app.services.cognito_auth').setLevel(logging.DEBUG)
logging.getLogger('app.services.cognito_user_service').setLevel(logging.DEBUG)
logging.getLogger('botocore').setLevel(logging.DEBUG)
```

### Token Debugging Utility

```python
def debug_jwt_token(token: str):
    """Comprehensive token debugging"""
    import jwt
    import json
    import base64
    from datetime import datetime
    
    print("=== JWT Token Debug ===")
    
    try:
        # Split token
        parts = token.split('.')
        print(f"Token parts: {len(parts)}")
        
        if len(parts) != 3:
            print("❌ Invalid token format")
            return
        
        # Decode header
        header_data = base64.urlsafe_b64decode(parts[0] + '==')
        header = json.loads(header_data)
        print(f"Header: {json.dumps(header, indent=2)}")
        
        # Decode payload
        payload_data = base64.urlsafe_b64decode(parts[1] + '==')
        payload = json.loads(payload_data)
        print(f"Payload: {json.dumps(payload, indent=2)}")
        
        # Check expiration
        if 'exp' in payload:
            exp_time = datetime.fromtimestamp(payload['exp'])
            now = datetime.now()
            print(f"Expires: {exp_time}")
            print(f"Current: {now}")
            print(f"Valid: {now < exp_time}")
        
        # Check issuer
        if 'iss' in payload:
            expected_iss = f"https://cognito-idp.{region}.amazonaws.com/{user_pool_id}"
            print(f"Issuer: {payload['iss']}")
            print(f"Expected: {expected_iss}")
            print(f"Issuer valid: {payload['iss'] == expected_iss}")
        
    except Exception as e:
        print(f"❌ Token decode error: {e}")
```

### AWS Service Testing

```python
def test_aws_services():
    """Test AWS service connectivity"""
    import boto3
    from botocore.exceptions import ClientError
    
    print("=== AWS Service Test ===")
    
    try:
        # Test STS (credentials)
        sts = boto3.client('sts')
        identity = sts.get_caller_identity()
        print(f"✅ AWS Identity: {identity['Arn']}")
        
        # Test Cognito
        cognito = boto3.client('cognito-idp')
        user_pool = cognito.describe_user_pool(UserPoolId=user_pool_id)
        print(f"✅ Cognito User Pool: {user_pool['UserPool']['Name']}")
        
        # Test user listing
        users = cognito.list_users(UserPoolId=user_pool_id, Limit=1)
        print(f"✅ User listing: {len(users['Users'])} users found")
        
    except ClientError as e:
        print(f"❌ AWS Error: {e}")
    except Exception as e:
        print(f"❌ General Error: {e}")
```

### Health Check Endpoint

```python
@app.get("/health/detailed")
async def detailed_health():
    """Comprehensive health check"""
    health = {
        "status": "healthy",
        "timestamp": datetime.utcnow().isoformat(),
        "services": {},
        "environment": {
            "cognito_user_pool_id": os.getenv("COGNITO_USER_POOL_ID", "")[:10] + "...",
            "aws_region": os.getenv("AWS_REGION"),
            "environment": os.getenv("ENVIRONMENT")
        }
    }
    
    # Test auth service
    try:
        auth_service = CognitoAuthService()
        health["services"]["cognito_auth"] = {
            "status": "healthy",
            "mock_mode": auth_service.mock_mode
        }
    except Exception as e:
        health["services"]["cognito_auth"] = {
            "status": "unhealthy",
            "error": str(e)
        }
        health["status"] = "degraded"
    
    # Test user service
    try:
        user_service = CognitoUserService()
        users = user_service.list_users()
        health["services"]["cognito_users"] = {
            "status": "healthy",
            "user_count": len(users),
            "mock_mode": user_service.mock_mode
        }
    except Exception as e:
        health["services"]["cognito_users"] = {
            "status": "unhealthy",
            "error": str(e)
        }
        health["status"] = "degraded"
    
    return health
```

## Getting Help

### Log Analysis

When reporting issues, include:

1. **Environment Information:**
```bash
python --version
pip list | grep -E "(boto3|PyJWT|fastapi)"
aws --version
```

2. **Configuration (sanitized):**
```python
print(f"User Pool ID: {os.getenv('COGNITO_USER_POOL_ID', 'NOT_SET')[:10]}...")
print(f"AWS Region: {os.getenv('AWS_REGION', 'NOT_SET')}")
print(f"Environment: {os.getenv('ENVIRONMENT', 'NOT_SET')}")
```

3. **Error Logs:**
```python
import logging
logging.basicConfig(level=logging.DEBUG)
# Run your failing operation and capture logs
```

### Common Error Patterns

| Error Pattern | Likely Cause | Solution |
|---------------|--------------|----------|
| `NoCredentialsError` | AWS credentials not configured | Check AWS CLI configuration |
| `AccessDenied` | Insufficient IAM permissions | Review IAM policies |
| `ResourceNotFoundException` | Wrong User Pool ID | Verify COGNITO_USER_POOL_ID |
| `InvalidPasswordException` | Password policy violation | Check password requirements |
| `UserNotFoundException` | User doesn't exist | Verify username/email |
| `TokenExpired` | JWT token expired | Implement token refresh |
| `InvalidSignature` | Wrong JWKS or tampering | Verify User Pool configuration |

### Support Resources

- **AWS Cognito Documentation**: https://docs.aws.amazon.com/cognito/
- **FastAPI Documentation**: https://fastapi.tiangolo.com/
- **JWT Debugging**: https://jwt.io/
- **AWS CLI Reference**: https://docs.aws.amazon.com/cli/latest/reference/cognito-idp/

Remember to sanitize any sensitive information (tokens, credentials, user data) when seeking help or reporting issues.
