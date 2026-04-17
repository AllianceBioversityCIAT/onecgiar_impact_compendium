#!/bin/bash

# Backend-Only Deployment Script (SAM build + deploy only — no infra, no frontend)
# Use this when the infra stack is healthy and you only need to ship backend code.
# Usage: ./scripts/deploy-backend.sh [environment]
#
# Why a backend-only path:
#   - deploy-complete.sh assumes infra is in CREATE/UPDATE_COMPLETE. If the infra
#     stack is in UPDATE_ROLLBACK_COMPLETE (a valid terminal state), that script
#     falls through to `create-stack` and fails with AlreadyExistsException
#     before ever touching the backend. This script skips infra entirely.
#   - Uses `sam build --use-container` so the build runs in the official
#     python3.9 image regardless of host Python — no host venv drift.
#   - Pre-cleans `.aws-sam/` because stale builds (e.g. the
#     `ImpactCompendiumFunction 3` directory created by a Finder duplicate at
#     mode 700) silently hang `sam build` right after the
#     "adjusting uri ../../Backend/" log line.
#
# What this script does NOT do:
#   - It does not touch the infra stack (RDS, Cognito, S3, CloudFront).
#   - It does not deploy or invalidate the frontend. Run
#     ./scripts/deploy-frontend.sh after this if the frontend changed.

set -e
set -o pipefail

ENVIRONMENT=${1:-testing}
BACKEND_STACK_NAME="impact-compendium-backend-$ENVIRONMENT"
PROFILE="IBD-DEV"
REGION="us-east-1"

echo "🐍 Backend-Only Deployment"
echo "Environment: $ENVIRONMENT"
echo "Stack:       $BACKEND_STACK_NAME"
echo "Profile:     $PROFILE"
echo "Region:      $REGION"
echo ""

# Resolve script + sam dirs from $0 so it works from any CWD
SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"
SAM_DIR="$SCRIPT_DIR/../backend-sam"
cd "$SAM_DIR"

# Sanity: caller identity
echo "🔐 Verifying AWS caller identity..."
aws sts get-caller-identity --profile "$PROFILE" --query '{Account:Account,Arn:Arn}' --output table

# Sanity: backend stack must already exist (this script doesn't create stacks)
echo ""
echo "🔍 Checking backend stack status..."
BACKEND_STATUS=$(aws cloudformation describe-stacks \
    --stack-name "$BACKEND_STACK_NAME" \
    --profile "$PROFILE" \
    --region "$REGION" \
    --query 'Stacks[0].StackStatus' \
    --output text 2>/dev/null || echo "MISSING")

case "$BACKEND_STATUS" in
    CREATE_COMPLETE|UPDATE_COMPLETE|UPDATE_ROLLBACK_COMPLETE)
        echo "✅ Backend stack present (status: $BACKEND_STATUS) — proceeding with update"
        ;;
    MISSING)
        echo "❌ Backend stack '$BACKEND_STACK_NAME' does not exist."
        echo "   Use deploy-complete.sh to create the initial stack."
        exit 1
        ;;
    *_IN_PROGRESS)
        echo "❌ Backend stack is in transient state '$BACKEND_STATUS' — wait for it to settle."
        exit 1
        ;;
    *)
        echo "❌ Backend stack is in unexpected state '$BACKEND_STATUS' — investigate before deploying."
        exit 1
        ;;
esac

# Pre-clean .aws-sam to avoid the stale-cache hang.
# Note: `mv` is more robust than `rm -rf` here — stale build dirs can be mode 700
# and rm may be silently denied on some hosts (sandboxing or extended attrs);
# `mv` reliably moves the directory aside even when rm refuses.
if [ -d ".aws-sam" ]; then
    echo ""
    echo "🧹 Moving stale .aws-sam aside..."
    STAMP=$(date +%s)
    mv ".aws-sam" ".aws-sam.OLD-$STAMP"
    echo "   Old build moved to .aws-sam.OLD-$STAMP (safe to delete manually)"
fi

# Build inside the official python3.9 container.
echo ""
echo "🔨 sam build --use-container ..."
AWS_PROFILE="$PROFILE" sam build --use-container --profile "$PROFILE"

# Deploy with the per-environment config block (samconfig.toml [testing|production]).
echo ""
echo "🚀 sam deploy --config-env $ENVIRONMENT ..."
AWS_PROFILE="$PROFILE" sam deploy --config-env "$ENVIRONMENT" --profile "$PROFILE"

# Show the deployed API URL
echo ""
echo "📋 Backend Stack Outputs:"
aws cloudformation describe-stacks \
    --stack-name "$BACKEND_STACK_NAME" \
    --profile "$PROFILE" \
    --region "$REGION" \
    --query 'Stacks[0].Outputs[?OutputKey==`ImpactCompendiumApiUrl`].{Key:OutputKey,Value:OutputValue}' \
    --output table

API_URL=$(aws cloudformation describe-stacks \
    --stack-name "$BACKEND_STACK_NAME" \
    --profile "$PROFILE" \
    --region "$REGION" \
    --query 'Stacks[0].Outputs[?OutputKey==`ImpactCompendiumApiUrl`].OutputValue' \
    --output text)

# Smoke test: hit the export endpoint with the binary Accept header.
# Without the explicit Accept, API Gateway treats */* as "no preference" and
# leaks the base64-encoded Lambda body through as text — Excel rejects it.
if [ -n "$API_URL" ]; then
    echo ""
    echo "🧪 Smoke-testing export endpoint (binary Accept header)..."
    TMP_XLSX="/tmp/excel_smoke_${ENVIRONMENT}_$(date +%s).xlsx"
    HTTP_CODE=$(curl -s -o "$TMP_XLSX" -w "%{http_code}" \
        -H "Accept: application/vnd.openxmlformats-officedocument.spreadsheetml.sheet" \
        "${API_URL}api/reports/export?format=excel&limit=10")

    if [ "$HTTP_CODE" = "200" ]; then
        # Real xlsx must start with the ZIP magic bytes 50 4B 03 04 ("PK\x03\x04")
        MAGIC=$(head -c 4 "$TMP_XLSX" | xxd -p)
        if [ "$MAGIC" = "504b0304" ]; then
            echo "   ✅ HTTP 200, magic bytes 504b0304 — real xlsx ($(wc -c < "$TMP_XLSX") bytes)"
        else
            echo "   ⚠️  HTTP 200 but wrong magic bytes: $MAGIC"
            echo "      File saved at $TMP_XLSX for inspection."
            echo "      If body looks like base64 (UEsDBBQA...), API Gateway is not"
            echo "      decoding the binary — check BinaryMediaTypes in template.yaml."
        fi
    else
        echo "   ⚠️  HTTP $HTTP_CODE from export endpoint (auth-required endpoints will return 401/403 unauthenticated — that's fine)"
    fi
fi

echo ""
echo "🎉 Backend deployment complete."
echo "📚 Tail logs with:"
echo "   aws logs tail /aws/lambda/impact-compendium-backend-api-$ENVIRONMENT \\"
echo "       --profile $PROFILE --since 10m --follow"
