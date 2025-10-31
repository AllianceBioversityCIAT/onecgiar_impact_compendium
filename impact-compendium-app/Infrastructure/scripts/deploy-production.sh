#!/bin/bash

# Production Deployment Script
# Usage: ./scripts/deploy-production.sh

echo "🚀 Production Deployment - Impact Compendium"
echo "Profile: IBD-DEV"
echo "Region: us-east-1"
echo ""

# Production confirmation
read -p "⚠️  Are you sure you want to deploy to PRODUCTION? (yes/no): " confirm
if [ "$confirm" != "yes" ]; then
    echo "❌ Deployment cancelled"
    exit 1
fi

echo "📋 Production Deployment Steps:"
echo "1. Create Production Cognito User Pool (if needed)"
echo "2. Deploy Backend (SAM)"
echo "3. Build Frontend for Production"
echo "4. Deploy Frontend"
echo ""

# Navigate to Infrastructure directory
cd "$(dirname "$0")/.."

# Step 1: Check if production Cognito exists
echo "🔍 Checking Production Cognito User Pool..."
PROD_POOL=$(aws cognito-idp list-user-pools --max-results 20 --profile IBD-DEV --region us-east-1 \
    --query 'UserPools[?Name==`impact-compendium-users-prod`].Id' --output text)

if [ -z "$PROD_POOL" ] || [ "$PROD_POOL" = "None" ]; then
    echo "⚠️  Production Cognito User Pool not found"
    echo "Please create production user pool first or use CloudFormation deployment"
    exit 1
else
    echo "✅ Production Cognito User Pool found: $PROD_POOL"
fi

# Step 2: Deploy Backend
echo "🔧 Deploying Production Backend..."
cd backend-sam

sam build --profile IBD-DEV
if [ $? -ne 0 ]; then
    echo "❌ SAM build failed"
    exit 1
fi

sam deploy --config-env production --profile IBD-DEV
if [ $? -ne 0 ]; then
    echo "❌ SAM deploy failed"
    exit 1
fi

echo "✅ Backend deployed successfully"
cd ..

# Step 3: Build Frontend for Production
echo "🔧 Building Frontend for Production..."
cd ../Frontend

# Use production environment file
cp .env.production.prod .env.production

npm run build
if [ $? -ne 0 ]; then
    echo "❌ Frontend build failed"
    exit 1
fi

echo "✅ Frontend built successfully"
cd ../Infrastructure

# Step 4: Deploy Frontend
echo "🔧 Deploying Production Frontend..."
./scripts/deploy-frontend.sh production ../Frontend/dist

echo ""
echo "🎉 Production deployment completed!"
echo ""

# Show production URLs
echo "📋 Production Information:"
API_URL=$(aws cloudformation describe-stacks \
    --stack-name "impact-compendium-backend-prod" \
    --profile IBD-DEV \
    --region us-east-1 \
    --query 'Stacks[0].Outputs[?OutputKey==`ImpactCompendiumApiUrl`].OutputValue' \
    --output text 2>/dev/null)

if [ -n "$API_URL" ]; then
    echo "🔗 Production API: $API_URL"
    echo "📚 API Docs: ${API_URL}docs"
fi

echo ""
echo "⚠️  Next Steps:"
echo "1. Set up custom domain for API Gateway"
echo "2. Configure production frontend domain"
echo "3. Update DNS records"
echo "4. Test production deployment"
