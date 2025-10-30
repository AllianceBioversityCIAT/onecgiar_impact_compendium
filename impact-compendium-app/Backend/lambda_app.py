"""
Lambda-optimized FastAPI app configuration
"""
import os
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from app.routers import auth, studies, indicators, admin, reports, users
from app.routers import clarisa, reference, study_relations

# Set AWS environment for Lambda
os.environ.setdefault('AWS_PROFILE', 'IBD-DEV')
os.environ.setdefault('AWS_DEFAULT_REGION', 'us-east-1')

# Create FastAPI app without lifespan for Lambda
app = FastAPI(
    title="Impact Compendium API",
    description="Research Impact Database API",
    version="1.0.0",
    docs_url="/docs",
    redoc_url="/redoc"
)

# Configure CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Include routers
app.include_router(auth.router, prefix="/api/v1/auth", tags=["Authentication"])
app.include_router(users.router, prefix="/api/v1/users", tags=["Users"])
app.include_router(studies.router, prefix="/api/v1/studies", tags=["Studies"])
app.include_router(indicators.router, prefix="/api/v1/indicators", tags=["Indicators"])
app.include_router(reports.router, prefix="/api/v1/reports", tags=["Reports"])
app.include_router(admin.router, prefix="/api/v1/admin", tags=["Administration"])
app.include_router(clarisa.router, prefix="/api/v1/clarisa", tags=["CLARISA"])
app.include_router(reference.router, prefix="/api/v1/reference", tags=["Reference"])
app.include_router(study_relations.router, prefix="/api/v1/relations", tags=["Relations"])

@app.get("/")
async def root():
    """Root endpoint"""
    return {"message": "Impact Compendium API", "version": "1.0.0"}

@app.get("/health")
async def health_check():
    """Health check endpoint"""
    return {"status": "healthy", "service": "impact-compendium-api"}
