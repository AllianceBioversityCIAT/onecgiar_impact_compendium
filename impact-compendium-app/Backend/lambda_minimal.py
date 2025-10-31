import json

def handler(event, context):
    """Minimal Lambda handler for testing"""
    
    # Basic health check response
    if event.get('path') == '/testing/health' or event.get('rawPath') == '/testing/health':
        return {
            'statusCode': 200,
            'headers': {
                'Content-Type': 'application/json',
                'Access-Control-Allow-Origin': '*'
            },
            'body': json.dumps({
                'status': 'healthy',
                'message': 'Impact Compendium Backend is running',
                'environment': 'testing'
            })
        }
    
    # Default response for all other paths
    return {
        'statusCode': 200,
        'headers': {
            'Content-Type': 'application/json',
            'Access-Control-Allow-Origin': '*'
        },
        'body': json.dumps({
            'message': 'Impact Compendium API',
            'version': '1.0.0',
            'environment': 'testing',
            'available_endpoints': [
                '/testing/health'
            ]
        })
    }
