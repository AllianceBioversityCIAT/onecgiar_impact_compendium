# IGAD SAM Infrastructure

**Version:** 1.0  
**Profile:** IBD-DEV  
**Region:** us-east-1  
**Deployment:** SAM CLI + CloudFormation

## Overview

This infrastructure uses AWS SAM (Serverless Application Model) to deploy the IGAD Impact Compendium across two environments: **testing** and **production**. The architecture is designed for simplicity, cost-effectiveness, and easy management.

## Architecture Components

### Testing Environment (`igad-testing`)
- **Frontend**: S3 + CloudFront (default SSL)
- **Backend**: Lambda + HTTP API Gateway
- **Database**: New RDS MySQL (db.t3.micro)
- **Auth**: Cognito User Pool
- **Budget**: $25/month

### Production Environment (`igad-production`)
- **Frontend**: S3 + CloudFront (ACM SSL + WAF)
- **Backend**: Lambda + HTTP API Gateway
- **Database**: Existing RDS MySQL (external)
- **Auth**: Cognito User Pool
- **Budget**: $70/month

## Prerequisites

### Required Tools
```bash
# Install AWS SAM CLI
pip install aws-sam-cli

# Install AWS CLI
pip install awscli

# Verify installations
sam --version
aws --version
```

### AWS Configuration
```bash
# Configure AWS profile
aws configure --profile IBD-DEV
# AWS Access Key ID: [your-access-key]
# AWS Secret Access Key: [your-secret-key]
# Default region name: us-east-1
# Default output format: json
```

## Quick Start

### 1. Build Application
```bash
./scripts/build.sh
```

### 2. Deploy to Testing
```bash
./scripts/deploy.sh testing
```

### 3. Deploy to Production
```bash
./scripts/deploy.sh production
```

### 4. Delete Environment
```bash
./scripts/delete.sh testing
./scripts/delete.sh production
```

## Detailed Deployment Instructions

### Step 1: Prepare Backend Code
Ensure your FastAPI backend is ready in `../Backend/` with:
- `main.py` with `handler` function
- `requirements.txt` with dependencies
- Proper Lambda handler implementation

### Step 2: Build SAM Application
```bash
cd impact-compendium-app/Infrastructure
sam build --profile IBD-DEV
```

### Step 3: Deploy Testing Environment
```bash
sam deploy --config-env testing --profile IBD-DEV
```

This creates:
- Stack: `igad-testing`
- New RDS MySQL instance
- All serverless components
- Cost tags applied

### Step 4: Configure Production Database
Update the production database URL:
```bash
aws ssm put-parameter \
  --name "/igad/production/database-url" \
  --value "mysql://username:password@your-rds-endpoint:3306/igad_compendium" \
  --overwrite \
  --profile IBD-DEV
```

### Step 5: Deploy Production Environment
```bash
sam deploy --config-env production --profile IBD-DEV \
  --parameter-overrides \
    ExistingRDSEndpoint=your-rds-endpoint.amazonaws.com \
    CustomDomainName=your-domain.com \
    ACMCertificateArn=arn:aws:acm:us-east-1:account:certificate/cert-id
```

## Configuration Files

### samconfig.toml
Contains environment-specific configurations:
- Stack names and parameters
- AWS profile and region settings
- Deployment options and tags

### Template Files
- `template-testing.yaml`: Testing environment resources
- `template-production.yaml`: Production environment resources

## Tagging Policy

### Mandatory Tags (All Resources)
```yaml
Project: igad
Environment: testing|production
CreatedBy: sam-deployment
```

### Cost Tracking Tags
```yaml
CostCenter: research-platform
Owner: cgiar-alliance
Component: frontend|backend|database|auth
```

### Tag Validation
All resources automatically receive proper tags through:
- Global SAM configuration
- Individual resource tags
- Stack-level tag propagation

## Environment Differences

| Feature | Testing | Production |
|---------|---------|------------|
| **Database** | New RDS (db.t3.micro) | Existing RDS |
| **SSL** | CloudFront default | ACM certificate |
| **WAF** | None | Enabled |
| **Lambda Memory** | 256MB | 512MB |
| **Lambda Timeout** | 30s | 60s |
| **Log Retention** | 14 days | 30 days |
| **S3 Versioning** | Disabled | Enabled |
| **Budget** | $25/month | $70/month |

## Cost Optimization Features

### Resource Sizing
- **Lambda**: Minimal memory allocation
- **RDS**: db.t3.micro for testing
- **CloudFront**: PriceClass_100 (US/Europe)
- **API Gateway**: HTTP API (60% cheaper than REST)

### Cost Monitoring
- Comprehensive resource tagging
- CloudWatch cost alerts
- Monthly budget notifications
- Resource usage tracking

## Security Implementation

### Authentication
- Cognito User Pools per environment
- JWT token validation in Lambda
- Least-privilege IAM roles

### Network Security
- VPC for RDS (testing)
- Security groups with minimal access
- WAF protection (production)
- HTTPS enforcement

### Data Protection
- Secrets in AWS Secrets Manager
- SSM Parameter Store for configuration
- RDS encryption (production)
- S3 bucket encryption

## Monitoring and Logging

### CloudWatch Integration
```bash
# View Lambda logs
sam logs --stack-name igad-testing --profile IBD-DEV

# View API Gateway logs
aws logs describe-log-groups \
  --log-group-name-prefix "/aws/apigateway/igad" \
  --profile IBD-DEV
```

### Log Retention
- Testing: 14 days
- Production: 30 days
- Automatic cleanup

## Troubleshooting

### Common Issues

#### 1. Build Failures
```bash
# Check SAM template syntax
sam validate --template template-testing.yaml --lint --profile IBD-DEV

# Verify backend code structure
ls -la ../Backend/
```

#### 2. Deployment Errors
```bash
# Check CloudFormation events
aws cloudformation describe-stack-events \
  --stack-name igad-testing \
  --profile IBD-DEV
```

#### 3. Database Connection Issues
```bash
# Verify database URL parameter
aws ssm get-parameter \
  --name "/igad/testing/database-url" \
  --profile IBD-DEV
```

#### 4. Lambda Function Errors
```bash
# View function logs
sam logs --stack-name igad-testing --name IgadBackendFunction --profile IBD-DEV
```

### Debug Commands
```bash
# Test API locally
sam local start-api --profile IBD-DEV

# Invoke function locally
sam local invoke IgadBackendFunction --profile IBD-DEV

# Validate all templates
find . -name "*.yaml" -exec sam validate --template {} --lint --profile IBD-DEV \;
```

## Stack Outputs

After deployment, retrieve important URLs and IDs:
```bash
aws cloudformation describe-stacks \
  --stack-name igad-testing \
  --profile IBD-DEV \
  --query 'Stacks[0].Outputs[*].[OutputKey,OutputValue]' \
  --output table
```

### Key Outputs
- **ApiEndpoint**: Backend API URL
- **CloudFrontUrl**: Frontend URL
- **S3BucketName**: Frontend bucket name
- **CognitoUserPoolId**: Authentication pool ID
- **CognitoClientId**: Authentication client ID

## Frontend Deployment

### Build and Upload Frontend
```bash
# Build React application
cd ../Frontend
npm run build

# Upload to S3
aws s3 sync build/ s3://BUCKET_NAME --profile IBD-DEV

# Invalidate CloudFront cache
aws cloudfront create-invalidation \
  --distribution-id DISTRIBUTION_ID \
  --paths "/*" \
  --profile IBD-DEV
```

## Maintenance

### Regular Tasks
- Monthly cost review
- Security group audit
- Log retention cleanup
- Dependency updates

### Scaling Considerations
- Lambda concurrent executions
- RDS connection limits
- API Gateway throttling
- CloudFront cache behavior

## Disaster Recovery

### Backup Strategy
- RDS automated backups
- S3 versioning (production)
- Infrastructure as Code
- Parameter Store backups

### Recovery Procedures
1. **Database**: Restore from RDS backup
2. **Application**: Redeploy SAM stack
3. **Frontend**: Restore from S3 versions
4. **Full Environment**: Deploy from templates

## References

- [Architecture Proposal](../../specs/infrastructure/igad_sam_architecture_proposal.md)
- [Technical Documentation](../../specs/infrastructure/igad_sam_architecture_documentation.md)
- [AWS SAM Documentation](https://docs.aws.amazon.com/serverless-application-model/)
- [Cost Optimization Guide](https://aws.amazon.com/pricing/cost-optimization/)

## Support

For issues or questions:
1. Check CloudFormation stack events
2. Review CloudWatch logs
3. Validate SAM templates
4. Consult AWS documentation
