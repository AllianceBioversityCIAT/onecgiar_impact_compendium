#!/bin/bash

# Update Frontend Configuration Script
# Usage: ./scripts/update-frontend-config.sh [environment]

ENVIRONMENT=${1:-testing}
BACKEND_STACK_NAME="impact-compendium-backend-$ENVIRONMENT"
INFRA_STACK_NAME="impact-compendium-$ENVIRONMENT"

echo "🔧 Updating Frontend Configuration"
echo "Environment: $ENVIRONMENT"
echo "Profile: IBD-DEV"
echo "Region: us-east-1"
echo ""

# Get current API URL from backend stack
echo "📡 Getting current API URL..."
API_URL=$(aws cloudformation describe-stacks \
    --stack-name "$BACKEND_STACK_NAME" \
    --profile IBD-DEV \
    --region us-east-1 \
    --query 'Stacks[0].Outputs[?OutputKey==`ImpactCompendiumApiUrl`].OutputValue' \
    --output text 2>/dev/null)

if [[ -z "$API_URL" ]]; then
    echo "❌ Could not get API URL from backend stack: $BACKEND_STACK_NAME"
    echo "   Make sure the backend is deployed"
    exit 1
fi

# Remove trailing slash if present
API_URL=${API_URL%/}

echo "🔗 Current API URL: $API_URL"

# Get Cognito configuration from infrastructure stack
echo "🔐 Getting Cognito configuration..."
COGNITO_USER_POOL_ID=$(aws cloudformation describe-stacks \
    --stack-name "$INFRA_STACK_NAME" \
    --profile IBD-DEV \
    --region us-east-1 \
    --query 'Stacks[0].Outputs[?OutputKey==`CognitoUserPoolId`].OutputValue' \
    --output text 2>/dev/null)

COGNITO_CLIENT_ID=$(aws cloudformation describe-stacks \
    --stack-name "$INFRA_STACK_NAME" \
    --profile IBD-DEV \
    --region us-east-1 \
    --query 'Stacks[0].Outputs[?OutputKey==`CognitoClientId`].OutputValue' \
    --output text 2>/dev/null)

if [ -z "$COGNITO_USER_POOL_ID" ] || [ -z "$COGNITO_CLIENT_ID" ]; then
    echo "❌ Could not get Cognito configuration from infrastructure stack: $INFRA_STACK_NAME"
    echo "   Make sure the infrastructure is deployed"
    exit 1
fi

echo "🔐 Cognito User Pool ID: $COGNITO_USER_POOL_ID"
echo "🔐 Cognito Client ID: $COGNITO_CLIENT_ID"

# Navigate to Frontend directory
cd ../Frontend

# Update all environment files
echo ""
echo "📝 Updating all environment files..."

# Create the environment configuration content
ENV_CONTENT="VITE_USE_MOCKS=false
VITE_API_BASE_URL=$API_URL

# AWS Cognito Configuration
VITE_AWS_REGION=us-east-1
VITE_COGNITO_USER_POOL_ID=$COGNITO_USER_POOL_ID
VITE_COGNITO_CLIENT_ID=$COGNITO_CLIENT_ID"

# Update .env (base file)
echo "📝 Updating .env..."
echo "$ENV_CONTENT" > .env

# Update .env.production file
echo "📝 Updating .env.production..."
echo "$ENV_CONTENT" > .env.production

# Update .env.local if it exists
if [ -f ".env.local" ]; then
    echo "📝 Updating .env.local..."
    echo "$ENV_CONTENT" > .env.local
fi

echo ""
echo "✅ Frontend configuration updated successfully!"
echo ""
echo "📋 Updated Configuration:"
echo "   API URL: $API_URL"
echo "   Cognito User Pool: $COGNITO_USER_POOL_ID"
echo "   Cognito Client: $COGNITO_CLIENT_ID"
echo ""
echo "💡 Next steps:"
echo "   1. Build frontend: npm run build"
echo "   2. Deploy frontend: ../Infrastructure/scripts/deploy-frontend.sh $ENVIRONMENT"
echo ""
echo "🚀 Or use complete deployment (includes build): ../Infrastructure/scripts/deploy-complete.sh $ENVIRONMENT"
