"""
Lambda Handler for Impact Compendium
"""
import os
from mangum import Mangum

# Set AWS environment before imports
os.environ.setdefault('AWS_PROFILE', 'IBD-DEV')
os.environ.setdefault('AWS_DEFAULT_REGION', 'us-east-1')

# Import the full FastAPI app
from app.main import app

# Create Lambda handler with optimized settings
handler = Mangum(
    app, 
    lifespan="off",
    api_gateway_base_path=None,
    text_mime_types=[
        "application/json",
        "application/javascript",
        "application/xml",
        "application/vnd.api+json",
        "application/x-www-form-urlencoded",
    ]
)
