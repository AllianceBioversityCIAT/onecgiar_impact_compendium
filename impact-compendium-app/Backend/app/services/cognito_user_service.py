"""
AWS Cognito User Pool management service
"""

import os
import boto3
import uuid
from typing import Dict, Any, List
from botocore.exceptions import ClientError
import logging

logger = logging.getLogger(__name__)

class CognitoUserService:
    def __init__(self):
        self.user_pool_id = os.getenv("COGNITO_USER_POOL_ID")
        self.region = os.getenv("AWS_REGION", "us-east-1")
        
        if not self.user_pool_id:
            logger.warning("COGNITO_USER_POOL_ID not configured")
            self.mock_mode = True
        else:
            self.mock_mode = False
            self.client = boto3.client('cognito-idp', region_name=self.region)

    def list_users(self) -> List[Dict[str, Any]]:
        """List all users in the User Pool"""
        if self.mock_mode:
            return self._mock_list_users()
        
        try:
            response = self.client.list_users(UserPoolId=self.user_pool_id)
            users = []
            
            for user in response.get('Users', []):
                user_data = {
                    'username': user['Username'],
                    'status': user['UserStatus'],
                    'enabled': user['Enabled'],
                    'created': user['UserCreateDate'].isoformat() if 'UserCreateDate' in user else None,
                    'modified': user['UserLastModifiedDate'].isoformat() if 'UserLastModifiedDate' in user else None,
                    'attributes': {}
                }
                
                # Extract user attributes
                for attr in user.get('Attributes', []):
                    user_data['attributes'][attr['Name']] = attr['Value']
                
                users.append(user_data)
            
            return users
            
        except ClientError as e:
            logger.error(f"Error listing users: {e}")
            raise e

    def create_user(self, email: str, name: str, role: str = "researcher") -> Dict[str, Any]:
        """Create a new user in the User Pool"""
        if self.mock_mode:
            return self._mock_create_user(email, name, role)
        
        try:
            # Generate unique username since we use email aliases
            username = f"user_{uuid.uuid4().hex[:8]}"
            
            response = self.client.admin_create_user(
                UserPoolId=self.user_pool_id,
                Username=username,
                UserAttributes=[
                    {'Name': 'email', 'Value': email},
                    {'Name': 'name', 'Value': name},
                    {'Name': 'custom:role', 'Value': role},
                    {'Name': 'email_verified', 'Value': 'true'}
                ],
                MessageAction='RESEND',
                DesiredDeliveryMediums=['EMAIL']
            )
            
            return {
                'username': username,
                'email': email,
                'name': name,
                'role': role,
                'status': 'FORCE_CHANGE_PASSWORD'
            }
            
        except ClientError as e:
            logger.error(f"Error creating user: {e}")
            raise e

    def update_user(self, username: str, name: str, role: str) -> Dict[str, Any]:
        """Update user attributes"""
        if self.mock_mode:
            return self._mock_update_user(username, name, role)
        
        try:
            self.client.admin_update_user_attributes(
                UserPoolId=self.user_pool_id,
                Username=username,
                UserAttributes=[
                    {'Name': 'name', 'Value': name},
                    {'Name': 'custom:role', 'Value': role}
                ]
            )
            
            return {
                'username': username,
                'name': name,
                'role': role,
                'updated': True
            }
            
        except ClientError as e:
            logger.error(f"Error updating user: {e}")
            raise e

    def delete_user(self, username: str) -> Dict[str, Any]:
        """Delete user from User Pool"""
        if self.mock_mode:
            return self._mock_delete_user(username)
        
        try:
            self.client.admin_delete_user(
                UserPoolId=self.user_pool_id,
                Username=username
            )
            
            return {
                'username': username,
                'deleted': True
            }
            
        except ClientError as e:
            logger.error(f"Error deleting user: {e}")
            raise e

    def reset_password(self, username: str) -> Dict[str, Any]:
        """Reset user password"""
        if self.mock_mode:
            return self._mock_reset_password(username)
        
        try:
            self.client.admin_set_user_password(
                UserPoolId=self.user_pool_id,
                Username=username,
                Password=self._generate_temp_password(),
                Permanent=False
            )
            
            return {
                'username': username,
                'password_reset': True,
                'status': 'FORCE_CHANGE_PASSWORD'
            }
            
        except ClientError as e:
            logger.error(f"Error resetting password: {e}")
            raise e

    def _generate_temp_password(self) -> str:
        """Generate temporary password"""
        import secrets
        import string
        
        # Generate secure temporary password
        alphabet = string.ascii_letters + string.digits + "!@#$%^&*"
        password = ''.join(secrets.choice(alphabet) for _ in range(12))
        
        # Ensure it meets Cognito requirements
        if not any(c.isupper() for c in password):
            password = password[:-1] + 'A'
        if not any(c.islower() for c in password):
            password = password[:-2] + 'a' + password[-1]
        if not any(c.isdigit() for c in password):
            password = password[:-3] + '1' + password[-2:]
        if not any(c in "!@#$%^&*" for c in password):
            password = password[:-4] + '!' + password[-3:]
            
        return password

    # Mock methods for development
    def _mock_list_users(self) -> List[Dict[str, Any]]:
        return [
            {
                'username': 'user_12345678',
                'status': 'CONFIRMED',
                'enabled': True,
                'created': '2024-01-01T00:00:00Z',
                'modified': '2024-01-01T00:00:00Z',
                'attributes': {
                    'email': 'admin@example.com',
                    'name': 'Admin User',
                    'custom:role': 'admin'
                }
            },
            {
                'username': 'user_87654321',
                'status': 'CONFIRMED',
                'enabled': True,
                'created': '2024-01-02T00:00:00Z',
                'modified': '2024-01-02T00:00:00Z',
                'attributes': {
                    'email': 'researcher@example.com',
                    'name': 'Researcher User',
                    'custom:role': 'researcher'
                }
            }
        ]

    def _mock_create_user(self, email: str, name: str, role: str) -> Dict[str, Any]:
        return {
            'username': f'user_{uuid.uuid4().hex[:8]}',
            'email': email,
            'name': name,
            'role': role,
            'status': 'FORCE_CHANGE_PASSWORD'
        }

    def _mock_update_user(self, username: str, name: str, role: str) -> Dict[str, Any]:
        return {
            'username': username,
            'name': name,
            'role': role,
            'updated': True
        }

    def _mock_delete_user(self, username: str) -> Dict[str, Any]:
        return {
            'username': username,
            'deleted': True
        }

    def _mock_reset_password(self, username: str) -> Dict[str, Any]:
        return {
            'username': username,
            'password_reset': True,
            'status': 'FORCE_CHANGE_PASSWORD'
        }

    def _mock_list_groups(self) -> List[Dict[str, Any]]:
        return [
            {
                'group_name': 'admin',
                'description': 'Administrators group',
                'created': '2024-01-01T00:00:00Z',
                'modified': '2024-01-01T00:00:00Z'
            },
            {
                'group_name': 'researchers',
                'description': 'Researchers group',
                'created': '2024-01-01T00:00:00Z',
                'modified': '2024-01-01T00:00:00Z'
            }
        ]

    def _mock_create_group(self, group_name: str, description: str) -> Dict[str, Any]:
        return {
            'group_name': group_name,
            'description': description,
            'created': True
        }

    def _mock_add_user_to_group(self, username: str, group_name: str) -> Dict[str, Any]:
        return {
            'username': username,
            'group_name': group_name,
            'added': True
        }

    def _mock_remove_user_from_group(self, username: str, group_name: str) -> Dict[str, Any]:
        return {
            'username': username,
            'group_name': group_name,
            'removed': True
        }
        """List all groups in the User Pool"""
        if self.mock_mode:
            return self._mock_list_groups()
        
        try:
            response = self.client.list_groups(UserPoolId=self.user_pool_id)
            groups = []
            
            for group in response.get('Groups', []):
                groups.append({
                    'group_name': group['GroupName'],
                    'description': group.get('Description', ''),
                    'created': group['CreationDate'].isoformat() if 'CreationDate' in group else None,
                    'modified': group['LastModifiedDate'].isoformat() if 'LastModifiedDate' in group else None
                })
            
            return groups
            
        except ClientError as e:
            logger.error(f"Error listing groups: {e}")
            raise e

    def create_group(self, group_name: str, description: str = "") -> Dict[str, Any]:
        """Create a new group in the User Pool"""
        if self.mock_mode:
            return self._mock_create_group(group_name, description)
        
        try:
            response = self.client.create_group(
                GroupName=group_name,
                UserPoolId=self.user_pool_id,
                Description=description
            )
            
            return {
                'group_name': group_name,
                'description': description,
                'created': True
            }
            
        except ClientError as e:
            logger.error(f"Error creating group: {e}")
            raise e

    def add_user_to_group(self, username: str, group_name: str) -> Dict[str, Any]:
        """Add user to a group"""
        if self.mock_mode:
            return self._mock_add_user_to_group(username, group_name)
        
        try:
            self.client.admin_add_user_to_group(
                UserPoolId=self.user_pool_id,
                Username=username,
                GroupName=group_name
            )
            
            return {
                'username': username,
                'group_name': group_name,
                'added': True
            }
            
        except ClientError as e:
            logger.error(f"Error adding user to group: {e}")
            raise e

    def remove_user_from_group(self, username: str, group_name: str) -> Dict[str, Any]:
        """Remove user from a group"""
        if self.mock_mode:
            return self._mock_remove_user_from_group(username, group_name)
        
        try:
            self.client.admin_remove_user_from_group(
                UserPoolId=self.user_pool_id,
                Username=username,
                GroupName=group_name
            )
            
            return {
                'username': username,
                'group_name': group_name,
                'removed': True
            }
            
        except ClientError as e:
            logger.error(f"Error removing user from group: {e}")
            raise e
