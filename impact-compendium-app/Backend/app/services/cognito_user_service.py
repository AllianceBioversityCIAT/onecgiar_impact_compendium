"""
AWS Cognito User Pool management service
"""

import os
import boto3
import uuid
import random
import string
from typing import Dict, Any, List
from botocore.exceptions import ClientError
import logging
from app.utils.email_utils import extract_username_from_email, generate_readable_username

logger = logging.getLogger(__name__)
logger.info("🔄 CognitoUserService module loading...")

class CognitoUserService:
    def __init__(self):
        self.user_pool_id = os.getenv("COGNITO_USER_POOL_ID")
        self.region = os.getenv("AWS_REGION", "us-east-1")
        
        if not self.user_pool_id:
            logger.warning("COGNITO_USER_POOL_ID not configured")
            self.mock_mode = True
        else:
            self.mock_mode = False
            # Always use default credentials (IAM role in Lambda, default profile locally)
            self.client = boto3.client('cognito-idp', region_name=self.region)
            logger.info(f"🔧 Initialized Cognito client with default credentials, region: {self.region}")
            
            # Test AWS credentials immediately
            try:
                response = self.client.describe_user_pool(UserPoolId=self.user_pool_id)
                logger.info(f"✅ AWS credentials test PASSED - User Pool: {response['UserPool']['Name']}")
            except Exception as e:
                logger.error(f"❌ AWS credentials test FAILED: {e}")
                # Try to get caller identity for debugging
                try:
                    sts_client = boto3.client('sts', region_name=self.region)
                    identity = sts_client.get_caller_identity()
                    logger.error(f"🔍 Current AWS identity: {identity}")
                except Exception as sts_error:
                    logger.error(f"🔍 Cannot get AWS identity: {sts_error}")

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
                    'created_date': user['UserCreateDate'].isoformat() if 'UserCreateDate' in user else None,
                    'last_modified_date': user['UserLastModifiedDate'].isoformat() if 'UserLastModifiedDate' in user else None,
                    'mfa_enabled': user.get('MFAOptions', []) != [],
                    'email': None  # Will be populated from attributes
                }
                
                # Extract user attributes
                for attr in user.get('Attributes', []):
                    if attr['Name'] == 'email':
                        user_data['email'] = attr['Value']
                
                # Get user groups
                try:
                    groups_response = self.client.admin_list_groups_for_user(
                        UserPoolId=self.user_pool_id,
                        Username=user['Username']
                    )
                    user_data['groups'] = [group['GroupName'] for group in groups_response.get('Groups', [])]
                except ClientError:
                    user_data['groups'] = []
                
                users.append(user_data)
            
            return users
            
        except ClientError as e:
            logger.error(f"Error listing users: {e}")
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
                'email': 'admin@example.com',
                'status': 'CONFIRMED',
                'enabled': True,
                'created_date': '2024-01-01T00:00:00Z',
                'last_modified_date': '2024-01-01T00:00:00Z',
                'mfa_enabled': False,
                'groups': ['admin']
            },
            {
                'username': 'user_87654321',
                'email': 'researcher@example.com',
                'status': 'CONFIRMED',
                'enabled': True,
                'created_date': '2024-01-02T00:00:00Z',
                'last_modified_date': '2024-01-02T00:00:00Z',
                'mfa_enabled': True,
                'groups': ['researchers']
            }
        ]



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

    def list_groups(self) -> List[Dict[str, Any]]:
        """List all groups in the User Pool"""
        if self.mock_mode:
            return self._mock_list_groups()
        
        try:
            response = self.client.list_groups(UserPoolId=self.user_pool_id)
            groups = []
            
            for group in response.get('Groups', []):
                groups.append({
                    'GroupName': group['GroupName'],
                    'Description': group.get('Description', ''),
                    'CreationDate': group['CreationDate'].isoformat() if 'CreationDate' in group else None,
                    'LastModifiedDate': group['LastModifiedDate'].isoformat() if 'LastModifiedDate' in group else None
                })
            
            return groups
            
        except ClientError as e:
            logger.error(f"Error listing groups: {e}")
            raise e

    def create_user(self, email: str, temporary_password: str, send_email: bool = True) -> Dict[str, Any]:
        """Create a new user in the User Pool"""
        if self.mock_mode:
            return self._mock_create_user(email, temporary_password, send_email)
        
        try:
            # Normalize email to lowercase for consistency
            normalized_email = email.lower()
            
            # Generate readable username from email
            base_username = generate_readable_username(normalized_email)
            username = base_username
            
            logger.info(f"Creating user: {username}, email: {normalized_email}")
            
            # Use boto3 client instead of AWS CLI
            user_attributes = [
                {'Name': 'email', 'Value': normalized_email},
                {'Name': 'name', 'Value': base_username},
                {'Name': 'email_verified', 'Value': 'true'}
            ]
            
            response = self.client.admin_create_user(
                UserPoolId=self.user_pool_id,
                Username=username,
                UserAttributes=user_attributes,
                TemporaryPassword=temporary_password,
                MessageAction='RESEND' if send_email else 'SUPPRESS',
                DesiredDeliveryMediums=['EMAIL'] if send_email else []
            )
            
            logger.info(f"User created successfully: {username}")
            return {
                'username': response['User']['Username'],
                'email': normalized_email,
                'status': response['User']['UserStatus'],
                'created': response['User']['UserCreateDate'].isoformat()
            }
            
        except ClientError as e:
            logger.error(f"Error creating user: {e}")
            raise Exception(f"Failed to create user: {str(e)}")
        except Exception as e:
            logger.error(f"Error creating user: {str(e)}")
            raise Exception(f"Failed to create user: {str(e)}")

    def create_group(self, group_name: str, description: str) -> Dict[str, Any]:
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
                'GroupName': response['Group']['GroupName'],
                'Description': response['Group'].get('Description', ''),
                'CreationDate': response['Group']['CreationDate'].isoformat()
            }
        except ClientError as e:
            logger.error(f"Error creating group: {e}")
            raise e

    def delete_group(self, group_name: str) -> None:
        """Delete a group from the User Pool"""
        if self.mock_mode:
            return self._mock_delete_group(group_name)
        
        try:
            self.client.delete_group(
                GroupName=group_name,
                UserPoolId=self.user_pool_id
            )
        except ClientError as e:
            logger.error(f"Error deleting group: {e}")
            raise e

    def add_user_to_group(self, username: str, group_name: str) -> None:
        """Add a user to a group"""
        if self.mock_mode:
            return self._mock_add_user_to_group(username, group_name)
        
        try:
            self.client.admin_add_user_to_group(
                UserPoolId=self.user_pool_id,
                Username=username,
                GroupName=group_name
            )
        except ClientError as e:
            logger.error(f"Error adding user to group: {e}")
            raise e

    def remove_user_from_group(self, username: str, group_name: str) -> None:
        """Remove a user from a group"""
        if self.mock_mode:
            return self._mock_remove_user_from_group(username, group_name)
        
        try:
            self.client.admin_remove_user_from_group(
                UserPoolId=self.user_pool_id,
                Username=username,
                GroupName=group_name
            )
        except ClientError as e:
            logger.error(f"Error removing user from group: {e}")
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

    def _mock_create_group(self, group_name: str, description: str) -> Dict[str, Any]:
        return {
            'GroupName': group_name,
            'Description': description,
            'CreationDate': '2024-01-01T00:00:00Z'
        }

    def _mock_delete_group(self, group_name: str) -> None:
        pass

    def _mock_add_user_to_group(self, username: str, group_name: str) -> None:
        pass

    def _mock_remove_user_from_group(self, username: str, group_name: str) -> None:
        pass

    def reset_user_password(self, username: str) -> None:
        """Reset user password (force password change)"""
        if self.mock_mode:
            return self._mock_reset_user_password(username)
        
        try:
            self.client.admin_reset_user_password(
                UserPoolId=self.user_pool_id,
                Username=username
            )
        except ClientError as e:
            logger.error(f"Error resetting user password: {e}")
            raise e

    def update_user_status(self, username: str, enabled: bool) -> None:
        """Enable or disable a user"""
        if self.mock_mode:
            return self._mock_update_user_status(username, enabled)
        
        try:
            if enabled:
                self.client.admin_enable_user(
                    UserPoolId=self.user_pool_id,
                    Username=username
                )
            else:
                self.client.admin_disable_user(
                    UserPoolId=self.user_pool_id,
                    Username=username
                )
        except ClientError as e:
            logger.error(f"Error updating user status: {e}")
            raise e

    def delete_user(self, username: str) -> None:
        """Delete a user from the User Pool"""
        if self.mock_mode:
            return self._mock_delete_user(username)
        
        try:
            self.client.admin_delete_user(
                UserPoolId=self.user_pool_id,
                Username=username
            )
        except ClientError as e:
            logger.error(f"Error deleting user: {e}")
            raise e

    def _mock_delete_user(self, username: str) -> None:
        pass

    def _mock_update_user_status(self, username: str, enabled: bool) -> None:
        pass

    def _mock_reset_user_password(self, username: str) -> None:
        pass

    def _mock_create_user(self, email: str, temporary_password: str, send_email: bool) -> Dict[str, Any]:
        import random
        import string
        username = email.split('@')[0] + '_' + ''.join(random.choices(string.ascii_lowercase + string.digits, k=8))
        return {
            'username': username,
            'email': email,
            'status': 'FORCE_CHANGE_PASSWORD',
            'created': '2024-01-01T00:00:00Z'
        }
