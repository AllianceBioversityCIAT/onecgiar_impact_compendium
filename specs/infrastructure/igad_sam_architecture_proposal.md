# IGAD SAM Architecture Proposal

## Overview
This proposal outlines a simplified, cost-effective serverless architecture for the IGAD Impact Compendium using AWS SAM (Serverless Application Model) with strict cost controls and dual-environment deployment.

## Deployment Goals and Constraints

### Primary Goals
- **Simplicity**: Minimal AWS components using SAM-only deployment
- **Cost Control**: Strict budget adherence with comprehensive tagging
- **Environment Isolation**: Separate testing and production stacks
- **Easy Management**: Simple deploy/destroy operations via SAM CLI

### Key Constraints
- AWS Profile: `IBD-DEV` for all operations
- Region: `us-east-1` (North Virginia)
- Budget: Testing ($25/month), Production ($70/month)
- Deployment Tool: SAM CLI + CloudFormation only

## Design Simplicity Justification

### Why SAM Over CDK/Terraform
- **Native AWS Integration**: Direct CloudFormation compilation
- **Serverless Optimized**: Built specifically for Lambda/API Gateway
- **Minimal Learning Curve**: YAML-based, familiar syntax
- **Cost Transparency**: Clear resource mapping to costs

### Component Minimization Strategy
- Use HTTP API instead of REST API (60% cost reduction)
- Single Lambda function per service (reduce cold starts)
- Shared CloudFront distribution patterns
- Minimal RDS configurations for testing

## Component Architecture

### Testing Environment (`igad-testing`)
```
┌─────────────────┐    ┌──────────────────┐    ┌─────────────────┐
│   CloudFront    │────│   S3 Bucket      │    │   API Gateway   │
│   (Frontend)    │    │   (Static Site)  │    │   (HTTP API)    │
└─────────────────┘    └──────────────────┘    └─────────────────┘
                                                         │
                                                ┌─────────────────┐
                                                │   Lambda        │
                                                │   (FastAPI)     │
                                                └─────────────────┘
                                                         │
┌─────────────────┐    ┌──────────────────┐    ┌─────────────────┐
│   Cognito       │    │   RDS MySQL      │    │   SSM/Secrets   │
│   (Auth)        │    │   (db.t3.micro)  │    │   (Config)      │
└─────────────────┘    └──────────────────┘    └─────────────────┘
```

### Production Environment (`igad-production`)
```
┌─────────────────┐    ┌──────────────────┐    ┌─────────────────┐
│   CloudFront    │────│   S3 Bucket      │    │   API Gateway   │
│   (Frontend)    │    │   (Static Site)  │    │   (HTTP API)    │
│   + ACM SSL     │    │                  │    │                 │
└─────────────────┘    └──────────────────┘    └─────────────────┘
                                                         │
                                                ┌─────────────────┐
                                                │   Lambda        │
                                                │   (FastAPI)     │
                                                └────────────────���┘
                                                         │
┌─────────────────┐    ┌──────────────────┐    ┌─────────────────┐
│   Cognito       │    │   Existing RDS   │    │   SSM/Secrets   │
│   (Auth)        │    │   (External)     │    │   (Config)      │
└─────────────────┘    └──────────────────┘    └─────────────────┘
```

## Network Considerations

### Testing Environment
- **Public Access**: All resources publicly accessible
- **Security Groups**: Minimal rules for RDS access
- **No VPN Required**: Direct internet connectivity

### Production Environment
- **VPN Integration**: Secure connection to existing RDS
- **Security Groups**: Restrictive rules for production RDS
- **SSL/TLS**: ACM certificates for custom domains

## Cost Optimization Principles

### Resource Sizing
```yaml
Lambda:
  Memory: 256MB (testing), 512MB (production)
  Timeout: 30s (testing), 60s (production)
  
RDS (Testing Only):
  Instance: db.t3.micro
  Storage: 20GB
  Backup: 1 day retention
  
CloudFront:
  PriceClass: PriceClass_100 (US/Europe only)
  
Logging:
  Retention: 14 days (testing), 30 days (production)
```

### Cost Monitoring Tags
Every resource includes:
```yaml
Tags:
  Project: igad
  Environment: testing|production
  Component: frontend|backend|database|auth
  CostCenter: research-platform
  Owner: cgiar-alliance
```

## Global Tagging Policy

### Mandatory Tags (All Resources)
- `Project: igad` - Project identifier
- `Environment: testing|production` - Environment classification

### Optional Tags (Recommended)
- `Component: frontend|backend|database|auth` - Service classification
- `CostCenter: research-platform` - Budget allocation
- `Owner: cgiar-alliance` - Ownership tracking
- `CreatedBy: sam-deployment` - Creation method

## Deployment Strategy

### Stack Names
- Testing: `igad-testing`
- Production: `igad-production`

### Deployment Commands
```bash
# Build
sam build --profile IBD-DEV

# Deploy Testing
sam deploy --config-env testing --profile IBD-DEV

# Deploy Production  
sam deploy --config-env production --profile IBD-DEV

# Delete Stack
sam delete --stack-name igad-testing --profile IBD-DEV
```

## Security Considerations

### Authentication
- Isolated Cognito User Pools per environment
- JWT token validation in Lambda
- Least-privilege IAM roles

### Data Protection
- Secrets stored in AWS Secrets Manager
- Environment variables for non-sensitive config
- RDS encryption at rest (production)

### Network Security
- API Gateway throttling
- CloudFront WAF (production only)
- Security groups with minimal access

## Monitoring and Logging

### CloudWatch Integration
- Lambda function logs (14-30 day retention)
- API Gateway access logs
- CloudFront access logs (production)

### Cost Monitoring
- Daily cost alerts via CloudWatch
- Resource tagging for cost allocation
- Monthly budget notifications

## Risk Mitigation

### High Availability
- Multi-AZ RDS (production only)
- CloudFront global distribution
- Lambda automatic scaling

### Disaster Recovery
- S3 versioning for static assets
- RDS automated backups
- Infrastructure as Code for rapid rebuild

## Success Criteria

### Technical
- ✅ SAM templates validate successfully
- ✅ All resources properly tagged
- ✅ Environments deploy independently
- ✅ Cost budgets maintained

### Operational
- ✅ Single-command deployment
- ✅ Easy environment teardown
- ✅ Clear cost attribution
- ✅ Minimal operational overhead

## Next Steps

1. Generate detailed architecture documentation
2. Create AWS architecture diagram
3. Build SAM templates for both environments
4. Create deployment scripts and configuration
5. Document deployment procedures
