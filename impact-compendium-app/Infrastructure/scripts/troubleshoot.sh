#!/bin/bash

# Troubleshooting Script for Impact Compendium
# Usage: ./scripts/troubleshoot.sh [environment]

ENVIRONMENT=${1:-testing}
STACK_NAME="impact-compendium-$ENVIRONMENT"

echo "🔍 Impact Compendium Troubleshooting"
echo "Environment: $ENVIRONMENT"
echo "Stack: $STACK_NAME"
echo "===================================="

# Check stack status
echo "📊 CloudFormation Stack Status:"
aws cloudformation describe-stacks --stack-name "$STACK_NAME" --profile IBD-DEV --region us-east-1 --query 'Stacks[0].StackStatus' --output text 2>/dev/null || echo "Stack not found"

echo ""
echo "🔗 Stack Outputs:"
aws cloudformation describe-stacks --stack-name "$STACK_NAME" --profile IBD-DEV --region us-east-1 --query 'Stacks[0].Outputs[*].{Key:OutputKey,Value:OutputValue}' --output table 2>/dev/null || echo "No outputs available"

echo ""
echo "🧪 API Health Check:"
API_ENDPOINT=$(aws cloudformation describe-stacks --stack-name "$STACK_NAME" --profile IBD-DEV --region us-east-1 --query 'Stacks[0].Outputs[?OutputKey==`ApiEndpoint`].OutputValue' --output text 2>/dev/null)
if [ -n "$API_ENDPOINT" ]; then
    echo "Testing: $API_ENDPOINT"
    curl -s -w "Status: %{http_code}\n" "$API_ENDPOINT" || echo "API not responding"
else
    echo "API endpoint not found"
fi

echo ""
echo "📝 Recent Lambda Logs:"
LAMBDA_NAME="impact-compendium-backend-$ENVIRONMENT"
aws logs describe-log-streams --log-group-name "/aws/lambda/$LAMBDA_NAME" --profile IBD-DEV --region us-east-1 --order-by LastEventTime --descending --max-items 1 --query 'logStreams[0].logStreamName' --output text 2>/dev/null

echo ""
echo "🏷️  Resource Status:"
aws cloudformation describe-stack-resources --stack-name "$STACK_NAME" --profile IBD-DEV --region us-east-1 --query 'StackResources[0:5].{Type:ResourceType,Status:ResourceStatus}' --output table 2>/dev/null || echo "No resources found"
