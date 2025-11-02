#!/bin/bash

# Emergency Force Delete Script
# Usage: ./scripts/force-delete.sh [environment] [stack-type]
# stack-type: backend, infrastructure, or all

ENVIRONMENT=${1:-testing}
STACK_TYPE=${2:-all}
INFRA_STACK_NAME="impact-compendium-$ENVIRONMENT"
BACKEND_STACK_NAME="impact-compendium-backend-$ENVIRONMENT"

echo "🚨 EMERGENCY FORCE DELETE"
echo "Environment: $ENVIRONMENT"
echo "Stack Type: $STACK_TYPE"
echo "Profile: IBD-DEV"
echo "Region: us-east-1"
echo ""

# Warning
echo "⚠️  WARNING: This script will attempt to force delete stacks"
echo "   even if they are in failed or stuck states."
echo "   Use only when normal deletion fails."
echo ""

# Confirm force deletion
read -p "Type 'FORCE DELETE' to confirm emergency deletion: " force_confirm
if [ "$force_confirm" != "FORCE DELETE" ]; then
    echo "❌ Force deletion cancelled"
    exit 1
fi

# Function to force delete a stack
force_delete_stack() {
    local stack_name=$1
    local stack_type=$2
    
    echo "🔥 Force deleting $stack_type stack: $stack_name"
    
    # Check if stack exists
    STACK_STATUS=$(aws cloudformation describe-stacks \
        --stack-name "$stack_name" \
        --profile IBD-DEV \
        --region us-east-1 \
        --query 'Stacks[0].StackStatus' \
        --output text 2>/dev/null)
    
    if [ -z "$STACK_STATUS" ]; then
        echo "ℹ️  Stack $stack_name does not exist"
        return 0
    fi
    
    echo "   Current status: $STACK_STATUS"
    
    # Cancel any in-progress operations first
    if [[ "$STACK_STATUS" == *"IN_PROGRESS"* ]]; then
        echo "   Attempting to cancel in-progress operation..."
        aws cloudformation cancel-update-stack \
            --stack-name "$stack_name" \
            --profile IBD-DEV \
            --region us-east-1 2>/dev/null
        
        echo "   Waiting 30 seconds for cancellation..."
        sleep 30
    fi
    
    # Attempt normal deletion
    echo "   Initiating deletion..."
    aws cloudformation delete-stack \
        --stack-name "$stack_name" \
        --profile IBD-DEV \
        --region us-east-1
    
    if [ $? -ne 0 ]; then
        echo "❌ Failed to initiate deletion for $stack_name"
        return 1
    fi
    
    # Wait with timeout
    echo "   Waiting for deletion (max 20 minutes)..."
    timeout 1200 aws cloudformation wait stack-delete-complete \
        --stack-name "$stack_name" \
        --profile IBD-DEV \
        --region us-east-1
    
    wait_result=$?
    
    if [ $wait_result -eq 0 ]; then
        echo "✅ $stack_type stack deleted successfully!"
        return 0
    elif [ $wait_result -eq 124 ]; then
        echo "⏰ Deletion timed out after 20 minutes"
        echo "   Stack may still be deleting in background"
        echo "   Check AWS Console for current status"
        return 2
    else
        echo "❌ Deletion failed for $stack_name"
        
        # Show failed resources
        echo "   Checking for failed resources..."
        aws cloudformation describe-stack-events \
            --stack-name "$stack_name" \
            --profile IBD-DEV \
            --region us-east-1 \
            --query 'StackEvents[?ResourceStatus==`DELETE_FAILED`].{Resource:LogicalResourceId,Type:ResourceType,Reason:ResourceStatusReason}' \
            --output table 2>/dev/null
        
        return 1
    fi
}

# Execute based on stack type
case $STACK_TYPE in
    "backend")
        force_delete_stack "$BACKEND_STACK_NAME" "backend"
        ;;
    "infrastructure")
        force_delete_stack "$INFRA_STACK_NAME" "infrastructure"
        ;;
    "all")
        echo "🔧 Step 1: Force deleting backend stack..."
        force_delete_stack "$BACKEND_STACK_NAME" "backend"
        backend_result=$?
        
        echo ""
        echo "📦 Step 2: Force deleting infrastructure stack..."
        force_delete_stack "$INFRA_STACK_NAME" "infrastructure"
        infra_result=$?
        
        if [ $backend_result -eq 0 ] && [ $infra_result -eq 0 ]; then
            echo ""
            echo "✅ All stacks force deleted successfully!"
        else
            echo ""
            echo "⚠️  Some stacks may not have been fully deleted"
            echo "   Check AWS Console for remaining resources"
        fi
        ;;
    *)
        echo "❌ Invalid stack type: $STACK_TYPE"
        echo "   Valid options: backend, infrastructure, all"
        exit 1
        ;;
esac

echo ""
echo "🧹 Manual Cleanup Commands (if needed):"
echo ""
echo "# Delete S3 bucket contents"
echo "aws s3 rm s3://impact-compendium-frontend-$ENVIRONMENT-* --recursive --profile IBD-DEV"
echo ""
echo "# Delete Lambda functions manually"
echo "aws lambda delete-function --function-name impact-compendium-backend-api-$ENVIRONMENT --profile IBD-DEV"
echo ""
echo "# Delete API Gateway"
echo "aws apigatewayv2 get-apis --profile IBD-DEV | grep impact-compendium-$ENVIRONMENT"
echo ""
echo "# Delete RDS instance (if stuck)"
echo "aws rds delete-db-instance --db-instance-identifier impact-compendium-db-$ENVIRONMENT --skip-final-snapshot --profile IBD-DEV"
