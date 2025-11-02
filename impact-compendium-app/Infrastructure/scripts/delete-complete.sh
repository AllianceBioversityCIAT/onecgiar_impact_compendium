#!/bin/bash

# Complete Infrastructure + Backend Cleanup Script
# Usage: ./scripts/delete-complete.sh [environment]

ENVIRONMENT=${1:-testing}
INFRA_STACK_NAME="impact-compendium-$ENVIRONMENT"
BACKEND_STACK_NAME="impact-compendium-backend-$ENVIRONMENT"

echo "🗑️  Complete Cleanup: Backend + Infrastructure"
echo "Environment: $ENVIRONMENT"
echo "Backend Stack: $BACKEND_STACK_NAME"
echo "Infrastructure Stack: $INFRA_STACK_NAME"
echo "Profile: IBD-DEV"
echo "Region: us-east-1"
echo ""

# Confirm deletion
read -p "⚠️  Are you sure you want to delete ALL resources for $ENVIRONMENT? (yes/no): " confirm
if [ "$confirm" != "yes" ]; then
    echo "❌ Cleanup cancelled"
    exit 1
fi

# Step 1: Delete Backend Stack First
echo "🔧 Step 1: Deleting Backend Stack..."
aws cloudformation delete-stack \
    --stack-name "$BACKEND_STACK_NAME" \
    --profile IBD-DEV \
    --region us-east-1

echo "⏳ Waiting for backend deletion..."
aws cloudformation wait stack-delete-complete \
    --stack-name "$BACKEND_STACK_NAME" \
    --profile IBD-DEV \
    --region us-east-1

if [ $? -eq 0 ]; then
    echo "✅ Backend stack deleted successfully!"
else
    echo "⚠️  Backend stack deletion completed (may not have existed)"
fi

echo ""

# Step 2: Delete Infrastructure Stack
echo "📦 Step 2: Deleting Infrastructure Stack..."
aws cloudformation delete-stack \
    --stack-name "$INFRA_STACK_NAME" \
    --profile IBD-DEV \
    --region us-east-1

echo "⏳ Waiting for infrastructure deletion..."
aws cloudformation wait stack-delete-complete \
    --stack-name "$INFRA_STACK_NAME" \
    --profile IBD-DEV \
    --region us-east-1

if [ $? -eq 0 ]; then
    echo "✅ Infrastructure stack deleted successfully!"
else
    echo "⚠️  Infrastructure stack deletion completed (may not have existed)"
fi

echo ""
echo "🎉 Complete cleanup finished!"
echo ""
echo "💡 Note: S3 buckets with content and RDS snapshots may still exist"
echo "   Check AWS Console to manually delete if needed"
