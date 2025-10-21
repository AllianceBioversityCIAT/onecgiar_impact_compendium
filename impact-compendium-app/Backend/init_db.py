#!/usr/bin/env python3
"""
Database initialization script for Impact Compendium.
Creates tables and optionally seeds with sample data.
"""

import os
import sys
from dotenv import load_dotenv
from sqlalchemy import text

# Load environment variables
load_dotenv()

# Add app to path
sys.path.append(os.path.join(os.path.dirname(__file__), 'app'))

from app.db.connection import create_tables, db_connection
from app.models import *  # Import all models

def init_database():
    """Initialize database with tables."""
    try:
        print("Connecting to database...")
        engine = db_connection.get_engine()
        
        # Test connection
        with engine.connect() as conn:
            result = conn.execute(text("SELECT 1"))
            print("Database connection successful!")
        
        print("Creating tables...")
        create_tables()
        print("Tables created successfully!")
        
        return True
        
    except Exception as e:
        print(f"Error initializing database: {e}")
        import traceback
        traceback.print_exc()
        return False

if __name__ == "__main__":
    success = init_database()
    sys.exit(0 if success else 1)
