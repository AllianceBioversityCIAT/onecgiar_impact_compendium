"""
Impact Compendium Database - FastAPI Backend
Main application entry point with router configuration and middleware setup.
"""

import os
import time
from contextlib import asynccontextmanager
from fastapi import FastAPI, HTTPException, Request
from fastapi.middleware.cors import CORSMiddleware
from fastapi.middleware.trustedhost import TrustedHostMiddleware
from fastapi.responses import JSONResponse
from sqlalchemy import text
from mangum import Mangum
import logging
from dotenv import load_dotenv

# Load environment variables
load_dotenv()

# Import routers
from app.routers import auth, studies, indicators, admin, reports
from app.routers import clarisa, reference, study_relations, studies_crud
from app.db.connection import db_connection
from app.utils.logging import setup_logging

# Setup logging
setup_logging()
logger = logging.getLogger(__name__)

@asynccontextmanager
async def lifespan(app: FastAPI):
    """Application lifespan events"""
    logger.info("Starting Impact Compendium API")
    
    # Test database connection
    try:
        engine = db_connection.get_engine()
        with engine.connect() as conn:
            conn.execute(text("SELECT 1"))
        logger.info("Database connection successful")
    except Exception as e:
        logger.error(f"Database connection failed: {e}")
    
    yield
    logger.info("Shutting down Impact Compendium API")

# Create FastAPI application
app = FastAPI(
    title="Impact Compendium API",
    description="REST API for CGIAR Impact Compendium Database - Research impact study management platform",
    version="1.0.0",
    docs_url="/docs",
    redoc_url="/redoc",
    openapi_url="/openapi.json",
    lifespan=lifespan,
    contact={
        "name": "CGIAR Alliance Bioversity & CIAT",
        "email": "support@cgiar.org",
    },
    license_info={
        "name": "MIT",
        "url": "https://opensource.org/licenses/MIT",
    },
)

# CORS middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # Configure based on environment
    allow_credentials=True,
    allow_methods=["GET", "POST", "PUT", "DELETE", "OPTIONS"],
    allow_headers=["*"],
)

# Custom middleware for request logging
@app.middleware("http")
async def log_requests(request: Request, call_next):
    """Log all incoming requests"""
    start_time = time.time()
    
    # Log request
    logger.info(f"Request: {request.method} {request.url}")
    
    response = await call_next(request)
    
    # Log response
    process_time = time.time() - start_time
    logger.info(f"Response: {response.status_code} - {process_time:.3f}s")
    
    return response

# Exception handlers
@app.exception_handler(HTTPException)
async def http_exception_handler(request: Request, exc: HTTPException):
    """Handle HTTP exceptions with consistent format"""
    return JSONResponse(
        status_code=exc.status_code,
        content={
            "error": exc.detail,
            "status_code": exc.status_code,
            "path": str(request.url.path)
        }
    )

@app.exception_handler(Exception)
async def general_exception_handler(request: Request, exc: Exception):
    """Handle general exceptions"""
    logger.error(f"Unhandled exception: {exc}", exc_info=True)
    return JSONResponse(
        status_code=500,
        content={
            "error": "Internal server error",
            "status_code": 500,
            "path": str(request.url.path)
        }
    )

# Health check endpoint
@app.get("/health", tags=["Health"])
async def health_check():
    """Health check endpoint for monitoring"""
    try:
        # Test database connection
        engine = db_connection.get_engine()
        with engine.connect() as conn:
            conn.execute(text("SELECT 1"))
        db_status = "connected"
    except Exception as e:
        logger.error(f"Database health check failed: {e}")
        db_status = "disconnected"
    
    return {
        "status": "healthy",
        "service": "impact-compendium-api",
        "version": "1.0.0",
        "environment": os.getenv("ENVIRONMENT", "dev"),
        "database": db_status
    }

# Root endpoint
@app.get("/", tags=["Root"])
async def root():
    """Root endpoint with API information"""
    return {
        "message": "Impact Compendium Database API",
        "version": "1.0.0",
        "docs_url": "/docs",
        "health_url": "/health"
    }

# Include routers
app.include_router(auth.router, prefix="/auth", tags=["Authentication"])
app.include_router(studies.router, prefix="/studies", tags=["Studies"])
app.include_router(studies_crud.router, prefix="/studies-crud", tags=["Studies CRUD"])
app.include_router(indicators.router, prefix="/indicators", tags=["Indicators"])
app.include_router(admin.router, prefix="/admin", tags=["Administration"])
app.include_router(reports.router, prefix="/reports", tags=["Reports"])
app.include_router(clarisa.router, prefix="/clarisa", tags=["CLARISA Reference Data"])
app.include_router(reference.router, prefix="/reference", tags=["Reference Data"])
app.include_router(study_relations.router, prefix="/study-relations", tags=["Study Relations"])

# Lambda handler for AWS deployment
handler = Mangum(app, lifespan="off")

if __name__ == "__main__":
    import uvicorn
    
    uvicorn.run(
        "main:app",
        host="0.0.0.0",
        port=8000,
        reload=True,
        log_level="info"
    )
