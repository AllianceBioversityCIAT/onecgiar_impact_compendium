#!/bin/bash

# Complete Impact Compendium Deployment Script
# Usage: ./scripts/deploy-complete.sh [environment]

ENVIRONMENT=${1:-testing}
PROJECT_NAME="impact-compendium"

echo "🚀 Complete Impact Compendium Deployment"
echo "Environment: $ENVIRONMENT"
echo "Profile: IBD-DEV"
echo "Region: us-east-1"
echo ""

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

echo "📋 Deployment Steps:"
echo "1. Deploy Backend (SAM)"
echo "2. Build Frontend"
echo "3. Deploy Frontend (S3 + CloudFront)"
echo ""

# Step 1: Deploy Backend using SAM
echo "🔧 Step 1: Deploying Backend..."
cd backend-sam

# Build and deploy SAM application
sam build --profile IBD-DEV
if [ $? -ne 0 ]; then
    echo "❌ SAM build failed"
    exit 1
fi

sam deploy --config-env $ENVIRONMENT --profile IBD-DEV
if [ $? -ne 0 ]; then
    echo "❌ SAM deploy failed"
    exit 1
fi

echo "✅ Backend deployed successfully"
cd ..

# Step 2: Build Frontend
echo "🔧 Step 2: Building Frontend..."
cd ../Frontend

# Install dependencies if needed
if [ ! -d "node_modules" ]; then
    echo "📦 Installing frontend dependencies..."
    npm install
fi

# Build for production
npm run build
if [ $? -ne 0 ]; then
    echo "❌ Frontend build failed"
    exit 1
fi

echo "✅ Frontend built successfully"
cd ../Infrastructure

# Step 3: Deploy Frontend
echo "🔧 Step 3: Deploying Frontend..."
./scripts/deploy-frontend.sh $ENVIRONMENT ../Frontend/dist

echo ""
echo "🎉 Complete deployment finished!"
echo ""

# Show deployment information
echo "📋 Deployment Information:"

# Get API Gateway URL
API_URL=$(aws cloudformation describe-stacks \
    --stack-name "$PROJECT_NAME-backend-$ENVIRONMENT" \
    --profile IBD-DEV \
    --region us-east-1 \
    --query 'Stacks[0].Outputs[?OutputKey==`ImpactCompendiumApiUrl`].OutputValue' \
    --output text 2>/dev/null)

if [ -n "$API_URL" ]; then
    echo "🔗 API URL: $API_URL"
    echo "📚 API Docs: ${API_URL}docs"
fi

# Get Frontend URL
BUCKET_NAME=$(aws s3 ls --profile IBD-DEV | grep "$PROJECT_NAME-frontend-$ENVIRONMENT" | awk '{print $3}')
if [ -n "$BUCKET_NAME" ]; then
    DISTRIBUTION_ID=$(aws cloudfront list-distributions --profile IBD-DEV --region us-east-1 \
        --query "DistributionList.Items[?Origins.Items[0].DomainName=='$BUCKET_NAME.s3.us-east-1.amazonaws.com'].Id" \
        --output text)
    
    if [ -n "$DISTRIBUTION_ID" ] && [ "$DISTRIBUTION_ID" != "None" ]; then
        CLOUDFRONT_URL=$(aws cloudfront get-distribution --id "$DISTRIBUTION_ID" --profile IBD-DEV --region us-east-1 \
            --query 'Distribution.DomainName' --output text)
        echo "🌐 Frontend URL: https://$CLOUDFRONT_URL"
    fi
fi

echo ""
echo "✅ Deployment completed successfully!"
