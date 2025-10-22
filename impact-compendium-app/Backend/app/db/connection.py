"""
Database connection module for Impact Compendium.
Handles SQLAlchemy engine creation and session management.
"""

import os
from typing import Generator, Optional
from sqlalchemy import create_engine, Engine
from sqlalchemy.ext.declarative import declarative_base
from sqlalchemy.orm import sessionmaker, Session
from sqlalchemy.pool import QueuePool
import logging

logger = logging.getLogger(__name__)

# Base class for all models
Base = declarative_base()

class DatabaseConnection:
    """Database connection manager."""
    
    def __init__(self):
        self._engine: Optional[Engine] = None
        self._session_factory = None
    
    def get_engine(self) -> Optional[Engine]:
        """Get or create database engine."""
        if self._engine is None:
            try:
                self._engine = self._create_engine()
            except Exception as e:
                logger.warning(f"Failed to create database engine: {e}")
                return None
        return self._engine
    
    def _create_engine(self) -> Engine:
        """Create SQLAlchemy engine with connection pooling."""
        # Get database configuration from environment
        db_host = os.getenv("DB_HOST")
        db_port = os.getenv("DB_PORT", "3306")
        db_name = os.getenv("DB_NAME")
        db_user = os.getenv("DB_USER")
        db_password = os.getenv("DB_PASSWORD")
        
        # Validate required environment variables
        if not all([db_host, db_name, db_user, db_password]):
            raise ValueError("Missing required database environment variables: DB_HOST, DB_NAME, DB_USER, DB_PASSWORD")
        
        # Construct database URL
        database_url = f"mysql+pymysql://{db_user}:{db_password}@{db_host}:{db_port}/{db_name}"
        
        # Create engine with connection pooling
        engine = create_engine(
            database_url,
            poolclass=QueuePool,
            pool_size=5,
            max_overflow=10,
            pool_pre_ping=True,
            pool_recycle=3600,
            echo=os.getenv("DB_ECHO", "false").lower() == "true"
        )
        
        return engine
    
    def get_session_factory(self):
        """Get or create session factory."""
        if self._session_factory is None:
            engine = self.get_engine()
            if engine:
                self._session_factory = sessionmaker(
                    autocommit=False,
                    autoflush=False,
                    bind=engine
                )
        return self._session_factory
    
    def get_session(self) -> Generator[Optional[Session], None, None]:
        """Get database session with automatic cleanup."""
        session_factory = self.get_session_factory()
        if not session_factory:
            yield None
            return
            
        session = session_factory()
        try:
            yield session
        except Exception as e:
            logger.warning(f"Database session error: {e}")
            session.rollback()
            yield None
        finally:
            session.close()

# Global database connection instance
db_connection = DatabaseConnection()

# Dependency for FastAPI
def get_db() -> Generator[Optional[Session], None, None]:
    """FastAPI dependency for database sessions."""
    yield from db_connection.get_session()

# Helper functions
def create_tables():
    """Create all database tables."""
    engine = db_connection.get_engine()
    if engine:
        Base.metadata.create_all(bind=engine)

def drop_tables():
    """Drop all database tables."""
    engine = db_connection.get_engine()
    if engine:
        Base.metadata.drop_all(bind=engine)
