# Impact Compendium - Infrastructure Base Architecture

**Document Version:** 1.0  
**Date:** October 21, 2025  
**Author:** DevOps Architecture Team  
**Sprint:** Sprint 1 - Infrastructure Setup & Environments

---

## Infrastructure Overview

The Impact Compendium infrastructure is built using **AWS SAM (Serverless Application Model)** with CloudFormation for Infrastructure as Code. The architecture follows AWS Well-Architected principles with a focus on cost optimization, security, and operational excellence.

### Architecture Pattern Selection

Based on AWS Solutions Constructs analysis, we're implementing a combination of proven patterns:

1. **aws-cognito-apigateway-lambda** - For authenticated API access
2. **aws-lambda-secretsmanager** - For secure database credential management
3. **aws-lambda-s3** - For static asset hosting and file storage

## Core Infrastructure Components

### 1. Compute Layer
- **AWS Lambda Functions** (ARM64, Python 3.11)
  - Studies API Handler
  - Indicators API Handler
  - Authentication Handler
  - Admin API Handler
  - Reports API Handler

### 2. API Layer
- **Amazon API Gateway** (REST API)
  - CORS enabled for frontend integration
  - JWT token validation
  - Request/response transformation
  - Throttling and rate limiting

### 3. Database Layer
- **Amazon RDS MySQL** (db.t3.micro)
  - Single-AZ for cost optimization
  - Automated backups (7-day retention)
  - Encryption at rest (AWS KMS)
  - VPC deployment for security

### 4. Authentication & Security
- **Amazon Cognito User Pool**
  - Custom attributes (role, organization, center)
  - Password policies and MFA support
  - JWT token management
- **AWS Secrets Manager**
  - Database credentials storage
  - Automatic rotation capability
- **AWS Systems Manager Parameter Store**
  - Application configuration parameters

### 5. Storage Layer
- **Amazon S3**
  - Static website hosting (React SPA)
  - Study attachments and documents
  - Backup storage for database snapshots
- **Amazon CloudFront**
  - CDN for global content delivery
  - SSL/TLS termination
  - Caching optimization

### 6. Monitoring & Observability
- **Amazon CloudWatch**
  - Centralized logging for all Lambda functions
  - Custom metrics and alarms
  - Performance monitoring
- **AWS X-Ray**
  - Distributed tracing for debugging
  - Performance analysis

## Network Architecture

### VPC Configuration
```
VPC: 10.0.0.0/16
├── Public Subnet A: 10.0.1.0/24 (us-east-1a)
├── Public Subnet B: 10.0.2.0/24 (us-east-1b)
├── Private Subnet A: 10.0.11.0/24 (us-east-1a)
└── Private Subnet B: 10.0.12.0/24 (us-east-1b)
```

### Security Groups
- **Lambda Security Group**: Outbound HTTPS (443) and MySQL (3306)
- **RDS Security Group**: Inbound MySQL (3306) from Lambda SG only
- **ALB Security Group**: Inbound HTTP (80) and HTTPS (443)

## Cost Optimization Strategy

### Resource Sizing
- **Lambda**: 256MB memory, ARM64 architecture for cost efficiency
- **RDS**: db.t3.micro instance with auto-pause capability
- **API Gateway**: REST API with caching enabled
- **CloudFront**: Standard price class with optimized caching

### Budget Controls
- **Development Environment**: $35/month target
- **Production Environment**: $45/month target
- **CloudWatch Billing Alarms**: $60, $70, $85 thresholds
- **Cost allocation tags**: Environment, Project, Owner

## Security Implementation

### Identity & Access Management
```yaml
IAM Roles:
  LambdaExecutionRole:
    - CloudWatch Logs access
    - VPC network interface management
    - Secrets Manager read access
    - RDS connection permissions
  
  CognitoRole:
    - User pool management
    - JWT token validation
```

### Data Protection
- **Encryption at Rest**: RDS, S3, Secrets Manager (AWS KMS)
- **Encryption in Transit**: HTTPS/TLS for all communications
- **Network Isolation**: Lambda functions in private subnets
- **Least Privilege**: Minimal IAM permissions per service

## Deployment Strategy

### Environment Configuration
```yaml
Environments:
  Development:
    - Single RDS instance
    - Reduced Lambda memory
    - Basic monitoring
    - Cost: ~$35/month
  
  Production:
    - Multi-AZ RDS (future)
    - Optimized Lambda configuration
    - Enhanced monitoring
    - Cost: ~$45/month
```

### CI/CD Pipeline
1. **Source**: GitHub repository
2. **Build**: SAM build with dependency installation
3. **Test**: Unit tests and security scanning
4. **Deploy**: CloudFormation stack deployment
5. **Validate**: Smoke tests and health checks

## Monitoring & Alerting

### CloudWatch Metrics
- **Lambda**: Duration, errors, throttles, concurrent executions
- **API Gateway**: Request count, latency, 4xx/5xx errors
- **RDS**: CPU utilization, database connections, read/write IOPS
- **Custom**: Business metrics (study creation rate, user activity)

### Alarms Configuration
```yaml
Critical Alarms:
  - Lambda error rate > 5%
  - API Gateway 5xx errors > 1%
  - RDS CPU utilization > 80%
  - Database connection count > 80% of max

Warning Alarms:
  - Lambda duration > 10 seconds
  - API Gateway latency > 2 seconds
  - RDS storage space < 20%
```

## Disaster Recovery

### Backup Strategy
- **RDS**: Automated daily backups (7-day retention)
- **S3**: Cross-region replication for critical data
- **Code**: Git repository with multiple remotes
- **Configuration**: Infrastructure as Code in version control

### Recovery Procedures
- **RTO (Recovery Time Objective)**: 4 hours
- **RPO (Recovery Point Objective)**: 24 hours
- **Automated**: CloudFormation stack recreation
- **Manual**: Database restore from backup

## Implementation Checklist

### Phase 1: Foundation (Week 1)
- [ ] SAM project initialization
- [ ] VPC and networking setup
- [ ] RDS MySQL deployment
- [ ] Basic Lambda functions
- [ ] API Gateway configuration

### Phase 2: Security & Monitoring (Week 2)
- [ ] Cognito User Pool setup
- [ ] Secrets Manager integration
- [ ] CloudWatch logging configuration
- [ ] Security group validation
- [ ] Cost monitoring setup

### Phase 3: Validation & Documentation
- [ ] Infrastructure testing
- [ ] Security scanning
- [ ] Performance baseline
- [ ] Documentation completion
- [ ] Deployment automation

## Next Steps

1. **Sprint 2**: Frontend React application setup and S3 hosting
2. **Sprint 3**: Backend API implementation with FastAPI
3. **Sprint 4**: Database schema and ORM integration
4. **Sprint 5**: Authentication flow implementation
5. **Sprint 6**: End-to-end feature integration
6. **Sprint 7**: Testing, optimization, and production readiness

---

**Status**: Infrastructure Foundation Complete  
**Next Review**: Sprint 2 Planning  
**Deployment Target**: Development environment by end of Sprint 1
