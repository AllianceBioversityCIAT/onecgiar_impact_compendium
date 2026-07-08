# IGAD SAM Architecture Documentation

**Version:** 1.0  
**Author:** Amazon Q  
**Date:** 2025-01-30  
**Project:** IGAD Impact Compendium

## Architecture Overview

The IGAD Impact Compendium uses a serverless architecture built entirely with AWS SAM (Serverless Application Model). The system supports two isolated environments (testing and production) with strict cost controls and comprehensive resource tagging.

### Core Components
- **Frontend**: React SPA hosted on S3 + CloudFront
- **Backend**: FastAPI on AWS Lambda + HTTP API Gateway
- **Authentication**: AWS Cognito User Pools
- **Database**: MySQL RDS (new for testing, existing for production)
- **Configuration**: AWS Systems Manager Parameter Store

## Environment Specifications

### Testing Environment (`igad-testing`)
```yaml
Stack Name: igad-testing
Budget: $25/month
Access: Public internet
Database: New RDS MySQL (db.t3.micro)
SSL: CloudFront default certificate
```

**Resource Configuration:**
- Lambda: 256MB memory, 30s timeout
- RDS: db.t3.micro, 20GB storage, 1-day backup
- CloudFront: PriceClass_100
- Logs: 14-day retention

### Production Environment (`igad-production`)
```yaml
Stack Name: igad-production
Budget: $70/month
Access: VPN + public internet
Database: Existing RDS MySQL
SSL: ACM certificate + custom domain
```

**Resource Configuration:**
- Lambda: 512MB memory, 60s timeout
- RDS: External existing instance
- CloudFront: PriceClass_100 + WAF
- Logs: 30-day retention

## Resource Configuration

### Lambda Functions
```yaml
Runtime: python3.11
Architecture: x86_64
Environment Variables:
  - DATABASE_URL (from SSM)
  - COGNITO_USER_POOL_ID
  - COGNITO_CLIENT_ID
  - ENVIRONMENT
```

### API Gateway (HTTP API)
```yaml
Type: AWS::Serverless::HttpApi
CORS: Enabled
Throttling: 1000 requests/second
Integration: Lambda Proxy
```

### S3 + CloudFront
```yaml
S3:
  Versioning: Enabled
  Encryption: AES256
  
CloudFront:
  Origins: S3 bucket
  Behaviors: SPA routing
  Caching: Optimized for static assets
```

### Cognito User Pool
```yaml
Policies:
  PasswordPolicy:
    MinimumLength: 8
    RequireUppercase: true
    RequireNumbers: true
    RequireSymbols: true
```

### RDS MySQL (Testing Only)
```yaml
Engine: mysql8.0
Instance: db.t3.micro
Storage: 20GB gp2
MultiAZ: false
BackupRetention: 1 day
```

## Deployment Procedures

### Prerequisites
```bash
# Install AWS SAM CLI
pip install aws-sam-cli

# Configure AWS Profile
aws configure --profile IBD-DEV
```

### Build and Deploy
```bash
# Navigate to Infrastructure directory
cd impact-compendium-app/Infrastructure

# Build SAM application
sam build --profile IBD-DEV

# Deploy to testing
sam deploy --config-env testing --profile IBD-DEV

# Deploy to production
sam deploy --config-env production --profile IBD-DEV
```

### Environment Management
```bash
# Validate templates
sam validate --lint --profile IBD-DEV

# Delete environment
sam delete --stack-name igad-testing --profile IBD-DEV
sam delete --stack-name igad-production --profile IBD-DEV

# View stack outputs
aws cloudformation describe-stacks \
  --stack-name igad-testing \
  --profile IBD-DEV \
  --query 'Stacks[0].Outputs'
```

## Cost Management

### Tagging Strategy
All resources include mandatory tags:
```yaml
Tags:
  Project: igad
  Environment: testing|production
  Component: frontend|backend|database|auth
  CostCenter: research-platform
  Owner: cgiar-alliance
  CreatedBy: sam-deployment
```

### Cost Optimization Features
- **HTTP API**: 60% cheaper than REST API
- **On-demand Lambda**: No reserved capacity
- **Minimal RDS**: db.t3.micro for testing
- **Regional CloudFront**: PriceClass_100
- **Log Retention**: 14-30 days maximum

### Budget Monitoring
```yaml
Testing Environment: $25/month alert
Production Environment: $70/month alert
Total Budget: $95/month hard limit
```

## Security Implementation

### Authentication Flow
1. User authenticates via Cognito
2. Cognito returns JWT token
3. Lambda validates JWT for API access
4. Database access via IAM roles

### Network Security
```yaml
Testing:
  - Public API Gateway
  - RDS in private subnet
  - Security groups: Lambda → RDS only

Production:
  - Public API Gateway + WAF
  - VPN connection to existing RDS
  - Restrictive security groups
```

### Data Protection
- Secrets in AWS Secrets Manager
- RDS encryption at rest (production)
- S3 bucket encryption (AES256)
- CloudFront HTTPS enforcement

### IAM Roles (Least Privilege)
```yaml
Lambda Execution Role:
  - CloudWatch Logs write
  - RDS/VPC access (if needed)
  - SSM Parameter read
  - Secrets Manager read

API Gateway Role:
  - Lambda invoke only
```

## Monitoring and Alerting

### CloudWatch Metrics
- Lambda duration, errors, throttles
- API Gateway 4xx/5xx errors, latency
- RDS CPU, connections, storage
- CloudFront cache hit ratio

### Log Aggregation
```yaml
Lambda Logs: /aws/lambda/igad-{env}-{function}
API Gateway: /aws/apigateway/igad-{env}
CloudFront: S3 bucket (production only)
```

### Alerting Thresholds
- Lambda errors > 5% in 5 minutes
- API Gateway latency > 2 seconds
- RDS CPU > 80% for 10 minutes
- Daily cost > budget threshold

## Disaster Recovery

### Backup Strategy
```yaml
RDS:
  - Automated backups (1-7 days)
  - Point-in-time recovery
  
S3:
  - Versioning enabled
  - Cross-region replication (production)
  
Infrastructure:
  - SAM templates in version control
  - Automated deployment pipeline
```

### Recovery Procedures
1. **Database Recovery**: Restore from RDS backup
2. **Application Recovery**: Redeploy SAM stack
3. **Frontend Recovery**: Restore S3 from versioning
4. **Full Environment**: Deploy from SAM templates

## Performance Optimization

### Lambda Optimization
- Minimal package size
- Connection pooling for RDS
- Environment variable caching
- Provisioned concurrency (production only)

### API Gateway Optimization
- HTTP API for lower latency
- Request/response caching
- Compression enabled

### CloudFront Optimization
- Optimized caching policies
- Gzip compression
- HTTP/2 support
- Edge locations (PriceClass_100)

## Troubleshooting Guide

### Common Issues
1. **Lambda Cold Starts**: Monitor duration metrics
2. **RDS Connections**: Check connection pooling
3. **CORS Errors**: Verify API Gateway configuration
4. **Authentication**: Validate Cognito JWT tokens

### Debug Commands
```bash
# View Lambda logs
sam logs --stack-name igad-testing --profile IBD-DEV

# Test API locally
sam local start-api --profile IBD-DEV

# Validate SAM template
sam validate --lint --profile IBD-DEV
```

## Maintenance Procedures

### Regular Tasks
- Monthly cost review and optimization
- Quarterly security audit
- Log retention cleanup
- Dependency updates

### Scaling Considerations
- Lambda concurrent executions
- RDS connection limits
- API Gateway throttling
- CloudFront cache behavior

## References

- [AWS SAM Documentation](https://docs.aws.amazon.com/serverless-application-model/)
- [IGAD Architecture Proposal](./igad_sam_architecture_proposal.md)
- [AWS Well-Architected Framework](https://aws.amazon.com/architecture/well-architected/)
- [Cost Optimization Best Practices](https://aws.amazon.com/pricing/cost-optimization/)
