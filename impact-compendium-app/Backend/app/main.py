"""
Impact Compendium Database - FastAPI Backend
============================================

Main application entry point with router configuration and middleware setup.
This module configures the FastAPI application, sets up middleware, exception handlers,
and includes all API routers for the Impact Compendium research database.

Architecture:
- FastAPI framework for REST API
- SQLAlchemy ORM with MySQL RDS backend
- JWT authentication via AWS Cognito
- Mangum adapter for AWS Lambda deployment
- Comprehensive logging and error handling

Author: CGIAR Alliance Bioversity & CIAT
Version: 1.0.0
"""

import os
import time
from contextlib import asynccontextmanager
from fastapi import FastAPI, HTTPException, Request
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
from sqlalchemy import text
from mangum import Mangum
import logging
from dotenv import load_dotenv

# Set AWS profile BEFORE any other imports
os.environ['AWS_PROFILE'] = 'IBD-DEV'
os.environ['AWS_DEFAULT_REGION'] = 'us-east-1'

# Load environment variables from .env file
load_dotenv()

# Import application routers
from app.routers import auth, studies, indicators, admin, reports, users
from app.routers import clarisa, reference, study_relations
from app.db.connection import db_connection
from app.utils.logging import setup_logging

# Configure application logging
setup_logging()
logger = logging.getLogger(__name__)


@asynccontextmanager
async def lifespan(app: FastAPI):
    """
    Application lifespan events handler
    
    Manages startup and shutdown events for the FastAPI application.
    On startup: Tests database connectivity and logs application start.
    On shutdown: Logs application shutdown.
    
    Args:
        app: FastAPI application instance
    """
    # Startup events
    logger.info("Starting Impact Compendium API")
    
    # Test database connection on startup
    try:
        engine = db_connection.get_engine()
        if engine:
            with engine.connect() as conn:
                conn.execute(text("SELECT 1"))
            logger.info("Database connection successful")
        else:
            logger.warning("Database engine not available")
    except Exception as e:
        logger.error(f"Database connection failed: {e}")
    
    yield
    
    # Shutdown events
    logger.info("Shutting down Impact Compendium API")


# Create FastAPI application instance
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
    servers=[
        {
            "url": "/",
            "description": "Current server"
        }
    ]
)

# Configure CORS middleware for cross-origin requests
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["GET", "POST", "PUT", "DELETE", "OPTIONS"],
    allow_headers=["*"],
    expose_headers=["*"]
)


@app.middleware("http")
async def log_requests(request: Request, call_next):
    """
    Custom middleware for request/response logging
    
    Logs all incoming HTTP requests with timing information.
    Useful for monitoring API usage and performance.
    
    Args:
        request: FastAPI request object
        call_next: Next middleware/handler in the chain
        
    Returns:
        Response object with timing headers
    """
    start_time = time.time()
    
    # Log incoming request
    logger.info(f"Request: {request.method} {request.url}")
    
    # Process request
    response = await call_next(request)
    
    # Calculate and log response time
    process_time = time.time() - start_time
    logger.info(f"Response: {response.status_code} - {process_time:.3f}s")
    
    return response


@app.exception_handler(HTTPException)
async def http_exception_handler(request: Request, exc: HTTPException):
    """
    Handle HTTP exceptions with consistent error format
    
    Provides standardized error responses for all HTTP exceptions.
    Includes error message, status code, and request path for debugging.
    
    Args:
        request: FastAPI request object
        exc: HTTPException instance
        
    Returns:
        JSONResponse with standardized error format
    """
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
    """
    Handle general exceptions with error logging
    
    Catches all unhandled exceptions, logs them for debugging,
    and returns a generic error response to avoid exposing
    sensitive information.
    
    Args:
        request: FastAPI request object
        exc: Exception instance
        
    Returns:
        JSONResponse with generic error message
    """
    logger.error(f"Unhandled exception: {exc}", exc_info=True)
    return JSONResponse(
        status_code=500,
        content={
            "error": "Internal server error",
            "status_code": 500,
            "path": str(request.url.path)
        }
    )


@app.get("/health", tags=["Health"])
async def health_check():
    """
    Health check endpoint for monitoring and load balancers
    
    Provides application health status including database connectivity.
    Used by AWS load balancers and monitoring systems to verify
    application availability.
    
    Returns:
        Dict containing health status, version, and database status
    """
    try:
        # Test database connection
        engine = db_connection.get_engine()
        if engine:
            with engine.connect() as conn:
                conn.execute(text("SELECT 1"))
            db_status = "connected"
        else:
            db_status = "engine_unavailable"
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


@app.get("/", tags=["Root"])
async def root():
    """
    Root endpoint with API information
    
    Provides basic API information and navigation links.
    Useful for API discovery and documentation.
    
    Returns:
        Dict with API metadata and useful links
    """
    return {
        "message": "Impact Compendium Database API",
        "version": "1.0.0",
        "description": "CGIAR research impact study management platform",
        "docs_url": "/docs",
        "health_url": "/health",
        "api_prefix": "/api"
    }


# Include API routers with consistent /api prefix
# Each router handles a specific domain of functionality

# Authentication and user management
app.include_router(
    auth.router, 
    prefix="/api/auth", 
    tags=["Authentication"]
)

# Core studies CRUD operations
app.include_router(
    studies.router, 
    prefix="/api/studies", 
    tags=["Studies"]
)

# Study indicators management
app.include_router(
    indicators.router, 
    prefix="/api/indicators", 
    tags=["Indicators"]
)

# Administrative functions
app.include_router(
    admin.router, 
    prefix="/api/admin", 
    tags=["Administration"]
)

# Reporting and analytics
app.include_router(
    reports.router, 
    prefix="/api/reports", 
    tags=["Reports"]
)

# User management
app.include_router(
    users.router, 
    prefix="/api/users", 
    tags=["User Management"]
)

# CLARISA reference data integration
app.include_router(
    clarisa.router, 
    prefix="/api/clarisa", 
    tags=["CLARISA Reference Data"]
)

# General reference data
app.include_router(
    reference.router, 
    prefix="/api/reference", 
    tags=["Reference Data"]
)

# Study relationship management
app.include_router(
    study_relations.router, 
    prefix="/api/study-relations", 
    tags=["Study Relations"]
)

# Lambda handler for AWS deployment
# Mangum adapter converts ASGI application to AWS Lambda handler
handler = Mangum(app, lifespan="off")

# Development server configuration
if __name__ == "__main__":
    import uvicorn
    
    # Run development server with hot reload
    uvicorn.run(
        "main:app",
        host="0.0.0.0",
        port=8000,
        reload=True,
        log_level="info"
    )
