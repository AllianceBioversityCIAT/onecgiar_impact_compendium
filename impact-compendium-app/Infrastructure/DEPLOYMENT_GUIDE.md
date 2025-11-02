# Impact Compendium - Complete Deployment Guide

## Overview

This guide covers the complete deployment process for the Impact Compendium application, including infrastructure, backend, and frontend components. The deployment system prevents resource duplication and supports incremental updates.

## Architecture

### Deployment Components
```
Infrastructure/
├── cloudformation-infrastructure-only.yaml  # VPC, RDS, Cognito, S3, CloudFront
├── backend-sam/                            # Lambda + API Gateway (SAM)
│   └── template.yaml
└── scripts/                                # Deployment automation
    ├── deploy-complete.sh                  # Full deployment
    ├── deploy-frontend.sh                  # Frontend only
    ├── check-status.sh                     # Status check
    └── delete-complete.sh                  # Complete cleanup
```

### Resource Separation
- **Infrastructure Stack**: `impact-compendium-infra-{environment}`
- **Backend Stack**: `impact-compendium-backend-{environment}`
- **No Duplication**: Smart deployment checks prevent duplicate resources

## Prerequisites

### Required Tools
```bash
# AWS CLI
aws --version

# SAM CLI
sam --version

# Node.js (for frontend)
node --version
npm --version
```

### AWS Configuration
```bash
# Configure IBD-DEV profile (REQUIRED)
aws configure --profile IBD-DEV
# Region: us-east-1
# Access Key: [Your Access Key]
# Secret Key: [Your Secret Key]

# Verify configuration
aws sts get-caller-identity --profile IBD-DEV
```

## Deployment Process

### 1. Check Current Status
```bash
cd impact-compendium-app/Infrastructure
./scripts/check-status.sh testing
```

**Output Example:**
```
📊 Infrastructure Status Check
Environment: testing

📦 Infrastructure Stack: impact-compendium-infra-testing
   Status: ✅ CREATE_COMPLETE

🔧 Backend Stack: impact-compendium-backend-testing
   Status: ❌ NOT DEPLOYED

💡 Recommendation: Run ./scripts/deploy-complete.sh testing (backend only)
```

### 2. Complete Deployment (First Time)
```bash
# Deploy everything (infrastructure + backend + frontend)
./scripts/deploy-complete.sh testing
```

**Process:**
1. **Infrastructure Check**: Detects existing infrastructure, skips if exists
2. **Backend Deployment**: Builds and deploys SAM application
3. **Frontend Upload**: Syncs built frontend to S3
4. **Status Report**: Shows all URLs and endpoints

### 3. Frontend-Only Updates
```bash
# Quick frontend updates (after code changes)
./scripts/deploy-frontend.sh testing
```

**Features:**
- Auto-builds if `dist/` missing
- Syncs to S3 with cleanup
- Shows CloudFront URL

### 4. Backend-Only Updates
```bash
cd backend-sam
sam build --profile IBD-DEV
sam deploy --config-env testing --profile IBD-DEV
```

## Smart Deployment Features

### Infrastructure Duplication Prevention
```bash
# The system checks stack status before creating:
INFRA_EXISTS=$(aws cloudformation describe-stacks \
    --stack-name "impact-compendium-infra-testing" \
    --profile IBD-DEV \
    --query 'Stacks[0].StackStatus' 2>/dev/null)

if [ "$INFRA_EXISTS" = "CREATE_COMPLETE" ]; then
    echo "✅ Infrastructure exists, skipping creation"
else
    echo "🚀 Creating new infrastructure"
fi
```

### Backend Update vs Create
- **Existing Backend**: Updates deployment (faster)
- **New Backend**: Creates fresh deployment
- **Dependencies**: Uses CloudFormation exports from infrastructure

## Environment Configuration

### Infrastructure Resources
```yaml
# Created by cloudformation-infrastructure-only.yaml
Resources:
  - VPC with public/private subnets
  - RDS MySQL database (db.t3.micro)
  - Cognito User Pool + Client
  - S3 bucket for frontend
  - CloudFront distribution
  - Security groups and networking
```

### Backend Configuration
```yaml
# SAM template uses infrastructure exports
Environment Variables:
  DB_HOST: !ImportValue impact-compendium-testing-db-endpoint
  COGNITO_USER_POOL_ID: !ImportValue impact-compendium-testing-cognito-pool-id
  COGNITO_CLIENT_ID: !ImportValue impact-compendium-testing-cognito-client-id
```

### Frontend Configuration
- **Build Output**: `Frontend/dist/`
- **S3 Sync**: Automatic upload to infrastructure S3 bucket
- **CloudFront**: CDN distribution for global access

## Deployment Outputs

### Successful Deployment
```
🎉 Complete deployment finished successfully!

📍 Key URLs:
🔗 API Endpoint: https://abc123.execute-api.us-east-1.amazonaws.com/testing/
📚 API Documentation: https://abc123.execute-api.us-east-1.amazonaws.com/testing/docs
🌐 Frontend URL: https://d1234567890.cloudfront.net
```

### Stack Exports Available
```yaml
# Infrastructure exports (for backend consumption)
- impact-compendium-testing-vpc-id
- impact-compendium-testing-lambda-sg-id
- impact-compendium-testing-private-subnet-1
- impact-compendium-testing-private-subnet-2
- impact-compendium-testing-db-endpoint
- impact-compendium-testing-cognito-pool-id
- impact-compendium-testing-cognito-client-id
- impact-compendium-testing-s3-bucket
- impact-compendium-testing-cloudfront-url

# Backend exports (for frontend consumption)
- impact-compendium-backend-testing-api-url
- impact-compendium-backend-testing-function-arn
- impact-compendium-backend-testing-docs-url
```

## Cost Management

### Resource Limits (Per Environment)
```yaml
Testing Environment: $35/month
- RDS: db.t3.micro (20GB storage)
- Lambda: 512MB memory, 300s timeout
- S3: Standard storage
- CloudFront: PriceClass_100

Production Environment: $70/month
- RDS: db.t3.small (50GB storage)
- Lambda: 1024MB memory, 60s timeout
- S3: Standard-IA after 30 days
- CloudFront: PriceClass_All
```

### Cost Optimization
- **Auto-stop RDS**: Development instances stop after 2 hours
- **S3 Lifecycle**: Move to IA storage after 30 days
- **Lambda Concurrency**: Limited to prevent runaway costs
- **CloudFront**: Regional edge locations only for testing

## Troubleshooting

### Common Issues

#### 1. Infrastructure Already Exists Error
```bash
# Check what exists
./scripts/check-status.sh testing

# If stuck in failed state, delete and retry
./scripts/delete-complete.sh testing
./scripts/deploy-complete.sh testing
```

#### 2. Backend Import Errors
```bash
# Verify infrastructure exports exist
aws cloudformation list-exports --profile IBD-DEV --region us-east-1 | grep impact-compendium-testing

# If missing, redeploy infrastructure
aws cloudformation delete-stack --stack-name impact-compendium-infra-testing --profile IBD-DEV
./scripts/deploy-complete.sh testing
```

#### 3. Frontend Build Missing
```bash
# Build frontend manually
cd Frontend/
npm install
npm run build

# Then deploy
cd ../Infrastructure/
./scripts/deploy-frontend.sh testing
```

#### 4. SAM Build Failures
```bash
# Check Python dependencies
cd Backend/
pip install -r requirements.txt

# Verify SAM template
cd ../Infrastructure/backend-sam/
sam validate --profile IBD-DEV
```

### Debug Commands
```bash
# Check stack status
aws cloudformation describe-stacks --stack-name impact-compendium-infra-testing --profile IBD-DEV

# View Lambda logs
sam logs --name ImpactCompendiumFunction --profile IBD-DEV --tail

# Test API endpoint
curl https://your-api-id.execute-api.us-east-1.amazonaws.com/testing/health

# Check S3 bucket contents
aws s3 ls s3://impact-compendium-frontend-testing-123456789 --profile IBD-DEV
```

## Cleanup

### Complete Environment Cleanup
```bash
# Delete all resources for environment
./scripts/delete-complete.sh testing
```

**Process:**
1. Deletes backend stack first (Lambda, API Gateway)
2. Deletes infrastructure stack (VPC, RDS, S3, etc.)
3. Waits for complete deletion
4. Reports cleanup status

### Partial Cleanup
```bash
# Delete only backend (keep infrastructure)
aws cloudformation delete-stack --stack-name impact-compendium-backend-testing --profile IBD-DEV

# Delete only frontend files (keep S3 bucket)
aws s3 rm s3://your-bucket-name --recursive --profile IBD-DEV
```

## Production Deployment

### Production Differences
```bash
# Deploy to production environment
./scripts/deploy-complete.sh production

# Uses different template: cloudformation-production-environment.yaml
# Higher resource limits and enhanced security
```

### Production Checklist
- [ ] Database backups enabled
- [ ] Multi-AZ RDS deployment
- [ ] Enhanced monitoring
- [ ] WAF protection
- [ ] Custom domain configuration
- [ ] SSL certificates
- [ ] Automated scaling policies

## Quick Reference

### Most Common Commands
```bash
# Check what's deployed
./scripts/check-status.sh testing

# Deploy everything (safe to run multiple times)
./scripts/deploy-complete.sh testing

# Update frontend only
./scripts/deploy-frontend.sh testing

# Clean up everything
./scripts/delete-complete.sh testing
```

### File Locations
```
Infrastructure/
├── cloudformation-infrastructure-only.yaml  # Infrastructure template
├── backend-sam/template.yaml               # Backend SAM template
├── scripts/deploy-complete.sh              # Main deployment
├── scripts/check-status.sh                 # Status checker
└── scripts/deploy-frontend.sh              # Frontend updater
```

This deployment system ensures no resource duplication while providing flexible deployment options for different development workflows.
