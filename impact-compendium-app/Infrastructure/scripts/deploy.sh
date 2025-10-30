#!/bin/bash

# IGAD SAM Deploy Script
# Usage: ./scripts/deploy.sh [testing|production]

set -e

ENVIRONMENT=${1:-testing}

if [[ "$ENVIRONMENT" != "testing" && "$ENVIRONMENT" != "production" ]]; then
    echo "❌ Error: Environment must be 'testing' or 'production'"
    echo "Usage: ./scripts/deploy.sh [testing|production]"
    exit 1
fi

echo "🚀 Deploying IGAD to $ENVIRONMENT environment..."
echo "Profile: IBD-DEV"
echo "Region: us-east-1"
echo "Stack: igad-$ENVIRONMENT"

# Navigate to Infrastructure directory
cd "$(dirname "$0")/.."

# Build first
echo "Building SAM application..."
sam build --profile IBD-DEV

# Deploy to specified environment
echo "Deploying to $ENVIRONMENT..."
sam deploy --config-env $ENVIRONMENT --profile IBD-DEV

# Get stack outputs
echo ""
echo "📋 Stack Outputs:"
aws cloudformation describe-stacks \
    --stack-name "igad-$ENVIRONMENT" \
    --profile IBD-DEV \
    --region us-east-1 \
    --query 'Stacks[0].Outputs[*].[OutputKey,OutputValue]' \
    --output table

echo ""
echo "✅ Deployment to $ENVIRONMENT completed successfully!"

if [[ "$ENVIRONMENT" == "production" ]]; then
    echo ""
    echo "⚠️  Production Deployment Notes:"
    echo "1. Update the database URL parameter with actual credentials:"
    echo "   aws ssm put-parameter --name '/igad/production/database-url' --value 'mysql://user:pass@endpoint:3306/db' --overwrite --profile IBD-DEV"
    echo "2. Configure custom domain and ACM certificate if needed"
    echo "3. Update WAF rules as required"
fi
