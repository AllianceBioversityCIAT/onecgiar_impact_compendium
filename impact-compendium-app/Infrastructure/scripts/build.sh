#!/bin/bash

# IGAD SAM Build Script
# Usage: ./scripts/build.sh

set -e

echo "🏗️  Building IGAD SAM Application..."
echo "Profile: IBD-DEV"
echo "Region: us-east-1"

# Navigate to Infrastructure directory
cd "$(dirname "$0")/.."

# Build SAM application
echo "Building SAM application..."
sam build --profile IBD-DEV

# Validate templates
echo "Validating SAM templates..."
sam validate --template template-testing.yaml --lint --profile IBD-DEV
sam validate --template template-production.yaml --lint --profile IBD-DEV

echo "✅ Build completed successfully!"
echo ""
echo "Next steps:"
echo "  Deploy to testing:    ./scripts/deploy.sh testing"
echo "  Deploy to production: ./scripts/deploy.sh production"
