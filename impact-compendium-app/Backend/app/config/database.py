"""
Database configuration and connection management
"""

import json
import boto3
from sqlalchemy import create_engine
from sqlalchemy.ext.declarative import declarative_base
from sqlalchemy.orm import sessionmaker
from sqlalchemy.pool import QueuePool
import logging

from app.config.settings import get_settings

logger = logging.getLogger(__name__)
settings = get_settings()

# SQLAlchemy base class
Base = declarative_base()

class DatabaseManager:
    """Database connection manager"""
    
    def __init__(self):
        self.engine = None
        self.SessionLocal = None
        self._db_credentials = None
    
    async def get_db_credentials(self):
        """Get database credentials from AWS Secrets Manager"""
        if self._db_credentials:
            return self._db_credentials
        
        if not settings.db_secret_arn:
            # Use environment variables for local development
            self._db_credentials = {
                "username": "admin",
                "password": "password",  # This should be from environment
                "host": settings.db_host,
                "port": settings.db_port,
                "dbname": settings.db_name
            }
            return self._db_credentials
        
        try:
            # Get credentials from AWS Secrets Manager
            session = boto3.Session()
            client = session.client('secretsmanager', region_name=settings.cognito_region)
            
            response = client.get_secret_value(SecretId=settings.db_secret_arn)
            secret = json.loads(response['SecretString'])
            
            self._db_credentials = {
                "username": secret.get("username"),
                "password": secret.get("password"),
                "host": secret.get("host", settings.db_host),
                "port": secret.get("port", settings.db_port),
                "dbname": secret.get("dbname", settings.db_name)
            }
            
            logger.info("Successfully retrieved database credentials from Secrets Manager")
            return self._db_credentials
            
        except Exception as e:
            logger.error(f"Failed to retrieve database credentials: {e}")
            raise
    
    async def initialize_database(self):
        """Initialize database connection"""
        if self.engine:
            return
        
        credentials = await self.get_db_credentials()
        
        # Create database URL
        database_url = (
            f"mysql+pymysql://{credentials['username']}:{credentials['password']}"
            f"@{credentials['host']}:{credentials['port']}/{credentials['dbname']}"
            f"?charset=utf8mb4"
        )
        
        # Create engine with connection pooling
        self.engine = create_engine(
            database_url,
            poolclass=QueuePool,
            pool_size=5,
            max_overflow=10,
            pool_pre_ping=True,
            pool_recycle=3600,
            echo=settings.debug
        )
        
        # Create session factory
        self.SessionLocal = sessionmaker(
            autocommit=False,
            autoflush=False,
            bind=self.engine
        )
        
        logger.info("Database connection initialized")
    
    def get_session(self):
        """Get database session"""
        if not self.SessionLocal:
            raise RuntimeError("Database not initialized")
        return self.SessionLocal()

# Global database manager instance
db_manager = DatabaseManager()

async def get_database():
    """Dependency to get database session"""
    await db_manager.initialize_database()
    db = db_manager.get_session()
    try:
        yield db
    finally:
        db.close()

async def init_db():
    """Initialize database tables"""
    await db_manager.initialize_database()
    # Import all models to ensure they are registered
    from app.models import study, indicator, user
    
    # Create all tables
    Base.metadata.create_all(bind=db_manager.engine)
    logger.info("Database tables created")
