#!/bin/bash

# IGAD SAM Delete Script
# Usage: ./scripts/delete.sh [testing|production]

set -e

ENVIRONMENT=${1:-testing}

if [[ "$ENVIRONMENT" != "testing" && "$ENVIRONMENT" != "production" ]]; then
    echo "❌ Error: Environment must be 'testing' or 'production'"
    echo "Usage: ./scripts/delete.sh [testing|production]"
    exit 1
fi

STACK_NAME="igad-$ENVIRONMENT"

echo "🗑️  Deleting IGAD $ENVIRONMENT environment..."
echo "Profile: IBD-DEV"
echo "Region: us-east-1"
echo "Stack: $STACK_NAME"

# Confirm deletion
read -p "Are you sure you want to delete the $ENVIRONMENT environment? (y/N): " -n 1 -r
echo
if [[ ! $REPLY =~ ^[Yy]$ ]]; then
    echo "Deletion cancelled."
    exit 0
fi

# Navigate to Infrastructure directory
cd "$(dirname "$0")/.."

# Empty S3 bucket first (if exists)
echo "Checking for S3 bucket to empty..."
BUCKET_NAME=$(aws cloudformation describe-stacks \
    --stack-name "$STACK_NAME" \
    --profile IBD-DEV \
    --region us-east-1 \
    --query 'Stacks[0].Outputs[?OutputKey==`S3BucketName`].OutputValue' \
    --output text 2>/dev/null || echo "")

if [[ -n "$BUCKET_NAME" && "$BUCKET_NAME" != "None" ]]; then
    echo "Emptying S3 bucket: $BUCKET_NAME"
    aws s3 rm s3://$BUCKET_NAME --recursive --profile IBD-DEV || true
fi

# Delete CloudFormation stack
echo "Deleting CloudFormation stack..."
sam delete --stack-name "$STACK_NAME" --profile IBD-DEV --no-prompts

echo ""
echo "✅ $ENVIRONMENT environment deleted successfully!"

if [[ "$ENVIRONMENT" == "testing" ]]; then
    echo ""
    echo "📝 Manual cleanup (if needed):"
    echo "1. Check for any remaining RDS snapshots"
    echo "2. Verify VPC and security groups are deleted"
    echo "3. Clean up any remaining SSM parameters"
fi
