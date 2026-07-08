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

# Check if stacks exist before attempting deletion
echo "📊 Checking current stack status..."

BACKEND_EXISTS=$(aws cloudformation describe-stacks \
    --stack-name "$BACKEND_STACK_NAME" \
    --profile IBD-DEV \
    --region us-east-1 \
    --query 'Stacks[0].StackStatus' \
    --output text 2>/dev/null)

INFRA_EXISTS=$(aws cloudformation describe-stacks \
    --stack-name "$INFRA_STACK_NAME" \
    --profile IBD-DEV \
    --region us-east-1 \
    --query 'Stacks[0].StackStatus' \
    --output text 2>/dev/null)

if [ -z "$BACKEND_EXISTS" ] && [ -z "$INFRA_EXISTS" ]; then
    echo "ℹ️  No stacks found for environment: $ENVIRONMENT"
    echo "   Nothing to delete."
    exit 0
fi

echo "Backend Stack Status: ${BACKEND_EXISTS:-"NOT FOUND"}"
echo "Infrastructure Stack Status: ${INFRA_EXISTS:-"NOT FOUND"}"
echo ""

# Production environment extra confirmation
if [[ "$ENVIRONMENT" == "production" || "$ENVIRONMENT" == "prod" ]]; then
    echo "🚨 WARNING: You are about to delete PRODUCTION environment!"
    read -p "Type 'DELETE PRODUCTION' to confirm: " prod_confirm
    if [ "$prod_confirm" != "DELETE PRODUCTION" ]; then
        echo "❌ Production deletion cancelled"
        exit 1
    fi
fi

# Confirm deletion
read -p "⚠️  Are you sure you want to delete ALL resources for $ENVIRONMENT? (yes/no): " confirm
if [ "$confirm" != "yes" ]; then
    echo "❌ Cleanup cancelled"
    exit 1
fi

# Function to check if stack is in a deletable state
check_stack_deletable() {
    local stack_name=$1
    local stack_status=$2
    
    case $stack_status in
        "CREATE_IN_PROGRESS"|"UPDATE_IN_PROGRESS"|"DELETE_IN_PROGRESS")
            echo "⚠️  Stack $stack_name is currently in progress state: $stack_status"
            echo "   Please wait for the operation to complete before deleting"
            return 1
            ;;
        "ROLLBACK_IN_PROGRESS"|"UPDATE_ROLLBACK_IN_PROGRESS")
            echo "⚠️  Stack $stack_name is in rollback state: $stack_status"
            echo "   Please wait for rollback to complete before deleting"
            return 1
            ;;
        "")
            echo "ℹ️  Stack $stack_name does not exist"
            return 2
            ;;
        *)
            return 0
            ;;
    esac
}

# Step 1: Delete Backend Stack First (if exists)
if [ -n "$BACKEND_EXISTS" ]; then
    echo "🔧 Step 1: Deleting Backend Stack..."
    
    check_stack_deletable "$BACKEND_STACK_NAME" "$BACKEND_EXISTS"
    backend_check_result=$?
    
    if [ $backend_check_result -eq 1 ]; then
        echo "❌ Cannot delete backend stack in current state"
        exit 1
    elif [ $backend_check_result -eq 2 ]; then
        echo "ℹ️  Backend stack does not exist, skipping..."
    else
        aws cloudformation delete-stack \
            --stack-name "$BACKEND_STACK_NAME" \
            --profile IBD-DEV \
            --region us-east-1

        if [ $? -ne 0 ]; then
            echo "❌ Failed to initiate backend stack deletion"
            exit 1
        fi

        echo "⏳ Waiting for backend deletion..."
        aws cloudformation wait stack-delete-complete \
            --stack-name "$BACKEND_STACK_NAME" \
            --profile IBD-DEV \
            --region us-east-1

        if [ $? -eq 0 ]; then
            echo "✅ Backend stack deleted successfully!"
        else
            echo "❌ Backend stack deletion failed or timed out"
            echo "   Check AWS Console for details"
            exit 1
        fi
    fi
else
    echo "ℹ️  Backend stack does not exist, skipping..."
fi

echo ""

# Step 2: Delete Infrastructure Stack (if exists)
if [ -n "$INFRA_EXISTS" ]; then
    echo "📦 Step 2: Deleting Infrastructure Stack..."
    
    check_stack_deletable "$INFRA_STACK_NAME" "$INFRA_EXISTS"
    infra_check_result=$?
    
    if [ $infra_check_result -eq 1 ]; then
        echo "❌ Cannot delete infrastructure stack in current state"
        exit 1
    elif [ $infra_check_result -eq 2 ]; then
        echo "ℹ️  Infrastructure stack does not exist, skipping..."
    else
        aws cloudformation delete-stack \
            --stack-name "$INFRA_STACK_NAME" \
            --profile IBD-DEV \
            --region us-east-1

        if [ $? -ne 0 ]; then
            echo "❌ Failed to initiate infrastructure stack deletion"
            exit 1
        fi

        echo "⏳ Waiting for infrastructure deletion..."
        aws cloudformation wait stack-delete-complete \
            --stack-name "$INFRA_STACK_NAME" \
            --profile IBD-DEV \
            --region us-east-1

        if [ $? -eq 0 ]; then
            echo "✅ Infrastructure stack deleted successfully!"
        else
            echo "❌ Infrastructure stack deletion failed or timed out"
            echo "   This may be due to resources that cannot be automatically deleted"
            echo "   Check AWS Console for details"
            
            # Show remaining resources
            echo ""
            echo "📋 Checking for remaining resources..."
            aws cloudformation describe-stack-resources \
                --stack-name "$INFRA_STACK_NAME" \
                --profile IBD-DEV \
                --region us-east-1 \
                --query 'StackResources[?ResourceStatus!=`DELETE_COMPLETE`].{Type:ResourceType,Status:ResourceStatus,Reason:ResourceStatusReason}' \
                --output table 2>/dev/null || echo "   Stack may have been partially deleted"
        fi
    fi
else
    echo "ℹ️  Infrastructure stack does not exist, skipping..."
fi

echo ""
echo "🎉 Cleanup process completed!"
echo ""

# Additional cleanup recommendations
echo "🧹 Additional Cleanup Recommendations:"
echo ""
echo "1. 📦 S3 Buckets (may contain files):"
echo "   aws s3 ls --profile IBD-DEV | grep impact-compendium-frontend-$ENVIRONMENT"
echo "   aws s3 rm s3://bucket-name --recursive --profile IBD-DEV"
echo ""
echo "2. 💾 RDS Snapshots:"
echo "   aws rds describe-db-snapshots --profile IBD-DEV --region us-east-1 | grep impact-compendium-db-$ENVIRONMENT"
echo ""
echo "3. 🔐 Secrets Manager:"
echo "   aws secretsmanager list-secrets --profile IBD-DEV --region us-east-1 | grep impact-compendium/$ENVIRONMENT"
echo ""
echo "4. 📊 CloudWatch Logs:"
echo "   aws logs describe-log-groups --profile IBD-DEV --region us-east-1 | grep impact-compendium"
echo ""
echo "💡 Run these commands manually if you want to delete associated resources"
