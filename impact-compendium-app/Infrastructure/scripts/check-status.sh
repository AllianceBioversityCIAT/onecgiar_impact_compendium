#!/bin/bash

# Infrastructure Status Check Script
# Usage: ./scripts/check-status.sh [environment]

ENVIRONMENT=${1:-testing}
INFRA_STACK_NAME="impact-compendium-$ENVIRONMENT"
BACKEND_STACK_NAME="impact-compendium-backend-$ENVIRONMENT"

echo "📊 Infrastructure Status Check"
echo "Environment: $ENVIRONMENT"
echo "Profile: IBD-DEV"
echo "Region: us-east-1"
echo ""

# Check Infrastructure Stack
echo "📦 Infrastructure Stack: $INFRA_STACK_NAME"
INFRA_STATUS=$(aws cloudformation describe-stacks \
    --stack-name "$INFRA_STACK_NAME" \
    --profile IBD-DEV \
    --region us-east-1 \
    --query 'Stacks[0].StackStatus' \
    --output text 2>/dev/null)

if [ $? -eq 0 ]; then
    echo "   Status: ✅ $INFRA_STATUS"
    
    # Show additional info for failed states
    if [[ "$INFRA_STATUS" == *"FAILED"* ]] || [[ "$INFRA_STATUS" == *"ROLLBACK"* ]]; then
        echo "   ⚠️  Stack is in failed state - checking last events..."
        aws cloudformation describe-stack-events \
            --stack-name "$INFRA_STACK_NAME" \
            --profile IBD-DEV \
            --region us-east-1 \
            --query 'StackEvents[?ResourceStatus==`CREATE_FAILED` || ResourceStatus==`UPDATE_FAILED`] | [0:3].{Resource:LogicalResourceId,Reason:ResourceStatusReason}' \
            --output table 2>/dev/null
    fi
else
    echo "   Status: ❌ NOT DEPLOYED"
fi

echo ""

# Check Backend Stack
echo "🔧 Backend Stack: $BACKEND_STACK_NAME"
BACKEND_STATUS=$(aws cloudformation describe-stacks \
    --stack-name "$BACKEND_STACK_NAME" \
    --profile IBD-DEV \
    --region us-east-1 \
    --query 'Stacks[0].StackStatus' \
    --output text 2>/dev/null)

if [ $? -eq 0 ]; then
    echo "   Status: ✅ $BACKEND_STATUS"
    
    # Show additional info for failed states
    if [[ "$BACKEND_STATUS" == *"FAILED"* ]] || [[ "$BACKEND_STATUS" == *"ROLLBACK"* ]]; then
        echo "   ⚠️  Stack is in failed state - checking last events..."
        aws cloudformation describe-stack-events \
            --stack-name "$BACKEND_STACK_NAME" \
            --profile IBD-DEV \
            --region us-east-1 \
            --query 'StackEvents[?ResourceStatus==`CREATE_FAILED` || ResourceStatus==`UPDATE_FAILED`] | [0:3].{Resource:LogicalResourceId,Reason:ResourceStatusReason}' \
            --output table 2>/dev/null
    fi
else
    echo "   Status: ❌ NOT DEPLOYED"
fi

echo ""

# Show URLs if both stacks exist
# UPDATE_ROLLBACK_COMPLETE is a terminal "exists" state (stack reverted to prior
# good version after a failed update), so include it here.
if [ "$INFRA_STATUS" = "CREATE_COMPLETE" ] || [ "$INFRA_STATUS" = "UPDATE_COMPLETE" ] || [ "$INFRA_STATUS" = "UPDATE_ROLLBACK_COMPLETE" ]; then
    if [ "$BACKEND_STATUS" = "CREATE_COMPLETE" ] || [ "$BACKEND_STATUS" = "UPDATE_COMPLETE" ] || [ "$BACKEND_STATUS" = "UPDATE_ROLLBACK_COMPLETE" ]; then
        echo "🌐 Application URLs:"
        
        API_URL=$(aws cloudformation describe-stacks \
            --stack-name "$BACKEND_STACK_NAME" \
            --profile IBD-DEV \
            --region us-east-1 \
            --query 'Stacks[0].Outputs[?OutputKey==`ImpactCompendiumApiUrl`].OutputValue' \
            --output text 2>/dev/null)
        
        FRONTEND_URL=$(aws cloudformation describe-stacks \
            --stack-name "$INFRA_STACK_NAME" \
            --profile IBD-DEV \
            --region us-east-1 \
            --query 'Stacks[0].Outputs[?OutputKey==`CloudFrontUrl`].OutputValue' \
            --output text 2>/dev/null)
        
        echo "   🔗 API: $API_URL"
        echo "   🌐 Frontend: $FRONTEND_URL"
    fi
fi

echo ""

# Deployment recommendation
if [ "$INFRA_STATUS" != "CREATE_COMPLETE" ] && [ "$INFRA_STATUS" != "UPDATE_COMPLETE" ] && [ "$INFRA_STATUS" != "UPDATE_ROLLBACK_COMPLETE" ]; then
    echo "💡 Recommendation: Run ./scripts/deploy-complete.sh $ENVIRONMENT"
elif [ "$BACKEND_STATUS" != "CREATE_COMPLETE" ] && [ "$BACKEND_STATUS" != "UPDATE_COMPLETE" ] && [ "$BACKEND_STATUS" != "UPDATE_ROLLBACK_COMPLETE" ]; then
    echo "💡 Recommendation: Run ./scripts/deploy-complete.sh $ENVIRONMENT (backend only)"
else
    echo "💡 All components deployed. Use:"
    echo "   - ./scripts/deploy-backend.sh  $ENVIRONMENT (backend code only — preferred)"
    echo "   - ./scripts/deploy-frontend.sh $ENVIRONMENT (frontend updates)"
    echo "   - ./scripts/deploy-complete.sh $ENVIRONMENT (full update — touches infra check)"
fi

# Emergency options for failed states
if [[ "$INFRA_STATUS" == *"FAILED"* ]] || [[ "$BACKEND_STATUS" == *"FAILED"* ]] || [[ "$INFRA_STATUS" == *"ROLLBACK"* ]] || [[ "$BACKEND_STATUS" == *"ROLLBACK"* ]]; then
    echo ""
    echo "🚨 Emergency Options:"
    echo "   - ./scripts/delete-complete.sh $ENVIRONMENT (clean slate)"
    echo "   - ./scripts/force-delete.sh $ENVIRONMENT all (if stuck)"
    echo "   - ./scripts/force-delete.sh $ENVIRONMENT backend (backend only)"
    echo "   - ./scripts/force-delete.sh $ENVIRONMENT infrastructure (infrastructure only)"
fi
