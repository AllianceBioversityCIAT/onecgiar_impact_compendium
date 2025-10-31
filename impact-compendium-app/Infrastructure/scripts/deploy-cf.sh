#!/bin/bash

# CloudFormation Deploy Script
# Usage: ./scripts/deploy-cf.sh [template-name] [stack-name]

TEMPLATE=${1:-cloudformation-complete.yaml}
STACK_NAME=${2:-impact-compendium-testing}

echo "🚀 Deploying CloudFormation stack: $STACK_NAME"
echo "Template: $TEMPLATE"
echo "Profile: IBD-DEV"
echo "Region: us-east-1"

# Navigate to Infrastructure directory
cd "$(dirname "$0")/.."

# Deploy stack
aws cloudformation create-stack \
    --stack-name "$STACK_NAME" \
    --template-body "file://$(pwd)/$TEMPLATE" \
    --capabilities CAPABILITY_NAMED_IAM \
    --parameters \
        ParameterKey=Environment,ParameterValue=testing \
        ParameterKey=ProjectName,ParameterValue=impact-compendium \
        ParameterKey=LambdaCodeKey,ParameterValue=lambda-complete.zip \
    --profile IBD-DEV \
    --region us-east-1 \
    --tags \
        Key=Project,Value=impact-compendium \
        Key=Environment,Value=testing \
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
