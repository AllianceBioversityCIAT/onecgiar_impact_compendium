#!/bin/bash

# CloudFormation Delete Script
# Usage: ./scripts/delete-cf.sh [stack-name]

STACK_NAME=${1:-impact-compendium-testing}

echo "🗑️  Deleting CloudFormation stack: $STACK_NAME"
echo "Profile: IBD-DEV"
echo "Region: us-east-1"

# Confirm deletion
read -p "Are you sure you want to delete stack '$STACK_NAME'? (y/N): " -n 1 -r
echo
if [[ ! $REPLY =~ ^[Yy]$ ]]; then
    echo "Deletion cancelled."
    exit 0
fi

# Delete stack
echo "Deleting stack..."
aws cloudformation delete-stack \
    --stack-name "$STACK_NAME" \
    --profile IBD-DEV \
    --region us-east-1

echo "Waiting for deletion to complete..."
aws cloudformation wait stack-delete-complete \
    --stack-name "$STACK_NAME" \
    --profile IBD-DEV \
    --region us-east-1

echo "✅ Stack '$STACK_NAME' deleted successfully!"
