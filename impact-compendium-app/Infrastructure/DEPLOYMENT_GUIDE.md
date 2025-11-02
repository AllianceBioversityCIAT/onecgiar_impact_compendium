# Impact Compendium - Complete Deployment Guide

## Overview

This guide covers the complete deployment process for the Impact Compendium application, including infrastructure, backend, and frontend components. The deployment system prevents resource duplication and supports incremental updates.

## Architecture Overview

![Impact Compendium Infrastructure](./impact-compendium-infrastructure.png)

The architecture consists of:
- **Frontend**: React SPA served via CloudFront CDN with S3 storage
- **API Layer**: API Gateway routing requests to Lambda functions
- **Backend**: FastAPI application running on AWS Lambda
- **Database**: MySQL RDS instance in private subnets
- **Authentication**: Cognito User Pool for user management
- **Configuration**: Secrets Manager for secure credential storage
- **Automation**: CloudFormation stacks for infrastructure and backend deployment

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

**Enhanced Status Output:**
```
📊 Infrastructure Status Check
Environment: testing

📦 Infrastructure Stack: impact-compendium-testing
   Status: ✅ CREATE_COMPLETE

🔧 Backend Stack: impact-compendium-backend-testing
   Status: ✅ UPDATE_COMPLETE

🌐 Application URLs:
   🔗 API: https://api-url.amazonaws.com/testing/
   🌐 Frontend: https://cloudfront-url.net

💡 All components deployed. Use:
   - ./scripts/deploy-frontend.sh testing (frontend updates)
   - ./scripts/deploy-complete.sh testing (full update)
```

**For Failed States:**
```
📦 Infrastructure Stack: impact-compendium-testing
   Status: ⚠️ CREATE_FAILED
   ⚠️ Stack is in failed state - checking last events...
   
🚨 Emergency Options:
   - ./scripts/delete-complete.sh testing (clean slate)
   - ./scripts/force-delete.sh testing all (if stuck)
```

### 2. Complete Deployment (First Time or Full Update)
```bash
# Deploy everything (infrastructure + backend + frontend)
./scripts/deploy-complete.sh testing
```

**Enhanced Process:**
1. **Infrastructure Check**: Detects existing infrastructure, skips if exists
2. **Backend Deployment**: Builds and deploys SAM application
3. **Frontend Configuration**: Automatically updates all environment files with current API URL
4. **Frontend Build**: Rebuilds frontend with updated configuration
5. **Frontend Upload**: Syncs to S3 with cleanup (`--delete` flag)
6. **CloudFront Invalidation**: Creates cache invalidation for immediate updates
7. **Status Report**: Shows all URLs and endpoints

**Automatic Configuration Sync:**
- Updates `.env`, `.env.production`, and `.env.local` files
- Syncs API URL from deployed backend stack
- Syncs Cognito configuration from infrastructure stack
- Prevents configuration drift between frontend and backend

### 3. Frontend-Only Updates
```bash
# Quick frontend updates (after code changes)
./scripts/deploy-frontend.sh testing
```

**Enhanced Features:**
- ✅ **Auto-build detection**: Builds frontend if `dist/` missing
- ✅ **Clean S3 sync**: Uses `--delete` flag to remove old files
- ✅ **CloudFront invalidation**: Automatically invalidates cache for immediate updates
- ✅ **Error handling**: Graceful fallback if invalidation fails

**Process:**
1. Detects if frontend needs building
2. Syncs files to S3 (removes old files)
3. Gets CloudFront distribution ID from stack
4. Creates invalidation for all paths (`/*`)
5. Reports invalidation ID and status

### 4. Frontend Configuration Management
```bash
# Update frontend configuration with current backend URLs
./scripts/update-frontend-config.sh testing
```

**Automatic Configuration Sync:**
- ✅ **API URL Detection**: Gets current API URL from backend CloudFormation stack
- ✅ **Cognito Configuration**: Gets User Pool and Client IDs from infrastructure stack
- ✅ **Multi-file Update**: Updates `.env`, `.env.production`, and `.env.local`
- ✅ **Prevents Drift**: Ensures frontend always matches deployed backend

**When API URLs Change:**
```bash
# Manual process (if needed)
./scripts/update-frontend-config.sh testing
cd ../Frontend && npm run build
cd ../Infrastructure && ./scripts/deploy-frontend.sh testing

# Or use complete deployment (automatic)
./scripts/deploy-complete.sh testing
```

### 5. Backend-Only Updates
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
- **S3 Sync**: Automatic upload to infrastructure S3 bucket with `--delete` flag
- **CloudFront**: CDN distribution with automatic cache invalidation
- **Configuration Sync**: Automatic API URL and Cognito configuration updates

**CloudFront Invalidation:**
- ✅ **Automatic**: Created on every frontend deployment
- ✅ **Complete**: Invalidates all paths (`/*`)
- ✅ **Immediate**: Changes visible without waiting for cache expiry
- ✅ **Tracked**: Returns invalidation ID for monitoring

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

### Enhanced Error Diagnosis

#### 1. Deployment Status Check
```bash
# Get detailed status and error analysis
./scripts/check-status.sh testing
```

#### 2. Common Issues & Solutions

##### Infrastructure Deployment Failures
```bash
# Problem: CREATE_FAILED or ROLLBACK_COMPLETE
# Solution: Clean slate deployment
./scripts/delete-complete.sh testing
./scripts/deploy-complete.sh testing

# If deletion fails:
./scripts/force-delete.sh testing infrastructure
```

##### Backend Deployment Issues
```bash
# Problem: Lambda deployment fails
# Check: VPC configuration, security groups, imports

# Solution: Redeploy backend only
./scripts/force-delete.sh testing backend
./scripts/deploy-complete.sh testing
```

##### Stuck Deployments
```bash
# Problem: Stack stuck in *_IN_PROGRESS state
# Solution: Force delete with operation cancellation
./scripts/force-delete.sh testing all

# Manual verification
aws cloudformation describe-stacks --stack-name impact-compendium-testing --profile IBD-DEV
```

##### Resource Import Errors
```bash
# Problem: Backend can't import infrastructure exports
# Check: Infrastructure stack exists and exports are available
aws cloudformation list-exports --profile IBD-DEV --region us-east-1 | grep impact-compendium-testing

# Solution: Redeploy infrastructure first
./scripts/delete-complete.sh testing
./scripts/deploy-complete.sh testing
```

#### 3. Emergency Recovery Procedures

##### Complete Environment Reset
```bash
# Nuclear option: Start completely fresh
./scripts/force-delete.sh testing all
# Wait 5 minutes for AWS resource cleanup
./scripts/deploy-complete.sh testing
```

##### Selective Recovery
```bash
# Keep infrastructure, rebuild backend
./scripts/force-delete.sh testing backend
./scripts/deploy-complete.sh testing

# Keep backend, rebuild infrastructure  
./scripts/force-delete.sh testing infrastructure
./scripts/deploy-complete.sh testing
```

### Debug Commands

#### Stack Analysis
```bash
# Check stack events for failures
aws cloudformation describe-stack-events \
    --stack-name impact-compendium-testing \
    --profile IBD-DEV \
    --region us-east-1 \
    --query 'StackEvents[?ResourceStatus==`CREATE_FAILED`]'

# Check stack resources
aws cloudformation describe-stack-resources \
    --stack-name impact-compendium-testing \
    --profile IBD-DEV \
    --region us-east-1
```

#### Lambda Function Debugging
```bash
# Check Lambda logs
sam logs --name ImpactCompendiumFunction --profile IBD-DEV --tail

# Test Lambda function
aws lambda invoke \
    --function-name impact-compendium-backend-api-testing \
    --payload '{}' \
    response.json \
    --profile IBD-DEV
```

#### Network Connectivity
```bash
# Verify VPC configuration
aws lambda get-function-configuration \
    --function-name impact-compendium-backend-api-testing \
    --profile IBD-DEV \
    --query 'VpcConfig'

# Check security group rules
aws ec2 describe-security-groups \
    --group-ids sg-xxx \
    --profile IBD-DEV
```

## Error Handling & Cleanup

### Enhanced Cleanup System

#### 1. Smart Cleanup (Recommended)
```bash
# Safe cleanup with validation
./scripts/delete-complete.sh testing
```

**Features:**
- ✅ **Pre-deletion validation**: Checks stack states before deletion
- ✅ **Production protection**: Extra confirmation for production environments
- ✅ **Error reporting**: Shows failed resources and reasons
- ✅ **Manual guidance**: Provides cleanup commands for persistent resources

#### 2. Emergency Force Delete
```bash
# For stuck or failed deployments
./scripts/force-delete.sh testing all          # Delete everything
./scripts/force-delete.sh testing backend     # Backend only
./scripts/force-delete.sh testing infrastructure  # Infrastructure only
```

**When to Use:**
- Stacks stuck in `*_IN_PROGRESS` states
- Failed deployments that won't delete normally
- Rollback states that need manual intervention

#### 3. Enhanced Status Monitoring
```bash
# Detailed status with error analysis
./scripts/check-status.sh testing
```

**Provides:**
- Stack status and health checks
- Failed resource identification
- Error reason analysis
- Context-aware recommendations
- Emergency cleanup suggestions

### Common Error Scenarios

#### Deployment Failures
```bash
# 1. Check what failed
./scripts/check-status.sh testing

# 2. Clean slate approach
./scripts/delete-complete.sh testing
./scripts/deploy-complete.sh testing

# 3. Emergency option (if stuck)
./scripts/force-delete.sh testing all
```

#### Partial Deployment Issues
```bash
# Backend deployment failed
./scripts/force-delete.sh testing backend
./scripts/deploy-complete.sh testing

# Infrastructure issues
./scripts/force-delete.sh testing infrastructure
./scripts/deploy-complete.sh testing
```

#### Stack Stuck in Progress
```bash
# Force delete with operation cancellation
./scripts/force-delete.sh testing all

# Manual resource cleanup (if needed)
aws s3 rm s3://bucket-name --recursive --profile IBD-DEV
aws lambda delete-function --function-name function-name --profile IBD-DEV
```

### Production Environment Safety

#### Extra Protection Measures
- **Double confirmation**: Requires typing "DELETE PRODUCTION"
- **State validation**: Prevents deletion of unstable stacks
- **Resource preservation**: Guidance for critical resource cleanup

```bash
# Production deletion requires extra confirmation
./scripts/delete-complete.sh production
# Prompts: Type 'DELETE PRODUCTION' to confirm
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
├── scripts/
│   ├── deploy-complete.sh                  # 🚀 Main deployment (auto-config sync)
│   ├── check-status.sh                     # 📊 Enhanced status checker
│   ├── deploy-frontend.sh                  # 🌐 Frontend updater (with invalidation)
│   ├── update-frontend-config.sh           # 🔧 Frontend config automation
│   ├── delete-complete.sh                  # 🗑️ Smart cleanup
│   └── force-delete.sh                     # 🚨 Emergency cleanup
└── DEPLOYMENT_GUIDE.md                     # 📖 This documentation
```

This deployment system ensures no resource duplication while providing flexible deployment options for different development workflows.
