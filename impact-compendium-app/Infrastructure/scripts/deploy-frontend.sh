#!/bin/bash

# Frontend-Only Deployment Script
# Usage: ./scripts/deploy-frontend.sh [environment]

ENVIRONMENT=${1:-testing}
INFRA_STACK_NAME="impact-compendium-$ENVIRONMENT"

echo "🌐 Frontend Deployment"
echo "Environment: $ENVIRONMENT"
echo "Profile: IBD-DEV"
echo "Region: us-east-1"
echo ""

# Navigate to Infrastructure directory
cd "$(dirname "$0")/.."

# Get S3 bucket name from infrastructure stack
echo "📦 Getting S3 bucket name..."
S3_BUCKET=$(aws cloudformation describe-stacks \
    --stack-name "$INFRA_STACK_NAME" \
    --profile IBD-DEV \
    --region us-east-1 \
    --query 'Stacks[0].Outputs[?OutputKey==`S3BucketName`].OutputValue' \
    --output text)

if [ -z "$S3_BUCKET" ]; then
    echo "❌ Could not get S3 bucket name. Is infrastructure deployed?"
    echo "   Run: ./scripts/deploy-complete.sh $ENVIRONMENT"
    exit 1
fi

echo "📦 Target bucket: $S3_BUCKET"

# Navigate to frontend directory
cd ../Frontend

# Check if dist directory exists
if [ ! -d "dist" ]; then
    echo "⚠️  Frontend not built. Building now..."
    npm run build
    
    if [ $? -ne 0 ]; then
        echo "❌ Frontend build failed!"
        exit 1
    fi
fi

# Sync to S3
echo "🚀 Uploading frontend files..."
aws s3 sync dist/ s3://$S3_BUCKET/ \
    --profile IBD-DEV \
    --region us-east-1 \
    --delete

if [ $? -ne 0 ]; then
    echo "❌ Frontend deployment failed!"
    exit 1
fi

# Get CloudFront distribution ID and invalidate cache
echo "🔄 Invalidating CloudFront cache..."
cd ../Infrastructure

# Get CloudFront distribution ID
CLOUDFRONT_DISTRIBUTION_ID=$(aws cloudformation describe-stack-resources \
    --stack-name "$INFRA_STACK_NAME" \
    --profile IBD-DEV \
    --region us-east-1 \
    --query 'StackResources[?ResourceType==`AWS::CloudFront::Distribution`].PhysicalResourceId' \
    --output text 2>/dev/null)

if [ -n "$CLOUDFRONT_DISTRIBUTION_ID" ]; then
    echo "📡 Creating CloudFront invalidation for distribution: $CLOUDFRONT_DISTRIBUTION_ID"
    
    INVALIDATION_ID=$(aws cloudfront create-invalidation \
        --distribution-id "$CLOUDFRONT_DISTRIBUTION_ID" \
        --paths "/*" \
        --profile IBD-DEV \
        --query 'Invalidation.Id' \
        --output text)
    
    if [ $? -eq 0 ]; then
        echo "✅ CloudFront invalidation created: $INVALIDATION_ID"
    else
        echo "⚠️  CloudFront invalidation failed, but deployment succeeded"
    fi
else
    echo "⚠️  Could not find CloudFront distribution ID"
fi

# Get CloudFront URL for display
CLOUDFRONT_URL=$(aws cloudformation describe-stacks \
    --stack-name "$INFRA_STACK_NAME" \
    --profile IBD-DEV \
    --region us-east-1 \
    --query 'Stacks[0].Outputs[?OutputKey==`CloudFrontUrl`].OutputValue' \
    --output text)

echo "✅ Frontend deployed successfully!"
echo ""
echo "🌐 Frontend URL: $CLOUDFRONT_URL"
echo "⏳ CloudFront invalidation in progress - changes will be visible shortly"
