#!/bin/bash

# Deploy Frontend to S3 + CloudFront
# Usage: ./scripts/deploy-frontend.sh [environment] [source-directory]

ENVIRONMENT=${1:-testing}
SOURCE_DIR=${2:-"../Frontend/dist"}
STACK_NAME="impact-compendium-$ENVIRONMENT"

echo "🚀 Deploying frontend to S3 + CloudFront"
echo "Environment: $ENVIRONMENT"
echo "Source: $SOURCE_DIR"
echo "Stack: $STACK_NAME"

# Production confirmation
if [ "$ENVIRONMENT" = "production" ]; then
    read -p "⚠️  Are you sure you want to deploy to PRODUCTION? (yes/no): " confirm
    if [ "$confirm" != "yes" ]; then
        echo "❌ Deployment cancelled"
        exit 1
    fi
fi

# Get bucket name from CloudFormation stack
BUCKET_NAME=$(aws cloudformation describe-stacks \
    --stack-name "$STACK_NAME" \
    --profile IBD-DEV \
    --region us-east-1 \
    --query 'Stacks[0].Outputs[?OutputKey==`S3BucketName`].OutputValue' \
    --output text)

if [ -z "$BUCKET_NAME" ]; then
    echo "❌ Could not find S3 bucket name from stack: $STACK_NAME"
    exit 1
fi

echo "Bucket: $BUCKET_NAME"

if [ ! -d "$SOURCE_DIR" ]; then
    echo "❌ Source directory not found: $SOURCE_DIR"
    echo "Please build the frontend first: cd Frontend && npm run build"
    exit 1
fi

# Deploy built frontend
aws s3 sync "$SOURCE_DIR" s3://$BUCKET_NAME --delete --profile IBD-DEV --region us-east-1

# Get CloudFront distribution ID from stack outputs
CLOUDFRONT_URL=$(aws cloudformation describe-stacks \
    --stack-name "$STACK_NAME" \
    --profile IBD-DEV \
    --region us-east-1 \
    --query 'Stacks[0].Outputs[?OutputKey==`CloudFrontUrl`].OutputValue' \
    --output text)

if [ -n "$CLOUDFRONT_URL" ]; then
    # Extract distribution ID from URL
    DISTRIBUTION_ID=$(echo "$CLOUDFRONT_URL" | sed 's|https://||' | sed 's|\.cloudfront\.net||')
    
    echo "🔄 Invalidating CloudFront cache..."
    aws cloudfront create-invalidation \
        --distribution-id "$DISTRIBUTION_ID" \
        --paths "/*" \
        --profile IBD-DEV \
        --region us-east-1
    
    echo "✅ Frontend deployed successfully!"
    echo "🌐 URL: $CLOUDFRONT_URL"
else
    echo "⚠️  Could not find CloudFront distribution URL"
fi
