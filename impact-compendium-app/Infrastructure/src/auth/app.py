"""
Authentication API Lambda Function
Handles user authentication and JWT token management
"""

import json
from typing import Dict, Any

from aws_lambda_powertools import Logger, Tracer, Metrics
from aws_lambda_powertools.logging import correlation_paths
from aws_lambda_powertools.metrics import MetricUnit

logger = Logger()
tracer = Tracer()
metrics = Metrics()

@logger.inject_lambda_context(correlation_id_path=correlation_paths.API_GATEWAY_REST)
@tracer.capture_lambda_handler
@metrics.log_metrics(capture_cold_start_metric=True)
def lambda_handler(event: Dict[str, Any], context: Any) -> Dict[str, Any]:
    """Lambda handler for Authentication API endpoints"""
    
    logger.info("Auth API request received", extra={
        "http_method": event.get("httpMethod"),
        "resource_path": event.get("resource")
    })
    
    metrics.add_metric(name="AuthAPIInvocation", unit=MetricUnit.Count, value=1)
    
    try:
        http_method = event.get("httpMethod", "")
        resource_path = event.get("resource", "")
        
        if http_method == "POST" and resource_path == "/auth/login":
            body = json.loads(event.get("body", "{}"))
            response = handle_login(body)
        elif http_method == "POST" and resource_path == "/auth/refresh":
            body = json.loads(event.get("body", "{}"))
            response = handle_refresh_token(body)
        elif http_method == "POST" and resource_path == "/auth/logout":
            response = handle_logout()
        elif http_method == "GET" and resource_path == "/auth/profile":
            response = handle_get_profile(event)
        else:
            response = {
                "statusCode": 404,
                "body": json.dumps({"error": "Endpoint not found"})
            }
        
        metrics.add_metric(name="AuthAPISuccess", unit=MetricUnit.Count, value=1)
        return response
        
    except Exception as e:
        logger.exception("Error processing Auth API request")
        metrics.add_metric(name="AuthAPIError", unit=MetricUnit.Count, value=1)
        
        return {
            "statusCode": 500,
            "headers": {"Content-Type": "application/json", "Access-Control-Allow-Origin": "*"},
            "body": json.dumps({"error": "Internal server error", "message": str(e)})
        }

@tracer.capture_method
def handle_login(body: Dict[str, Any]) -> Dict[str, Any]:
    """Handle user login"""
    # TODO: Implement Cognito authentication
    return {
        "statusCode": 200,
        "headers": {"Content-Type": "application/json", "Access-Control-Allow-Origin": "*"},
        "body": json.dumps({
            "access_token": "sample_access_token",
            "refresh_token": "sample_refresh_token",
            "expires_in": 3600,
            "user": {
                "id": "user123",
                "email": "user@example.com",
                "role": "researcher"
            }
        })
    }

@tracer.capture_method
def handle_refresh_token(body: Dict[str, Any]) -> Dict[str, Any]:
    """Handle token refresh"""
    # TODO: Implement token refresh logic
    return {
        "statusCode": 200,
        "headers": {"Content-Type": "application/json", "Access-Control-Allow-Origin": "*"},
        "body": json.dumps({
            "access_token": "new_access_token",
            "expires_in": 3600
        })
    }

@tracer.capture_method
def handle_logout() -> Dict[str, Any]:
    """Handle user logout"""
    # TODO: Implement logout logic
    return {
        "statusCode": 200,
        "headers": {"Content-Type": "application/json", "Access-Control-Allow-Origin": "*"},
        "body": json.dumps({"message": "Logged out successfully"})
    }

@tracer.capture_method
def handle_get_profile(event: Dict[str, Any]) -> Dict[str, Any]:
    """Handle get user profile"""
    # TODO: Extract user from JWT token and get profile
    return {
        "statusCode": 200,
        "headers": {"Content-Type": "application/json", "Access-Control-Allow-Origin": "*"},
        "body": json.dumps({
            "id": "user123",
            "email": "user@example.com",
            "role": "researcher",
            "organization": "CGIAR",
            "center": "Alliance Bioversity & CIAT"
        })
    }
