import json

def handler(event, context):
    """Minimal Lambda handler for testing deployment"""
    return {
        'statusCode': 200,
        'headers': {
            'Content-Type': 'application/json',
            'Access-Control-Allow-Origin': '*'
        },
        'body': json.dumps({
            'message': 'Impact Compendium API - Testing Environment',
            'version': '1.0.0',
            'environment': 'testing'
        })
    }
