"""
Application settings and configuration management
"""

import os
from functools import lru_cache
from typing import List
from pydantic import BaseSettings, validator

class Settings(BaseSettings):
    """Application settings"""
    
    # Environment
    environment: str = os.getenv("ENVIRONMENT", "dev")
    debug: bool = os.getenv("DEBUG", "false").lower() == "true"
    
    # API Configuration
    api_title: str = "Impact Compendium API"
    api_version: str = "1.0.0"
    
    # CORS settings
    allowed_origins: List[str] = [
        "http://localhost:3000",
        "http://localhost:5173",
        "https://*.amazonaws.com",
        "https://*.cgiar.org"
    ]
    
    # Database settings (will be populated from AWS Secrets Manager)
    db_host: str = os.getenv("DB_HOST", "localhost")
    db_port: int = int(os.getenv("DB_PORT", "3306"))
    db_name: str = os.getenv("DB_NAME", "impact_compendium")
    db_secret_arn: str = os.getenv("DB_SECRET_ARN", "")
    
    # AWS Cognito settings
    cognito_user_pool_id: str = os.getenv("COGNITO_USER_POOL_ID", "")
    cognito_client_id: str = os.getenv("COGNITO_CLIENT_ID", "")
    cognito_region: str = os.getenv("AWS_REGION", "us-east-1")
    
    # JWT settings
    jwt_algorithm: str = "RS256"
    jwt_audience: str = ""  # Will be set from Cognito client ID
    
    # Logging
    log_level: str = os.getenv("LOG_LEVEL", "INFO")
    
    # Rate limiting
    rate_limit_requests: int = 100
    rate_limit_window: int = 60  # seconds
    
    @validator("jwt_audience", pre=True, always=True)
    def set_jwt_audience(cls, v, values):
        """Set JWT audience from Cognito client ID"""
        return v or values.get("cognito_client_id", "")
    
    @validator("allowed_origins", pre=True)
    def parse_cors_origins(cls, v):
        """Parse CORS origins from environment variable"""
        if isinstance(v, str):
            return [origin.strip() for origin in v.split(",")]
        return v
    
    class Config:
        env_file = ".env"
        case_sensitive = False

@lru_cache()
def get_settings() -> Settings:
    """Get cached settings instance"""
    return Settings()
