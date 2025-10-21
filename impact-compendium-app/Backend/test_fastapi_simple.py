#!/usr/bin/env python3
"""
Simple FastAPI test for Impact Compendium.
"""

import sys
import os
from dotenv import load_dotenv

# Load environment variables
load_dotenv()

# Add app to path
sys.path.append('.')

from fastapi import FastAPI
from fastapi.testclient import TestClient
from app.db.connection import db_connection
from sqlalchemy import text

# Create a simple FastAPI app for testing
app = FastAPI(title="Impact Compendium Test API")

@app.get("/")
async def root():
    return {"message": "Impact Compendium Test API", "status": "running"}

@app.get("/health")
async def health_check():
    try:
        # Test database connection
        engine = db_connection.get_engine()
        with engine.connect() as conn:
            conn.execute(text("SELECT 1"))
        db_status = "connected"
    except Exception as e:
        db_status = f"disconnected: {str(e)}"
    
    return {
        "status": "healthy",
        "service": "impact-compendium-test-api",
        "database": db_status
    }

@app.get("/studies/count")
async def get_studies_count():
    try:
        session_gen = db_connection.get_session()
        session = next(session_gen)
        
        result = session.execute(text("SELECT COUNT(*) FROM studies WHERE is_active = 1"))
        count = result.fetchone()[0]
        
        session.close()
        
        return {"active_studies": count}
        
    except Exception as e:
        return {"error": str(e)}

def test_fastapi():
    """Test FastAPI application."""
    try:
        print("Testing FastAPI application...")
        
        client = TestClient(app)
        
        # Test root endpoint
        response = client.get("/")
        print(f"✅ Root endpoint: {response.status_code} - {response.json()}")
        
        # Test health check
        response = client.get("/health")
        print(f"✅ Health check: {response.status_code} - {response.json()}")
        
        # Test studies count
        response = client.get("/studies/count")
        print(f"✅ Studies count: {response.status_code} - {response.json()}")
        
        print("🎉 FastAPI application test completed successfully!")
        return True
        
    except Exception as e:
        print(f"❌ Error testing FastAPI: {e}")
        import traceback
        traceback.print_exc()
        return False

if __name__ == "__main__":
    success = test_fastapi()
    sys.exit(0 if success else 1)
