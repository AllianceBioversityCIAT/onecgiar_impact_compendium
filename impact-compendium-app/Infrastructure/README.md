# Impact Compendium Infrastructure

This directory contains the AWS SAM (Serverless Application Model) infrastructure for the Impact Compendium Database application.

## 🏗️ Architecture Overview

The Impact Compendium is built using a serverless architecture on AWS with the following components:

- **Compute**: AWS Lambda functions (Python 3.11, ARM64)
- **API**: Amazon API Gateway (REST API)
- **Database**: Amazon RDS MySQL (db.t3.micro)
- **Authentication**: Amazon Cognito User Pool
- **Storage**: Amazon S3 (frontend hosting, attachments)
- **CDN**: Amazon CloudFront
- **Monitoring**: Amazon CloudWatch, AWS X-Ray
- **Security**: AWS Secrets Manager, IAM roles

## 📋 Prerequisites

Before deploying the infrastructure, ensure you have:

1. **AWS CLI** installed and configured
   ```bash
   aws --version
   aws configure --profile IBD-DEV
   ```

2. **SAM CLI** installed
   ```bash
   sam --version
   ```

3. **Python 3.11** installed
   ```bash
   python3.11 --version
   ```

4. **AWS Account Access** with appropriate permissions for:
   - CloudFormation
   - Lambda
   - API Gateway
   - RDS
   - S3
   - Cognito
   - IAM

## 🚀 Quick Start

### 1. Deploy Infrastructure

Use the deployment script for easy setup:

```bash
# Deploy to development environment
./deploy.sh

# Deploy to staging environment
./deploy.sh -e staging

# Deploy to production environment
./deploy.sh -e prod -p production-profile
```

### 2. Manual Deployment

If you prefer manual deployment:

```bash
# Validate template
sam validate

# Build application
sam build --parallel

# Deploy to development
sam deploy --config-env dev

# Deploy to staging
sam deploy --config-env staging

# Deploy to production
sam deploy --config-env prod
```

## 📁 Project Structure

```
Infrastructure/
├── template.yaml              # SAM CloudFormation template
├── samconfig.toml            # SAM configuration for environments
├── deploy.sh                 # Deployment script
├── README.md                 # This file
├── architecture/
│   └── infrastructure_base.md # Architecture documentation
├── layers/
│   └── powertools/           # Lambda Powertools layer
│       └── requirements.txt
├── src/                      # Lambda function source code
│   ├── studies/              # Studies API handler
│   ├── indicators/           # Indicators API handler
│   ├── auth/                 # Authentication handler
│   ├── admin/                # Admin API handler
│   └── reports/              # Reports API handler
└── .github/
    └── workflows/
        └── deploy.yml        # CI/CD pipeline
```

## 🌍 Environments

The infrastructure supports three environments:

### Development (`dev`)
- **Purpose**: Development and testing
- **RDS**: db.t3.micro, Single-AZ
- **Cost Target**: ~$35/month
- **Features**: Basic monitoring, auto-pause RDS

### Staging (`staging`)
- **Purpose**: Pre-production testing
- **RDS**: db.t3.small, Single-AZ
- **Cost Target**: ~$25/month
- **Features**: Enhanced monitoring

### Production (`prod`)
- **Purpose**: Live application
- **RDS**: db.t3.small, Multi-AZ (optional)
- **Cost Target**: ~$45/month
- **Features**: Full monitoring, performance insights, deletion protection

## 🔧 Configuration

### Environment Variables

The Lambda functions use these environment variables:

```yaml
ENVIRONMENT: dev|staging|prod
LOG_LEVEL: INFO
POWERTOOLS_SERVICE_NAME: impact-compendium
POWERTOOLS_METRICS_NAMESPACE: ImpactCompendium
DB_SECRET_ARN: <RDS secret ARN>
DB_HOST: <RDS endpoint>
DB_PORT: 3306
DB_NAME: impact_compendium
COGNITO_USER_POOL_ID: <Cognito User Pool ID>
COGNITO_CLIENT_ID: <Cognito Client ID>
```

### Cost Optimization

The infrastructure is optimized for cost with:

- **ARM64 Lambda functions** (20% cost reduction)
- **Minimal RDS instances** (db.t3.micro for dev/staging)
- **Intelligent S3 storage tiering**
- **CloudWatch log retention** (14 days)
- **Auto-pause RDS** for development environment

## 📊 Monitoring & Observability

### CloudWatch Metrics

The infrastructure includes comprehensive monitoring:

- **Lambda**: Duration, errors, throttles, concurrent executions
- **API Gateway**: Request count, latency, 4xx/5xx errors
- **RDS**: CPU utilization, database connections, IOPS
- **Custom**: Business metrics via Lambda Powertools

### Alarms

Critical alarms are configured for:

- Database CPU > 80%
- API Gateway 5xx errors > 1%
- Lambda error rate > 5%
- Cost thresholds ($60, $70, $85)

### Logging

Structured logging is implemented using AWS Lambda Powertools:

```python
from aws_lambda_powertools import Logger, Tracer, Metrics

logger = Logger()
tracer = Tracer()
metrics = Metrics()
```

## 🔒 Security

### IAM Roles

The infrastructure follows least privilege principles:

- **Lambda Execution Role**: VPC access, Secrets Manager read, CloudWatch logs
- **RDS Role**: Enhanced monitoring (production only)

### Network Security

- **VPC**: Private subnets for Lambda and RDS
- **Security Groups**: Restrictive rules (Lambda → RDS on port 3306)
- **NAT Gateway**: Outbound internet access for Lambda functions

### Data Protection

- **Encryption at Rest**: RDS, S3, Secrets Manager (AWS KMS)
- **Encryption in Transit**: HTTPS/TLS for all communications
- **Secrets Management**: Database credentials in AWS Secrets Manager

## 🧪 Testing

### Local Development

Test Lambda functions locally:

```bash
# Start API locally
sam local start-api --config-env dev

# Invoke specific function
sam local invoke StudiesFunction --config-env dev --event events/studies-get.json
```

### Integration Testing

The CI/CD pipeline includes:

- Template validation
- Security scanning
- Unit tests
- Integration tests
- Smoke tests

## 💰 Cost Management

### Budget Monitoring

CloudWatch billing alarms are configured for:

- **Warning**: $60/month (85% of target)
- **Critical**: $70/month (100% of target)
- **Emergency**: $85/month (120% of target)

### Cost Allocation Tags

All resources are tagged for cost tracking:

```yaml
Environment: dev|staging|prod
Project: impact-compendium
Owner: cgiar-alliance
CostCenter: research-platform
BudgetCategory: infrastructure
CreatedBy: sam-deployment
```

## 🔄 CI/CD Pipeline

The GitHub Actions workflow (`.github/workflows/deploy.yml`) provides:

1. **Validation**: Template and security scanning
2. **Build**: SAM build and frontend compilation
3. **Test**: Unit and integration tests
4. **Deploy**: Environment-specific deployments
5. **Monitor**: Cost and performance monitoring

### Deployment Flow

```
develop branch → Development environment
main branch → Staging → Production (with approval)
```

## 📚 API Documentation

Once deployed, API documentation is available at:

- **Development**: `https://{api-id}.execute-api.us-east-1.amazonaws.com/dev/docs`
- **Staging**: `https://{api-id}.execute-api.us-east-1.amazonaws.com/staging/docs`
- **Production**: `https://{api-id}.execute-api.us-east-1.amazonaws.com/prod/docs`

## 🛠️ Troubleshooting

### Common Issues

1. **Deployment Fails**
   ```bash
   # Check AWS credentials
   aws sts get-caller-identity --profile IBD-DEV
   
   # Validate template
   sam validate
   ```

2. **Lambda Function Errors**
   ```bash
   # Check CloudWatch logs
   sam logs --stack-name impact-compendium-dev --tail
   ```

3. **Database Connection Issues**
   ```bash
   # Verify security groups and VPC configuration
   aws ec2 describe-security-groups --group-ids sg-xxxxx
   ```

### Useful Commands

```bash
# Get stack outputs
aws cloudformation describe-stacks --stack-name impact-compendium-dev

# Check RDS status
aws rds describe-db-instances --db-instance-identifier impact-compendium-dev-db

# View Lambda function logs
aws logs tail /aws/lambda/impact-compendium-dev-studies --follow
```

## 📞 Support

For issues and questions:

1. Check the [troubleshooting section](#troubleshooting)
2. Review CloudWatch logs and metrics
3. Consult the [architecture documentation](architecture/infrastructure_base.md)
4. Contact the development team

## 🔄 Next Steps

After successful infrastructure deployment:

1. **Sprint 2**: Deploy React frontend application
2. **Sprint 3**: Implement FastAPI backend logic
3. **Sprint 4**: Set up database schema and migrations
4. **Sprint 5**: Configure Cognito authentication
5. **Sprint 6**: Integrate frontend with backend APIs
6. **Sprint 7**: Production readiness and optimization

---

**Infrastructure Status**: ✅ Sprint 1 Complete  
**Next Sprint**: Frontend Design & React Foundation  
**Estimated Cost**: $35/month (development), $45/month (production)
