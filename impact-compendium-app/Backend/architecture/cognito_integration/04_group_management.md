# Group Management

## Overview

The group management functionality in `CognitoUserService` provides comprehensive operations for managing Cognito User Pool groups and user group assignments.

## Group Operations

### `list_groups() -> List[dict]`

Lists all groups in the User Pool.

```python
from app.services.cognito_user_service import CognitoUserService

user_service = CognitoUserService()
groups = user_service.list_groups()

for group in groups:
    print(f"Group: {group['GroupName']}")
    print(f"Description: {group['Description']}")
    print(f"Created: {group['CreationDate']}")
    print("---")
```

**Returns:**
```python
[
    {
        'GroupName': 'admin',
        'Description': 'Administrators group',
        'CreationDate': '2024-01-01T00:00:00Z',
        'LastModifiedDate': '2024-01-01T00:00:00Z'
    },
    {
        'GroupName': 'researchers',
        'Description': 'Researchers group',
        'CreationDate': '2024-01-01T00:00:00Z',
        'LastModifiedDate': '2024-01-01T00:00:00Z'
    }
]
```

### `create_group(group_name: str, description: str = "") -> dict`

Creates a new group in the User Pool.

```python
result = user_service.create_group(
    group_name="data_analysts",
    description="Data analysts and statisticians"
)

print(result)
# {
#     'group_name': 'data_analysts',
#     'description': 'Data analysts and statisticians',
#     'created': True
# }
```

### `delete_group(group_name: str) -> None`

Deletes a group from the User Pool.

```python
user_service.delete_group("old_group")
```

**Note**: Users in the group will be automatically removed from the group before deletion.

## User-Group Assignment

### `add_user_to_group(username: str, group_name: str) -> dict`

Adds a user to a specific group.

```python
result = user_service.add_user_to_group(
    username="johndoe",
    group_name="researchers"
)

print(result)
# {
#     'username': 'johndoe',
#     'group_name': 'researchers',
#     'added': True
# }
```

### `remove_user_from_group(username: str, group_name: str) -> dict`

Removes a user from a specific group.

```python
result = user_service.remove_user_from_group(
    username="johndoe",
    group_name="researchers"
)

print(result)
# {
#     'username': 'johndoe',
#     'group_name': 'researchers',
#     'removed': True
# }
```

## Group-Based Authorization

### JWT Token Groups

When users authenticate, their group memberships are included in the JWT token:

```json
{
  "sub": "user-uuid",
  "username": "johndoe",
  "cognito:groups": ["admin", "researchers"],
  "email": "john@example.com"
}
```

### Authorization Decorators

```python
from fastapi import Depends, HTTPException
from app.services.cognito_auth import get_current_user

def require_group(required_group: str):
    """Decorator to require specific group membership"""
    def group_checker(current_user: dict = Depends(get_current_user)):
        user_groups = current_user.get('cognito:groups', [])
        if required_group not in user_groups:
            raise HTTPException(
                status_code=403, 
                detail=f"Group '{required_group}' required"
            )
        return current_user
    return group_checker

def require_any_group(required_groups: list):
    """Decorator to require any of the specified groups"""
    def group_checker(current_user: dict = Depends(get_current_user)):
        user_groups = current_user.get('cognito:groups', [])
        if not any(group in user_groups for group in required_groups):
            raise HTTPException(
                status_code=403, 
                detail=f"One of these groups required: {required_groups}"
            )
        return current_user
    return group_checker
```

### Usage in Routes

```python
from fastapi import APIRouter, Depends

router = APIRouter()

@router.get("/admin-only")
async def admin_endpoint(
    current_user: dict = Depends(require_group("admin"))
):
    return {"message": "Admin access granted"}

@router.get("/researchers-only")
async def researchers_endpoint(
    current_user: dict = Depends(require_group("researchers"))
):
    return {"message": "Researchers access granted"}

@router.get("/staff-only")
async def staff_endpoint(
    current_user: dict = Depends(require_any_group(["admin", "researchers"]))
):
    return {"message": "Staff access granted"}
```

## Common Group Patterns

### Standard Group Structure

```python
# Create standard groups for most applications
standard_groups = [
    {"name": "admin", "description": "System administrators"},
    {"name": "managers", "description": "Project managers"},
    {"name": "researchers", "description": "Research staff"},
    {"name": "viewers", "description": "Read-only access"}
]

for group in standard_groups:
    try:
        user_service.create_group(
            group_name=group["name"],
            description=group["description"]
        )
        print(f"✅ Created group: {group['name']}")
    except Exception as e:
        print(f"❌ Failed to create {group['name']}: {e}")
```

### Hierarchical Permissions

```python
def get_user_permissions(user_groups: list) -> list:
    """Get permissions based on group hierarchy"""
    permissions = []
    
    if "admin" in user_groups:
        permissions.extend(["read", "write", "delete", "admin"])
    elif "managers" in user_groups:
        permissions.extend(["read", "write", "manage"])
    elif "researchers" in user_groups:
        permissions.extend(["read", "write"])
    elif "viewers" in user_groups:
        permissions.extend(["read"])
    
    return list(set(permissions))  # Remove duplicates

# Usage
current_user_groups = ["researchers", "viewers"]
permissions = get_user_permissions(current_user_groups)
print(permissions)  # ["read", "write"]
```

## Bulk Group Operations

### Batch User Assignment

```python
def assign_users_to_group(usernames: list, group_name: str):
    """Assign multiple users to a group"""
    results = []
    
    for username in usernames:
        try:
            result = user_service.add_user_to_group(username, group_name)
            results.append({"username": username, "success": True})
            print(f"✅ Added {username} to {group_name}")
        except Exception as e:
            results.append({"username": username, "success": False, "error": str(e)})
            print(f"❌ Failed to add {username} to {group_name}: {e}")
    
    return results

# Usage
new_researchers = ["user1", "user2", "user3"]
results = assign_users_to_group(new_researchers, "researchers")
```

### Group Migration

```python
def migrate_users_between_groups(from_group: str, to_group: str):
    """Move all users from one group to another"""
    # Get all users
    all_users = user_service.list_users()
    
    # Find users in the source group
    users_to_migrate = [
        user for user in all_users 
        if from_group in user.get('groups', [])
    ]
    
    print(f"Migrating {len(users_to_migrate)} users from {from_group} to {to_group}")
    
    for user in users_to_migrate:
        username = user['username']
        try:
            # Remove from old group
            user_service.remove_user_from_group(username, from_group)
            # Add to new group
            user_service.add_user_to_group(username, to_group)
            print(f"✅ Migrated {username}")
        except Exception as e:
            print(f"❌ Failed to migrate {username}: {e}")

# Usage
migrate_users_between_groups("old_researchers", "researchers")
```

## Group Analytics

### Group Statistics

```python
def get_group_statistics():
    """Get statistics about group usage"""
    all_users = user_service.list_users()
    all_groups = user_service.list_groups()
    
    stats = {
        "total_groups": len(all_groups),
        "total_users": len(all_users),
        "group_membership": {}
    }
    
    # Count users per group
    for group in all_groups:
        group_name = group['GroupName']
        users_in_group = [
            user for user in all_users 
            if group_name in user.get('groups', [])
        ]
        stats["group_membership"][group_name] = len(users_in_group)
    
    # Users without groups
    users_without_groups = [
        user for user in all_users 
        if not user.get('groups', [])
    ]
    stats["users_without_groups"] = len(users_without_groups)
    
    return stats

# Usage
stats = get_group_statistics()
print(f"Total groups: {stats['total_groups']}")
print(f"Total users: {stats['total_users']}")
print("Group membership:")
for group, count in stats['group_membership'].items():
    print(f"  {group}: {count} users")
print(f"Users without groups: {stats['users_without_groups']}")
```

### User Group Report

```python
def generate_user_group_report():
    """Generate a detailed report of user group assignments"""
    all_users = user_service.list_users()
    
    report = []
    for user in all_users:
        report.append({
            "username": user['username'],
            "email": user['email'],
            "status": user['status'],
            "groups": user.get('groups', []),
            "group_count": len(user.get('groups', [])),
            "enabled": user['enabled']
        })
    
    # Sort by username
    report.sort(key=lambda x: x['username'])
    
    return report

# Usage
report = generate_user_group_report()
for user in report:
    groups_str = ", ".join(user['groups']) if user['groups'] else "No groups"
    print(f"{user['username']:20} | {user['email']:30} | {groups_str}")
```

## Mock Mode Groups

### Mock Group Data

```python
def _mock_list_groups(self) -> List[Dict[str, Any]]:
    return [
        {
            'GroupName': 'admin',
            'Description': 'Administrators group',
            'CreationDate': '2024-01-01T00:00:00Z',
            'LastModifiedDate': '2024-01-01T00:00:00Z'
        },
        {
            'GroupName': 'researchers',
            'Description': 'Researchers group',
            'CreationDate': '2024-01-01T00:00:00Z',
            'LastModifiedDate': '2024-01-01T00:00:00Z'
        }
    ]
```

## Error Handling

### Common Group Errors

```python
try:
    user_service.create_group("new_group", "Description")
except Exception as e:
    if "already exists" in str(e).lower():
        print("Group already exists")
    elif "invalid" in str(e).lower():
        print("Invalid group name")
    else:
        print(f"Unexpected error: {e}")

try:
    user_service.add_user_to_group("username", "nonexistent_group")
except Exception as e:
    if "not found" in str(e).lower():
        print("Group or user not found")
    elif "already" in str(e).lower():
        print("User already in group")
    else:
        print(f"Unexpected error: {e}")
```

## Best Practices

### Group Naming

- Use lowercase with underscores: `data_analysts`
- Be descriptive: `research_coordinators` not `rc`
- Avoid spaces and special characters
- Use consistent naming patterns

### Group Design

1. **Principle of Least Privilege**: Give minimum necessary permissions
2. **Role-Based**: Groups should represent roles, not individuals
3. **Hierarchical**: Consider permission inheritance
4. **Maintainable**: Keep group structure simple and logical

### Security Considerations

1. **Regular Audits**: Review group memberships regularly
2. **Temporary Access**: Remove users from groups when roles change
3. **Group Permissions**: Document what each group can access
4. **Monitoring**: Log group membership changes

## Testing

### Group Management Tests

```python
import pytest
from app.services.cognito_user_service import CognitoUserService

def test_group_operations():
    service = CognitoUserService()
    
    # Test group creation
    result = service.create_group("test_group", "Test group")
    assert result['created'] is True
    
    # Test group listing
    groups = service.list_groups()
    group_names = [g['GroupName'] for g in groups]
    assert "test_group" in group_names
    
    # Test user assignment
    # (Assumes test user exists)
    result = service.add_user_to_group("test_user", "test_group")
    assert result['added'] is True
    
    # Cleanup
    service.remove_user_from_group("test_user", "test_group")
    service.delete_group("test_group")
```

## Next Steps

- [API Reference](./05_api_reference.md)
- [Utilities](./06_utilities.md)
- [Troubleshooting](./07_troubleshooting.md)
