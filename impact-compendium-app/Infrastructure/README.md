# Impact Compendium - Infrastructure

## Architecture Overview

![Impact Compendium Infrastructure](./impact-compendium-infrastructure.png)

## Infrastructure Components

### Frontend Distribution
- **CloudFront CDN**: Global content delivery with automatic cache invalidation
- **S3 Bucket**: Static website hosting for React SPA
- **Automatic Deployment**: Frontend updates trigger CloudFront invalidation

### API Layer
- **API Gateway**: REST API endpoint with CORS configuration
- **Binary Media Types**: Configured for Excel file downloads
- **Lambda Integration**: Proxy integration with backend Lambda function

### Backend Services
- **Lambda Function**: FastAPI application with VPC configuration
- **VPC Integration**: Private subnets for secure database access
- **Auto-scaling**: Serverless compute with automatic scaling

### Database Layer
- **RDS MySQL**: Managed database in private subnets
- **Security Groups**: Restricted access from Lambda functions only
- **Secrets Manager**: Secure credential management

### Authentication & Configuration
- **Cognito User Pool**: User authentication and management
- **Secrets Manager**: Database credentials and sensitive configuration
- **Environment Variables**: Automatic configuration sync between stacks

## Deployment Architecture

### Two-Stack Approach
1. **Infrastructure Stack** (`impact-compendium-testing`)
   - VPC, subnets, security groups
   - RDS database
   - Cognito User Pool
   - S3 bucket and CloudFront distribution

2. **Backend Stack** (`impact-compendium-backend-testing`)
   - Lambda function
   - API Gateway
   - Uses CloudFormation exports from infrastructure stack

### Smart Deployment Features
- **Resource Detection**: Prevents duplicate infrastructure creation
- **Configuration Sync**: Automatic frontend configuration updates
- **Cache Management**: CloudFront invalidation on frontend updates
- **Error Recovery**: Enhanced error handling and cleanup procedures

## Quick Start

```bash
# Check current status
./scripts/check-status.sh testing

# Deploy complete application
./scripts/deploy-complete.sh testing

# Update frontend only
./scripts/deploy-frontend.sh testing

# Update frontend configuration
./scripts/update-frontend-config.sh testing
```

## Documentation

- **[Complete Deployment Guide](./DEPLOYMENT_GUIDE.md)**: Comprehensive deployment documentation
- **[Quick Reference](./DEPLOYMENT_QUICK_REFERENCE.md)**: Essential commands and troubleshooting
- **[Backend Strategy](./backend-sam/DEPLOYMENT_STRATEGY.md)**: Backend-specific deployment details

## Key Features

### Automatic Configuration Management
- ✅ **API URL Sync**: Frontend automatically gets current backend URL
- ✅ **Multi-file Update**: Updates all environment files consistently
- ✅ **Cognito Integration**: Automatic User Pool and Client ID sync

### CloudFront Integration
- ✅ **Automatic Invalidation**: Cache cleared on every deployment
- ✅ **Immediate Updates**: Changes visible without cache wait
- ✅ **Error Resilience**: Deployment succeeds even if invalidation fails

### Enhanced Error Handling
- ✅ **Smart Status Checking**: Detailed error analysis and recommendations
- ✅ **Emergency Recovery**: Force delete options for stuck deployments
- ✅ **Production Safety**: Extra confirmations for production environments

## Architecture Benefits

- **Serverless**: No server management, automatic scaling
- **Secure**: VPC isolation, security groups, secrets management
- **Resilient**: Multi-AZ deployment, automatic failover
- **Cost-Effective**: Pay-per-use pricing, automatic resource optimization
- **Maintainable**: Infrastructure as Code, automated deployments
