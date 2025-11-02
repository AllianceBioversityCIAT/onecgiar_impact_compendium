#!/bin/bash

# Complete Infrastructure + Backend Deployment Script
# Usage: ./scripts/deploy-complete.sh [environment]

ENVIRONMENT=${1:-testing}
INFRA_STACK_NAME="impact-compendium-$ENVIRONMENT"
BACKEND_STACK_NAME="impact-compendium-backend-$ENVIRONMENT"

echo "🚀 Complete Deployment: Infrastructure + Backend"
echo "Environment: $ENVIRONMENT"
echo "Profile: IBD-DEV"
echo "Region: us-east-1"
echo ""

# Navigate to Infrastructure directory
cd "$(dirname "$0")/.."

# Step 1: Check and Deploy Infrastructure if needed
echo "📦 Step 1: Checking Infrastructure..."

# Check if infrastructure stack exists
INFRA_EXISTS=$(aws cloudformation describe-stacks \
    --stack-name "$INFRA_STACK_NAME" \
    --profile IBD-DEV \
    --region us-east-1 \
    --query 'Stacks[0].StackStatus' \
    --output text 2>/dev/null)

if [ "$INFRA_EXISTS" = "CREATE_COMPLETE" ] || [ "$INFRA_EXISTS" = "UPDATE_COMPLETE" ]; then
    echo "✅ Infrastructure already exists (Status: $INFRA_EXISTS)"
    echo "   Using existing infrastructure with CloudFormation exports"
    echo "   Available resources: VPC, RDS, Cognito, S3, CloudFront"
else
    echo "🚀 Deploying new infrastructure..."
    aws cloudformation create-stack \
        --stack-name "$INFRA_STACK_NAME" \
        --template-body "file://$(pwd)/cloudformation-infrastructure-only.yaml" \
        --capabilities CAPABILITY_NAMED_IAM \
        --parameters \
            ParameterKey=Environment,ParameterValue=$ENVIRONMENT \
            ParameterKey=ProjectName,ParameterValue=impact-compendium \
        --profile IBD-DEV \
        --region us-east-1 \
        --tags \
            Key=Project,Value=impact-compendium \
            Key=Environment,Value=$ENVIRONMENT \
            Key=Component,Value=infrastructure

    echo "⏳ Waiting for infrastructure deployment..."
    aws cloudformation wait stack-create-complete \
        --stack-name "$INFRA_STACK_NAME" \
        --profile IBD-DEV \
        --region us-east-1

    if [ $? -ne 0 ]; then
        echo "❌ Infrastructure deployment failed!"
        exit 1
    fi

    echo "✅ Infrastructure deployed successfully!"
fi
echo ""

# Step 2: Check and Deploy Backend if needed
echo "🔧 Step 2: Checking Backend..."

# Check if backend stack exists
BACKEND_EXISTS=$(aws cloudformation describe-stacks \
    --stack-name "$BACKEND_STACK_NAME" \
    --profile IBD-DEV \
    --region us-east-1 \
    --query 'Stacks[0].StackStatus' \
    --output text 2>/dev/null)

if [ "$BACKEND_EXISTS" = "CREATE_COMPLETE" ] || [ "$BACKEND_EXISTS" = "UPDATE_COMPLETE" ]; then
    echo "✅ Backend already exists (Status: $BACKEND_EXISTS)"
    echo "   Updating backend deployment..."
    
    cd backend-sam
    sam build --profile IBD-DEV
    
    sam deploy \
        --stack-name "$BACKEND_STACK_NAME" \
        --parameter-overrides \
            Environment=$ENVIRONMENT \
            ProjectName=impact-compendium \
        --capabilities CAPABILITY_IAM \
        --profile IBD-DEV \
        --region us-east-1 \
        --no-confirm-changeset
else
    echo "🚀 Deploying new backend..."
    cd backend-sam

    # Build SAM application
    echo "Building SAM application..."
    sam build --profile IBD-DEV

    if [ $? -ne 0 ]; then
        echo "❌ SAM build failed!"
        exit 1
    fi

    # Deploy SAM application
    echo "Deploying SAM application..."
    sam deploy \
        --stack-name "$BACKEND_STACK_NAME" \
        --parameter-overrides \
            Environment=$ENVIRONMENT \
            ProjectName=impact-compendium \
        --capabilities CAPABILITY_IAM \
        --profile IBD-DEV \
        --region us-east-1 \
        --no-confirm-changeset

    if [ $? -ne 0 ]; then
        echo "❌ Backend deployment failed!"
        exit 1
    fi
fi

echo "✅ Backend deployed successfully!"
echo ""

# Step 3: Deploy Frontend to S3
echo "🌐 Step 3: Deploying Frontend to S3..."

# Get S3 bucket name from infrastructure stack
S3_BUCKET=$(aws cloudformation describe-stacks \
    --stack-name "$INFRA_STACK_NAME" \
    --profile IBD-DEV \
    --region us-east-1 \
    --query 'Stacks[0].Outputs[?OutputKey==`S3BucketName`].OutputValue' \
    --output text)

if [ -z "$S3_BUCKET" ]; then
    echo "❌ Could not get S3 bucket name from infrastructure stack"
    exit 1
fi

echo "📦 Uploading to bucket: $S3_BUCKET"

# Navigate to frontend directory and sync to S3
cd ../../Frontend

if [ ! -d "dist" ]; then
    echo "❌ Frontend dist directory not found. Run 'npm run build' first."
    exit 1
fi

aws s3 sync dist/ s3://$S3_BUCKET/ \
    --profile IBD-DEV \
    --region us-east-1 \
    --delete

if [ $? -ne 0 ]; then
    echo "❌ Frontend deployment failed!"
    exit 1
fi

echo "✅ Frontend deployed successfully!"

# Navigate back to Infrastructure directory
cd ../Infrastructure

echo ""

# Step 4: Display Results
echo "📋 Deployment Summary:"
echo ""
echo "Infrastructure Stack Outputs:"
aws cloudformation describe-stacks \
    --stack-name "$INFRA_STACK_NAME" \
    --profile IBD-DEV \
    --region us-east-1 \
    --query 'Stacks[0].Outputs' \
    --output table

echo ""
echo "Backend Stack Outputs:"
aws cloudformation describe-stacks \
    --stack-name "$BACKEND_STACK_NAME" \
    --profile IBD-DEV \
    --region us-east-1 \
    --query 'Stacks[0].Outputs' \
    --output table

echo ""
echo "🎉 Complete deployment finished successfully!"
echo ""
echo "📍 Key URLs:"
API_URL=$(aws cloudformation describe-stacks \
    --stack-name "$BACKEND_STACK_NAME" \
    --profile IBD-DEV \
    --region us-east-1 \
    --query 'Stacks[0].Outputs[?OutputKey==`ImpactCompendiumApiUrl`].OutputValue' \
    --output text)

DOCS_URL=$(aws cloudformation describe-stacks \
    --stack-name "$BACKEND_STACK_NAME" \
    --profile IBD-DEV \
    --region us-east-1 \
    --query 'Stacks[0].Outputs[?OutputKey==`SwaggerUIUrl`].OutputValue' \
    --output text)

FRONTEND_URL=$(aws cloudformation describe-stacks \
    --stack-name "$INFRA_STACK_NAME" \
    --profile IBD-DEV \
    --region us-east-1 \
    --query 'Stacks[0].Outputs[?OutputKey==`CloudFrontUrl`].OutputValue' \
    --output text)

echo "🔗 API Endpoint: $API_URL"
echo "📚 API Documentation: $DOCS_URL"
echo "🌐 Frontend URL: $FRONTEND_URL"
