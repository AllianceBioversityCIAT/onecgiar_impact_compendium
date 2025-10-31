#!/bin/bash

# Deploy Frontend to S3 + CloudFront
# Usage: ./scripts/deploy-frontend.sh [environment] [source-directory]

ENVIRONMENT=${1:-testing}
SOURCE_DIR=${2:-"../Frontend/dist"}
PROJECT_NAME="impact-compendium"

echo "🚀 Deploying frontend to S3 + CloudFront"
echo "Environment: $ENVIRONMENT"
echo "Source: $SOURCE_DIR"

# Production confirmation
if [ "$ENVIRONMENT" = "production" ]; then
    read -p "⚠️  Are you sure you want to deploy to PRODUCTION? (yes/no): " confirm
    if [ "$confirm" != "yes" ]; then
        echo "❌ Deployment cancelled"
        exit 1
    fi
fi

# Find bucket name by pattern (includes account ID)
BUCKET_NAME=$(aws s3 ls --profile IBD-DEV | grep "$PROJECT_NAME-frontend-$ENVIRONMENT" | awk '{print $3}')

if [ -z "$BUCKET_NAME" ]; then
    echo "❌ Could not find S3 bucket for environment: $ENVIRONMENT"
    echo "Expected pattern: $PROJECT_NAME-frontend-$ENVIRONMENT-*"
    exit 1
fi

echo "Bucket: $BUCKET_NAME"

if [ ! -d "$SOURCE_DIR" ]; then
    echo "❌ Source directory not found: $SOURCE_DIR"
    echo "Please build the frontend first: cd Frontend && npm run build"
    exit 1
fi

# Deploy built frontend
echo "📦 Uploading files to S3..."
aws s3 sync "$SOURCE_DIR" s3://$BUCKET_NAME --delete --profile IBD-DEV --region us-east-1

# Find CloudFront distribution for this bucket
echo "🔍 Finding CloudFront distribution..."
DISTRIBUTION_ID=$(aws cloudfront list-distributions --profile IBD-DEV --region us-east-1 \
    --query "DistributionList.Items[?Origins.Items[0].DomainName=='$BUCKET_NAME.s3.us-east-1.amazonaws.com'].Id" \
    --output text)

if [ -n "$DISTRIBUTION_ID" ] && [ "$DISTRIBUTION_ID" != "None" ]; then
    echo "🔄 Invalidating CloudFront cache (Distribution: $DISTRIBUTION_ID)..."
    aws cloudfront create-invalidation \
        --distribution-id "$DISTRIBUTION_ID" \
        --paths "/*" \
        --profile IBD-DEV \
        --region us-east-1
    
    # Get CloudFront URL
    CLOUDFRONT_URL=$(aws cloudfront get-distribution --id "$DISTRIBUTION_ID" --profile IBD-DEV --region us-east-1 \
        --query 'Distribution.DomainName' --output text)
    
    echo "✅ Frontend deployed successfully!"
    echo "🌐 URL: https://$CLOUDFRONT_URL"
else
    echo "⚠️  Could not find CloudFront distribution for bucket: $BUCKET_NAME"
    echo "✅ Files uploaded to S3 successfully!"
fi
