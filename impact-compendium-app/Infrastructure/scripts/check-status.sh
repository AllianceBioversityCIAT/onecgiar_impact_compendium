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
else
    echo "   Status: ❌ NOT DEPLOYED"
fi

echo ""

# Show URLs if both stacks exist
if [ "$INFRA_STATUS" = "CREATE_COMPLETE" ] || [ "$INFRA_STATUS" = "UPDATE_COMPLETE" ]; then
    if [ "$BACKEND_STATUS" = "CREATE_COMPLETE" ] || [ "$BACKEND_STATUS" = "UPDATE_COMPLETE" ]; then
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
if [ "$INFRA_STATUS" != "CREATE_COMPLETE" ] && [ "$INFRA_STATUS" != "UPDATE_COMPLETE" ]; then
    echo "💡 Recommendation: Run ./scripts/deploy-complete.sh $ENVIRONMENT"
elif [ "$BACKEND_STATUS" != "CREATE_COMPLETE" ] && [ "$BACKEND_STATUS" != "UPDATE_COMPLETE" ]; then
    echo "💡 Recommendation: Run ./scripts/deploy-complete.sh $ENVIRONMENT (backend only)"
else
    echo "💡 All components deployed. Use:"
    echo "   - ./scripts/deploy-frontend.sh $ENVIRONMENT (frontend updates)"
    echo "   - ./scripts/deploy-complete.sh $ENVIRONMENT (full update)"
fi
