#!/bin/bash

# Impact Compendium Backend Deployment Script
# This script deploys the FastAPI backend using SAM CLI

set -e

# Configuration
PROJECT_NAME="impact-compendium"
ENVIRONMENT="testing"
PROFILE="IBD-DEV"
REGION="us-east-1"
STACK_NAME="${PROJECT_NAME}-backend-${ENVIRONMENT}"

echo "🚀 Starting Impact Compendium Backend Deployment"
echo "Environment: $ENVIRONMENT"
echo "Profile: $PROFILE"
echo "Region: $REGION"

# Get VPC and networking information from existing CloudFormation stack
echo "📋 Getting infrastructure information from existing stack..."

EXISTING_STACK="${PROJECT_NAME}-${ENVIRONMENT}"

# Get VPC ID
VPC_ID=$(aws cloudformation describe-stacks \
    --stack-name $EXISTING_STACK \
    --profile $PROFILE \
    --region $REGION \
    --query 'Stacks[0].Outputs[?OutputKey==`VPCId`].OutputValue' \
    --output text 2>/dev/null || echo "")

if [ -z "$VPC_ID" ] || [ "$VPC_ID" = "None" ]; then
    echo "⚠️  VPC ID not found in stack outputs. Looking up VPC by tags..."
    VPC_ID=$(aws ec2 describe-vpcs \
        --filters "Name=tag:Project,Values=$PROJECT_NAME" "Name=tag:Environment,Values=$ENVIRONMENT" \
        --profile $PROFILE \
        --region $REGION \
        --query 'Vpcs[0].VpcId' \
        --output text 2>/dev/null || echo "")
fi

# Get Security Group ID
SECURITY_GROUP_ID=$(aws ec2 describe-security-groups \
    --filters "Name=group-name,Values=${PROJECT_NAME}-lambda-sg-${ENVIRONMENT}" \
    --profile $PROFILE \
    --region $REGION \
    --query 'SecurityGroups[0].GroupId' \
    --output text 2>/dev/null || echo "")

# Get Subnet IDs - try multiple naming patterns
SUBNET_1=$(aws ec2 describe-subnets \
    --filters "Name=tag:Name,Values=${PROJECT_NAME}-private-subnet-1-${ENVIRONMENT}" \
    --profile $PROFILE \
    --region $REGION \
    --query 'Subnets[0].SubnetId' \
    --output text 2>/dev/null || echo "")

if [ -z "$SUBNET_1" ] || [ "$SUBNET_1" = "None" ]; then
    # Try alternative naming pattern
    SUBNET_1=$(aws ec2 describe-subnets \
        --filters "Name=vpc-id,Values=$VPC_ID" "Name=tag:Project,Values=$PROJECT_NAME" \
        --profile $PROFILE \
        --region $REGION \
        --query 'Subnets[?contains(Tags[?Key==`Name`].Value, `private`) && contains(Tags[?Key==`Name`].Value, `1`)].SubnetId | [0]' \
        --output text 2>/dev/null || echo "")
fi

SUBNET_2=$(aws ec2 describe-subnets \
    --filters "Name=tag:Name,Values=${PROJECT_NAME}-private-subnet-2-${ENVIRONMENT}" \
    --profile $PROFILE \
    --region $REGION \
    --query 'Subnets[0].SubnetId' \
    --output text 2>/dev/null || echo "")

if [ -z "$SUBNET_2" ] || [ "$SUBNET_2" = "None" ]; then
    # Try alternative naming pattern
    SUBNET_2=$(aws ec2 describe-subnets \
        --filters "Name=vpc-id,Values=$VPC_ID" "Name=tag:Project,Values=$PROJECT_NAME" \
        --profile $PROFILE \
        --region $REGION \
        --query 'Subnets[?contains(Tags[?Key==`Name`].Value, `private`) && contains(Tags[?Key==`Name`].Value, `2`)].SubnetId | [0]' \
        --output text 2>/dev/null || echo "")
fi

# If still not found, get any two private subnets in the VPC
if [ -z "$SUBNET_1" ] || [ "$SUBNET_1" = "None" ] || [ -z "$SUBNET_2" ] || [ "$SUBNET_2" = "None" ]; then
    echo "⚠️  Trying to find private subnets in VPC $VPC_ID..."
    SUBNETS=$(aws ec2 describe-subnets \
        --filters "Name=vpc-id,Values=$VPC_ID" \
        --profile $PROFILE \
        --region $REGION \
        --query 'Subnets[].SubnetId' \
        --output text)
    
    SUBNET_ARRAY=($SUBNETS)
    SUBNET_1=${SUBNET_ARRAY[0]}
    SUBNET_2=${SUBNET_ARRAY[1]}
fi

echo "Infrastructure Information:"
echo "  VPC ID: $VPC_ID"
echo "  Security Group: $SECURITY_GROUP_ID"
echo "  Subnet 1: $SUBNET_1"
echo "  Subnet 2: $SUBNET_2"

# Validate required information
if [ -z "$VPC_ID" ] || [ "$VPC_ID" = "None" ]; then
    echo "❌ Could not find VPC ID. Please check the existing infrastructure."
    exit 1
fi

if [ -z "$SECURITY_GROUP_ID" ] || [ "$SECURITY_GROUP_ID" = "None" ]; then
    echo "❌ Could not find Security Group. Please check the existing infrastructure."
    exit 1
fi

if [ -z "$SUBNET_1" ] || [ "$SUBNET_1" = "None" ] || [ -z "$SUBNET_2" ] || [ "$SUBNET_2" = "None" ]; then
    echo "❌ Could not find required subnets. Please check the existing infrastructure."
    exit 1
fi

# Build the application
echo "🔨 Building SAM application..."
sam build --profile $PROFILE

# Deploy the application
echo "🚀 Deploying backend to AWS..."
sam deploy \
    --config-env $ENVIRONMENT \
    --profile $PROFILE \
    --parameter-overrides \
        "Environment=$ENVIRONMENT" \
        "ProjectName=$PROJECT_NAME" \
        "VpcId=$VPC_ID" \
        "SecurityGroupId=$SECURITY_GROUP_ID" \
        "SubnetId1=$SUBNET_1" \
        "SubnetId2=$SUBNET_2"

# Get the API URL from the deployed stack
API_URL=$(aws cloudformation describe-stacks \
    --stack-name $STACK_NAME \
    --profile $PROFILE \
    --region $REGION \
    --query 'Stacks[0].Outputs[?OutputKey==`ImpactCompendiumApiUrl`].OutputValue' \
    --output text)

DOCS_URL=$(aws cloudformation describe-stacks \
    --stack-name $STACK_NAME \
    --profile $PROFILE \
    --region $REGION \
    --query 'Stacks[0].Outputs[?OutputKey==`SwaggerUIUrl`].OutputValue' \
    --output text)

echo ""
echo "✅ Deployment completed successfully!"
echo ""
echo "📋 Backend Information:"
echo "  API URL: $API_URL"
echo "  Swagger UI: $DOCS_URL"
echo "  Health Check: ${API_URL}health"
echo ""
echo "🧪 Test Commands:"
echo "  curl $API_URL"
echo "  curl ${API_URL}health"
echo "  curl ${API_URL}api/reference/categories"
echo ""
echo "📚 Documentation: $DOCS_URL"
