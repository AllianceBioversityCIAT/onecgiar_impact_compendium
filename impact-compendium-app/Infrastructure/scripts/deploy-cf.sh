#!/bin/bash

# CloudFormation Deploy Script
# Usage: ./scripts/deploy-cf.sh [environment] [stack-name]

ENVIRONMENT=${1:-testing}
STACK_NAME=${2:-impact-compendium-$ENVIRONMENT}

# Select template based on environment
if [ "$ENVIRONMENT" = "production" ]; then
    TEMPLATE="cloudformation-production-environment.yaml"
else
    TEMPLATE="cloudformation-testing-environment.yaml"
fi

echo "🚀 Deploying CloudFormation stack: $STACK_NAME"
echo "Environment: $ENVIRONMENT"
echo "Template: $TEMPLATE"
echo "Profile: IBD-DEV"
echo "Region: us-east-1"

# Production confirmation
if [ "$ENVIRONMENT" = "production" ]; then
    read -p "⚠️  Are you sure you want to deploy to PRODUCTION? (yes/no): " confirm
    if [ "$confirm" != "yes" ]; then
        echo "❌ Deployment cancelled"
        exit 1
    fi
fi

# Navigate to Infrastructure directory
cd "$(dirname "$0")/.."

# Check if template exists
if [ ! -f "$TEMPLATE" ]; then
    echo "❌ Template file not found: $TEMPLATE"
    exit 1
fi

# Deploy stack
aws cloudformation create-stack \
    --stack-name "$STACK_NAME" \
    --template-body "file://$(pwd)/$TEMPLATE" \
    --capabilities CAPABILITY_NAMED_IAM \
    --parameters \
        ParameterKey=Environment,ParameterValue=$ENVIRONMENT \
        ParameterKey=ProjectName,ParameterValue=impact-compendium \
    --profile IBD-DEV \
    --region us-east-1 \
    --tags \
        Key=Project,Value=impact-compendium \
        Key=Environment,Value=$ENVIRONMENT \
        Key=Owner,Value=cgiar-alliance

echo "Waiting for deployment to complete..."
aws cloudformation wait stack-create-complete \
    --stack-name "$STACK_NAME" \
    --profile IBD-DEV \
    --region us-east-1

echo ""
echo "📋 Stack Outputs:"
aws cloudformation describe-stacks \
    --stack-name "$STACK_NAME" \
    --profile IBD-DEV \
    --region us-east-1 \
    --query 'Stacks[0].Outputs' \
    --output table

echo ""
echo "✅ Deployment completed successfully!"
