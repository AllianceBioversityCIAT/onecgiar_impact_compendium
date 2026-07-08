"""
AWS Cognito User Management Service
"""

from typing import Any, Dict, List, Optional

import boto3
from botocore.exceptions import ClientError

from app.config.settings import get_settings

settings = get_settings()


class CognitoServiceError(Exception):
    """Raised when a Cognito user-management operation fails."""


class CognitoUserService:
    def __init__(self):
        self.client = boto3.client("cognito-idp", region_name=settings.cognito_region)
        self.user_pool_id = settings.cognito_user_pool_id

    def list_users(self, limit: int = 60) -> List[Dict[str, Any]]:
        """List all users in the Cognito User Pool"""
        try:
            response = self.client.list_users(UserPoolId=self.user_pool_id, Limit=limit)

            users = []
            for user in response.get("Users", []):
                user_data = {
                    "username": user.get("Username"),
                    "email": self._get_attribute_value(
                        user.get("Attributes", []), "email"
                    ),
                    "status": user.get("UserStatus"),
                    "enabled": user.get("Enabled", True),
                    "created_date": user.get("UserCreateDate").isoformat()
                    if user.get("UserCreateDate")
                    else None,
                    "last_modified_date": user.get("UserLastModifiedDate").isoformat()
                    if user.get("UserLastModifiedDate")
                    else None,
                    "mfa_enabled": user.get("MFAOptions", []) != [],
                }
                users.append(user_data)

            return users
        except ClientError as e:
            raise CognitoServiceError(f"Failed to list users: {e}") from e

    def get_user(self, username: str) -> Dict[str, Any]:
        """Get a specific user by username"""
        try:
            response = self.client.admin_get_user(
                UserPoolId=self.user_pool_id, Username=username
            )

            return {
                "username": response.get("Username"),
                "email": self._get_attribute_value(
                    response.get("UserAttributes", []), "email"
                ),
                "status": response.get("UserStatus"),
                "enabled": response.get("Enabled", True),
                "created_date": response.get("UserCreateDate").isoformat()
                if response.get("UserCreateDate")
                else None,
                "last_modified_date": response.get("UserLastModifiedDate").isoformat()
                if response.get("UserLastModifiedDate")
                else None,
                "mfa_enabled": response.get("MFAOptions", []) != [],
            }
        except ClientError as e:
            raise CognitoServiceError(f"Failed to get user: {e}") from e

    def create_user(
        self, email: str, temporary_password: str, send_email: bool = True
    ) -> Dict[str, Any]:
        """Create a new user"""
        try:
            # Generate a unique username since email aliases are configured
            import uuid

            username = f"user_{uuid.uuid4().hex[:8]}"

            response = self.client.admin_create_user(
                UserPoolId=self.user_pool_id,
                Username=username,
                UserAttributes=[
                    {"Name": "email", "Value": email},
                    {"Name": "email_verified", "Value": "true"},
                ],
                TemporaryPassword=temporary_password,
                MessageAction="SUPPRESS" if not send_email else "RESEND",
            )

            return {
                "username": response["User"]["Username"],
                "status": response["User"]["UserStatus"],
            }
        except ClientError as e:
            error_code = e.response["Error"]["Code"]
            if error_code == "UserNotFoundException":
                raise CognitoServiceError(
                    f"Unable to create user with email {email}. The email may have been recently deleted and is temporarily unavailable. Please try again in a few minutes or use a different email."
                ) from e
            elif error_code == "UsernameExistsException":
                raise CognitoServiceError(
                    f"A user with email {email} already exists"
                ) from e
            else:
                raise CognitoServiceError(f"Failed to create user: {e}") from e

    def update_user_status(self, username: str, enabled: bool) -> bool:
        """Enable or disable a user"""
        try:
            if enabled:
                self.client.admin_enable_user(
                    UserPoolId=self.user_pool_id, Username=username
                )
            else:
                self.client.admin_disable_user(
                    UserPoolId=self.user_pool_id, Username=username
                )
            return True
        except ClientError as e:
            raise CognitoServiceError(f"Failed to update user status: {e}") from e

    def delete_user(self, username: str) -> bool:
        """Delete a user"""
        try:
            self.client.admin_delete_user(
                UserPoolId=self.user_pool_id, Username=username
            )
            return True
        except ClientError as e:
            raise CognitoServiceError(f"Failed to delete user: {e}") from e

    def reset_user_password(self, username: str) -> bool:
        """Reset user password"""
        try:
            self.client.admin_reset_user_password(
                UserPoolId=self.user_pool_id, Username=username
            )
            return True
        except ClientError as e:
            raise CognitoServiceError(f"Failed to reset password: {e}") from e

    def _get_attribute_value(self, attributes: List[Dict], name: str) -> Optional[str]:
        """Helper to get attribute value from Cognito attributes list"""
        for attr in attributes:
            if attr.get("Name") == name:
                return attr.get("Value")
        return None
