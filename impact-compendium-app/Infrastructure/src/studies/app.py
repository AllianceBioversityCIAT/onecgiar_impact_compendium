"""
Studies API Lambda Function
Handles CRUD operations for research studies
"""

import json
import os
from typing import Dict, Any

from aws_lambda_powertools import Logger, Tracer, Metrics
from aws_lambda_powertools.logging import correlation_paths
from aws_lambda_powertools.metrics import MetricUnit

# Initialize Powertools
logger = Logger()
tracer = Tracer()
metrics = Metrics()

@logger.inject_lambda_context(correlation_id_path=correlation_paths.API_GATEWAY_REST)
@tracer.capture_lambda_handler
@metrics.log_metrics(capture_cold_start_metric=True)
def lambda_handler(event: Dict[str, Any], context: Any) -> Dict[str, Any]:
    """
    Lambda handler for Studies API endpoints
    
    Args:
        event: API Gateway event
        context: Lambda context
        
    Returns:
        API Gateway response
    """
    
    # Log the incoming request
    logger.info("Studies API request received", extra={
        "http_method": event.get("httpMethod"),
        "resource_path": event.get("resource"),
        "path_parameters": event.get("pathParameters"),
        "query_parameters": event.get("queryStringParameters")
    })
    
    # Add custom metrics
    metrics.add_metric(name="StudiesAPIInvocation", unit=MetricUnit.Count, value=1)
    
    try:
        # Extract request information
        http_method = event.get("httpMethod", "")
        resource_path = event.get("resource", "")
        path_params = event.get("pathParameters") or {}
        query_params = event.get("queryStringParameters") or {}
        
        # Route to appropriate handler based on HTTP method and path
        if http_method == "GET" and resource_path == "/studies":
            response = handle_list_studies(query_params)
        elif http_method == "POST" and resource_path == "/studies":
            body = json.loads(event.get("body", "{}"))
            response = handle_create_study(body)
        elif http_method == "GET" and resource_path == "/studies/{id}":
            study_id = path_params.get("id")
            response = handle_get_study(study_id)
        elif http_method == "PUT" and resource_path == "/studies/{id}":
            study_id = path_params.get("id")
            body = json.loads(event.get("body", "{}"))
            response = handle_update_study(study_id, body)
        elif http_method == "DELETE" and resource_path == "/studies/{id}":
            study_id = path_params.get("id")
            response = handle_delete_study(study_id)
        else:
            response = {
                "statusCode": 404,
                "body": json.dumps({"error": "Endpoint not found"})
            }
        
        # Add success metric
        metrics.add_metric(name="StudiesAPISuccess", unit=MetricUnit.Count, value=1)
        
        return response
        
    except Exception as e:
        logger.exception("Error processing Studies API request")
        metrics.add_metric(name="StudiesAPIError", unit=MetricUnit.Count, value=1)
        
        return {
            "statusCode": 500,
            "headers": {
                "Content-Type": "application/json",
                "Access-Control-Allow-Origin": "*"
            },
            "body": json.dumps({
                "error": "Internal server error",
                "message": str(e)
            })
        }

@tracer.capture_method
def handle_list_studies(query_params: Dict[str, Any]) -> Dict[str, Any]:
    """Handle GET /studies - List all studies with optional filtering"""
    logger.info("Listing studies", extra={"query_params": query_params})
    
    # TODO: Implement database query logic
    # This is a placeholder response
    studies = [
        {
            "id": 1,
            "title": "Sample Impact Study",
            "description": "A sample study for testing",
            "study_type": "impact",
            "status": "published",
            "created_at": "2025-10-21T00:00:00Z"
        }
    ]
    
    return {
        "statusCode": 200,
        "headers": {
            "Content-Type": "application/json",
            "Access-Control-Allow-Origin": "*"
        },
        "body": json.dumps({
            "studies": studies,
            "total": len(studies),
            "page": 1,
            "per_page": 10
        })
    }

@tracer.capture_method
def handle_create_study(body: Dict[str, Any]) -> Dict[str, Any]:
    """Handle POST /studies - Create a new study"""
    logger.info("Creating new study", extra={"study_data": body})
    
    # TODO: Implement database insert logic
    # This is a placeholder response
    new_study = {
        "id": 2,
        "title": body.get("title", ""),
        "description": body.get("description", ""),
        "study_type": body.get("study_type", "impact"),
        "status": "draft",
        "created_at": "2025-10-21T00:00:00Z"
    }
    
    return {
        "statusCode": 201,
        "headers": {
            "Content-Type": "application/json",
            "Access-Control-Allow-Origin": "*"
        },
        "body": json.dumps(new_study)
    }

@tracer.capture_method
def handle_get_study(study_id: str) -> Dict[str, Any]:
    """Handle GET /studies/{id} - Get a specific study"""
    logger.info("Getting study", extra={"study_id": study_id})
    
    if not study_id:
        return {
            "statusCode": 400,
            "headers": {
                "Content-Type": "application/json",
                "Access-Control-Allow-Origin": "*"
            },
            "body": json.dumps({"error": "Study ID is required"})
        }
    
    # TODO: Implement database query logic
    # This is a placeholder response
    study = {
        "id": int(study_id),
        "title": "Sample Impact Study",
        "description": "A detailed sample study for testing",
        "study_type": "impact",
        "status": "published",
        "created_at": "2025-10-21T00:00:00Z",
        "indicators": [],
        "contributors": []
    }
    
    return {
        "statusCode": 200,
        "headers": {
            "Content-Type": "application/json",
            "Access-Control-Allow-Origin": "*"
        },
        "body": json.dumps(study)
    }

@tracer.capture_method
def handle_update_study(study_id: str, body: Dict[str, Any]) -> Dict[str, Any]:
    """Handle PUT /studies/{id} - Update a study"""
    logger.info("Updating study", extra={"study_id": study_id, "update_data": body})
    
    # TODO: Implement database update logic
    # This is a placeholder response
    updated_study = {
        "id": int(study_id),
        "title": body.get("title", "Updated Study"),
        "description": body.get("description", ""),
        "study_type": body.get("study_type", "impact"),
        "status": body.get("status", "draft"),
        "updated_at": "2025-10-21T00:00:00Z"
    }
    
    return {
        "statusCode": 200,
        "headers": {
            "Content-Type": "application/json",
            "Access-Control-Allow-Origin": "*"
        },
        "body": json.dumps(updated_study)
    }

@tracer.capture_method
def handle_delete_study(study_id: str) -> Dict[str, Any]:
    """Handle DELETE /studies/{id} - Delete a study"""
    logger.info("Deleting study", extra={"study_id": study_id})
    
    # TODO: Implement database delete logic (soft delete)
    
    return {
        "statusCode": 204,
        "headers": {
            "Access-Control-Allow-Origin": "*"
        },
        "body": ""
    }
