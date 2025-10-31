"""
Lambda Handler for Impact Compendium
"""
import os
from mangum import Mangum

# Import the full FastAPI app
from app.main import app

# Create Lambda handler with HTML support
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
        "text/html",
        "text/css",
        "text/plain",
        "text/javascript"
    ]
)
