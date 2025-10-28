"""
AWS Cognito authentication service
"""

import os
import jwt
import requests
from typing import Dict, Any, Optional
from fastapi import HTTPException, status
from jose import JWTError, jwt as jose_jwt
import logging

logger = logging.getLogger(__name__)

class CognitoAuth:
    def __init__(self):
        self.user_pool_id = os.getenv("COGNITO_USER_POOL_ID")
        self.client_id = os.getenv("COGNITO_CLIENT_ID")
        self.region = os.getenv("AWS_REGION", "us-east-1")
        
        if not self.user_pool_id or not self.client_id:
            logger.warning("Cognito credentials not configured, using mock mode")
            self.mock_mode = True
        else:
            self.mock_mode = False
            self.jwks_url = f"https://cognito-idp.{self.region}.amazonaws.com/{self.user_pool_id}/.well-known/jwks.json"
            self.issuer = f"https://cognito-idp.{self.region}.amazonaws.com/{self.user_pool_id}"
            self._jwks_cache = None

    def get_jwks(self) -> Dict[str, Any]:
        """Get JWKS from Cognito"""
        if self._jwks_cache is None:
            try:
                response = requests.get(self.jwks_url, timeout=10)
                response.raise_for_status()
                self._jwks_cache = response.json()
            except Exception as e:
                logger.error(f"Failed to fetch JWKS: {e}")
                raise HTTPException(
                    status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                    detail="Authentication service unavailable"
                )
        return self._jwks_cache

    def verify_token(self, token: str) -> Dict[str, Any]:
        """Verify JWT token from Cognito"""
        if self.mock_mode:
            return self._mock_verify_token(token)
        
        try:
            logger.info(f"Verifying token: {token[:50]}...")
            
            # Get the key ID from token header
            unverified_header = jose_jwt.get_unverified_header(token)
            kid = unverified_header.get("kid")
            
            logger.info(f"Token kid: {kid}")
            
            if not kid:
                raise HTTPException(
                    status_code=status.HTTP_401_UNAUTHORIZED,
                    detail="Invalid token header"
                )
            
            # Get JWKS and find the right key
            jwks = self.get_jwks()
            key = None
            
            for jwk in jwks.get("keys", []):
                if jwk.get("kid") == kid:
                    key = jwk
                    break
            
            if not key:
                logger.error(f"Key not found for kid: {kid}")
                raise HTTPException(
                    status_code=status.HTTP_401_UNAUTHORIZED,
                    detail="Invalid token key"
                )
            
            logger.info("Decoding token...")
            
            # Verify the token
            payload = jose_jwt.decode(
                token,
                key,
                algorithms=["RS256"],
                audience=self.client_id,
                issuer=self.issuer
            )
            
            logger.info(f"Token verified successfully. Payload: {payload}")
            
            return payload
            
        except JWTError as e:
            logger.error(f"JWT verification failed: {e}")
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="Invalid token"
            )
        except Exception as e:
            logger.error(f"Token verification error: {e}")
            raise HTTPException(
                status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                detail="Authentication error"
            )

    def _mock_verify_token(self, token: str) -> Dict[str, Any]:
        """Mock token verification for development"""
        if token == "mock_jwt_token_12345":
            return {
                "sub": "mock-user-123",
                "email": "mock@example.com",
                "name": "Mock User",
                "cognito:groups": ["researchers"],
                "token_use": "access",
                "scope": "openid email profile",
                "auth_time": 1640995200,
                "iss": "mock-issuer",
                "exp": 1640998800,
                "iat": 1640995200,
                "client_id": "mock-client-id"
            }
        else:
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="Invalid mock token"
            )

    def get_user_info(self, token_payload: Dict[str, Any]) -> Dict[str, Any]:
        """Extract user information from token payload"""
        return {
            "user_id": token_payload.get("sub"),
            "email": token_payload.get("email"),
            "name": token_payload.get("name", token_payload.get("email")),
            "groups": token_payload.get("cognito:groups", []),
            "is_authenticated": True
        }

# Global instance
cognito_auth = CognitoAuth()
