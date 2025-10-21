#!/bin/bash

# Impact Compendium Infrastructure Deployment Script
# This script builds and deploys the SAM application to AWS

set -e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Default values
ENVIRONMENT="dev"
PROFILE="IBD-DEV"
REGION="us-east-1"

# Function to print colored output
print_status() {
    echo -e "${BLUE}[INFO]${NC} $1"
}

print_success() {
    echo -e "${GREEN}[SUCCESS]${NC} $1"
}

print_warning() {
    echo -e "${YELLOW}[WARNING]${NC} $1"
}

print_error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

# Function to show usage
show_usage() {
    echo "Usage: $0 [OPTIONS]"
    echo ""
    echo "Options:"
    echo "  -e, --environment    Environment to deploy (dev, staging, prod) [default: dev]"
    echo "  -p, --profile        AWS profile to use [default: IBD-DEV]"
    echo "  -r, --region         AWS region [default: us-east-1]"
    echo "  -h, --help          Show this help message"
    echo ""
    echo "Examples:"
    echo "  $0                                    # Deploy to dev environment"
    echo "  $0 -e staging                         # Deploy to staging"
    echo "  $0 -e prod -p production-profile      # Deploy to prod with specific profile"
}

# Parse command line arguments
while [[ $# -gt 0 ]]; do
    case $1 in
        -e|--environment)
            ENVIRONMENT="$2"
            shift 2
            ;;
        -p|--profile)
            PROFILE="$2"
            shift 2
            ;;
        -r|--region)
            REGION="$2"
            shift 2
            ;;
        -h|--help)
            show_usage
            exit 0
            ;;
        *)
            print_error "Unknown option: $1"
            show_usage
            exit 1
            ;;
    esac
done

# Validate environment
if [[ ! "$ENVIRONMENT" =~ ^(dev|staging|prod)$ ]]; then
    print_error "Invalid environment: $ENVIRONMENT. Must be dev, staging, or prod."
    exit 1
fi

print_status "Starting deployment to $ENVIRONMENT environment..."
print_status "Using AWS profile: $PROFILE"
print_status "Using AWS region: $REGION"

# Check if AWS CLI is installed
if ! command -v aws &> /dev/null; then
    print_error "AWS CLI is not installed. Please install it first."
    exit 1
fi

# Check if SAM CLI is installed
if ! command -v sam &> /dev/null; then
    print_error "SAM CLI is not installed. Please install it first."
    exit 1
fi

# Check AWS credentials
print_status "Checking AWS credentials..."
if ! aws sts get-caller-identity --profile "$PROFILE" --region "$REGION" &> /dev/null; then
    print_error "AWS credentials not configured or invalid for profile: $PROFILE"
    exit 1
fi

print_success "AWS credentials validated"

# Validate SAM template
print_status "Validating SAM template..."
if ! sam validate --template template.yaml; then
    print_error "SAM template validation failed"
    exit 1
fi

print_success "SAM template validation passed"

# Build the application
print_status "Building SAM application..."
if ! sam build --parallel; then
    print_error "SAM build failed"
    exit 1
fi

print_success "SAM build completed"

# Deploy the application
print_status "Deploying to $ENVIRONMENT environment..."
if ! sam deploy \
    --config-env "$ENVIRONMENT" \
    --profile "$PROFILE" \
    --region "$REGION" \
    --no-confirm-changeset \
    --no-fail-on-empty-changeset; then
    print_error "SAM deployment failed"
    exit 1
fi

print_success "SAM deployment completed"

# Get stack outputs
print_status "Retrieving stack outputs..."
STACK_NAME="impact-compendium-$ENVIRONMENT"

API_URL=$(aws cloudformation describe-stacks \
    --stack-name "$STACK_NAME" \
    --profile "$PROFILE" \
    --region "$REGION" \
    --query 'Stacks[0].Outputs[?OutputKey==`ApiGatewayUrl`].OutputValue' \
    --output text 2>/dev/null || echo "Not available")

FRONTEND_BUCKET=$(aws cloudformation describe-stacks \
    --stack-name "$STACK_NAME" \
    --profile "$PROFILE" \
    --region "$REGION" \
    --query 'Stacks[0].Outputs[?OutputKey==`FrontendBucketName`].OutputValue' \
    --output text 2>/dev/null || echo "Not available")

CLOUDFRONT_DOMAIN=$(aws cloudformation describe-stacks \
    --stack-name "$STACK_NAME" \
    --profile "$PROFILE" \
    --region "$REGION" \
    --query 'Stacks[0].Outputs[?OutputKey==`CloudFrontDomainName`].OutputValue' \
    --output text 2>/dev/null || echo "Not available")

# Display deployment summary
echo ""
echo "=========================================="
print_success "DEPLOYMENT COMPLETED SUCCESSFULLY!"
echo "=========================================="
echo ""
echo "Environment: $ENVIRONMENT"
echo "Stack Name: $STACK_NAME"
echo "Region: $REGION"
echo ""
echo "Endpoints:"
echo "  API Gateway URL: $API_URL"
echo "  Frontend Bucket: $FRONTEND_BUCKET"
echo "  CloudFront URL: https://$CLOUDFRONT_DOMAIN"
echo ""
echo "Next Steps:"
echo "1. Deploy frontend application to S3 bucket"
echo "2. Configure custom domain (if needed)"
echo "3. Set up monitoring and alerts"
echo "4. Run integration tests"
echo ""

# Test API endpoint
if [[ "$API_URL" != "Not available" ]]; then
    print_status "Testing API endpoint..."
    if curl -f -s "$API_URL/studies" > /dev/null; then
        print_success "API endpoint is responding"
    else
        print_warning "API endpoint test failed (this is expected for placeholder functions)"
    fi
fi

print_success "Deployment script completed!"
