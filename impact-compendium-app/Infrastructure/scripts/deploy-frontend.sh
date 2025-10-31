#!/bin/bash

# Deploy Frontend to S3 + CloudFront
# Usage: ./scripts/deploy-frontend.sh [source-directory]

SOURCE_DIR=${1:-"../Frontend/build"}
BUCKET_NAME="impact-compendium-frontend-testing-569113802249"

echo "🚀 Deploying frontend to S3 + CloudFront"
echo "Source: $SOURCE_DIR"
echo "Bucket: $BUCKET_NAME"

if [ ! -d "$SOURCE_DIR" ]; then
    echo "❌ Source directory not found: $SOURCE_DIR"
    echo "Building basic index.html instead..."
    
    # Create basic index if source doesn't exist
    cat > /tmp/index.html << 'EOF'
<!DOCTYPE html>
<html><head><title>Impact Compendium</title></head>
<body><h1>Impact Compendium - Testing Environment</h1>
<p>API: <a href="https://plquqwcug2.execute-api.us-east-1.amazonaws.com/testing">https://plquqwcug2.execute-api.us-east-1.amazonaws.com/testing</a></p>
</body></html>
EOF
    
    aws s3 cp /tmp/index.html s3://$BUCKET_NAME/index.html --profile IBD-DEV --region us-east-1
else
    # Deploy built frontend
    aws s3 sync "$SOURCE_DIR" s3://$BUCKET_NAME --delete --profile IBD-DEV --region us-east-1
fi

# Get CloudFront distribution ID
DISTRIBUTION_ID=$(aws cloudformation describe-stacks --stack-name impact-compendium-testing --profile IBD-DEV --region us-east-1 --query 'Stacks[0].Outputs[?OutputKey==`CloudFrontUrl`].OutputValue' --output text | sed 's|https://||' | sed 's|\.cloudfront\.net||')

if [ -n "$DISTRIBUTION_ID" ]; then
    echo "🔄 Invalidating CloudFront cache..."
    aws cloudfront create-invalidation --distribution-id "$DISTRIBUTION_ID" --paths "/*" --profile IBD-DEV --region us-east-1
    echo "✅ Frontend deployed successfully!"
    echo "🌐 URL: https://$DISTRIBUTION_ID.cloudfront.net"
else
    echo "⚠️  Could not find CloudFront distribution ID"
fi
