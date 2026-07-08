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

if [ "$INFRA_EXISTS" = "CREATE_COMPLETE" ] || [ "$INFRA_EXISTS" = "UPDATE_COMPLETE" ] || [ "$INFRA_EXISTS" = "UPDATE_ROLLBACK_COMPLETE" ]; then
    # UPDATE_ROLLBACK_COMPLETE is a terminal "exists" state — the stack is intact
    # at the prior version after a failed update was rolled back. Treat it as
    # "exists" so we don't try create-stack and fail with AlreadyExistsException.
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
            ParameterKey=DomainName,ParameterValue=test-impact-admin.prms.cgiar.org \
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

    if [[ $? -ne 0 ]]; then
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

if [ "$BACKEND_EXISTS" = "CREATE_COMPLETE" ] || [ "$BACKEND_EXISTS" = "UPDATE_COMPLETE" ] || [ "$BACKEND_EXISTS" = "UPDATE_ROLLBACK_COMPLETE" ]; then
    echo "✅ Backend already exists (Status: $BACKEND_EXISTS)"
    echo "   Updating backend deployment..."

    cd backend-sam

    # Pre-clean .aws-sam to avoid the stale-cache hang. Use `mv` rather than `rm`
    # — stale build dirs can be mode 700 and rm may be silently denied; mv works.
    if [ -d ".aws-sam" ]; then
        mv .aws-sam ".aws-sam.OLD-$(date +%s)"
    fi

    sam build --use-container --profile IBD-DEV

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

    if [ -d ".aws-sam" ]; then
        mv .aws-sam ".aws-sam.OLD-$(date +%s)"
    fi

    # Build SAM application
    echo "Building SAM application..."
    sam build --use-container --profile IBD-DEV

    if [[ $? -ne 0 ]]; then
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

    if [[ $? -ne 0 ]]; then
        echo "❌ Backend deployment failed!"
        exit 1
    fi
fi

echo "✅ Backend deployed successfully!"
echo ""

# Navigate back to Infrastructure directory
cd ..

# Step 3: Update Frontend Configuration and Deploy
echo "🌐 Step 3: Updating Frontend Configuration..."

# Update frontend environment variables with current API URL
echo "🔧 Updating frontend environment variables..."
bash "$(pwd)/scripts/update-frontend-config.sh" $ENVIRONMENT

if [[ $? -ne 0 ]]; then
    echo "❌ Failed to update frontend configuration"
    exit 1
fi

echo ""
echo "📦 Step 4: Building and Deploying Frontend..."

# Navigate to frontend directory and rebuild with updated config
cd ../Frontend

echo "🔨 Building frontend with updated configuration..."
npm run build

if [[ $? -ne 0 ]]; then
    echo "❌ Frontend build failed!"
    exit 1
fi

# Get S3 bucket name from infrastructure stack (while still in Frontend directory)
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

# Sync built frontend to S3 (from Frontend directory)
if [ ! -d "dist" ]; then
    echo "❌ Frontend dist directory not found after build"
    exit 1
fi

aws s3 sync dist/ s3://$S3_BUCKET/ \
    --profile IBD-DEV \
    --region us-east-1 \
    --delete

if [[ $? -ne 0 ]]; then
    echo "❌ Frontend deployment failed!"
    exit 1
fi

echo "✅ Frontend deployed successfully!"

# Get CloudFront Distribution ID
echo "🔄 Invalidating CloudFront cache..."

# Try to get Distribution ID from CloudFormation outputs first
DISTRIBUTION_ID=$(aws cloudformation describe-stacks \
    --stack-name "$INFRA_STACK_NAME" \
    --profile IBD-DEV \
    --region us-east-1 \
    --query 'Stacks[0].Outputs[?OutputKey==`CloudFrontDistributionId`].OutputValue' \
    --output text 2>/dev/null)

# If not found in outputs, try to find it by S3 bucket origin
if [ -z "$DISTRIBUTION_ID" ] || [ "$DISTRIBUTION_ID" = "None" ]; then
    echo "🔍 Searching for CloudFront distribution by S3 bucket origin..."
    DISTRIBUTION_ID=$(aws cloudfront list-distributions \
        --profile IBD-DEV \
        --query "DistributionList.Items[?contains(Origins.Items[0].DomainName, '$S3_BUCKET')].Id" \
        --output text 2>/dev/null)
fi

if [ -z "$DISTRIBUTION_ID" ] || [ "$DISTRIBUTION_ID" = "None" ]; then
    echo "⚠️  CloudFront Distribution ID not found, skipping cache invalidation"
    echo "💡 Frontend changes may take time to appear due to CloudFront caching"
else
    # Create invalidation for all files
    echo "🎯 Found CloudFront Distribution: $DISTRIBUTION_ID"
    INVALIDATION_ID=$(aws cloudfront create-invalidation \
        --distribution-id "$DISTRIBUTION_ID" \
        --paths "/*" \
        --profile IBD-DEV \
        --query 'Invalidation.Id' \
        --output text)
    
    if [ $? -eq 0 ]; then
        echo "✅ CloudFront cache invalidation created: $INVALIDATION_ID"
        echo "🕐 Cache invalidation may take 5-15 minutes to complete"
        echo "🔄 New frontend changes will be visible after invalidation completes"
    else
        echo "⚠️  CloudFront cache invalidation failed, but deployment succeeded"
        echo "💡 You may need to wait for cache TTL or manually invalidate cache"
    fi
fi

# Navigate back to Infrastructure directory for final outputs
cd ../Infrastructure

echo ""

# Step 5: Display Results
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
