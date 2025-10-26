# Deployment Guide

## Overview

This guide covers deploying the Impact Compendium Backend to AWS using Lambda, RDS, and supporting services. The architecture is designed for serverless deployment with automatic scaling and cost optimization.

## Architecture Overview

```
Internet → API Gateway → Lambda Function → RDS MySQL
                    ↓
                CloudWatch Logs
                    ↓
                AWS Cognito (Auth)
```

## Prerequisites

### AWS Services Required

1. **AWS Lambda**: Serverless compute for API
2. **Amazon RDS**: MySQL database
3. **API Gateway**: HTTP API routing
4. **AWS Cognito**: User authentication
5. **CloudWatch**: Logging and monitoring
6. **IAM**: Permissions and roles

### Development Environment

```bash
# Required tools
- Python 3.9+
- AWS CLI configured
- Docker (for local testing)
- Git

# Install dependencies
pip install -r requirements.txt
```

## Environment Configuration

### Environment Variables

Create `.env` file with required configuration:

```bash
# Database Configuration
DB_HOST=your-rds-endpoint.region.rds.amazonaws.com
DB_PORT=3306
DB_NAME=impact_compendium
DB_USER=your-db-username
DB_PASSWORD=your-db-password
DB_ECHO=false

# AWS Configuration
AWS_REGION=us-east-1
AWS_PROFILE=your-aws-profile

# Cognito Configuration
COGNITO_USER_POOL_ID=us-east-1_xxxxxxxxx
COGNITO_CLIENT_ID=your-client-id
COGNITO_REGION=us-east-1

# Application Configuration
ENVIRONMENT=production
LOG_LEVEL=INFO
```

### AWS Profile Configuration

```bash
# Configure AWS CLI
aws configure --profile your-profile
# AWS Access Key ID: your-access-key
# AWS Secret Access Key: your-secret-key
# Default region name: us-east-1
# Default output format: json
```

## Database Setup

### RDS MySQL Instance

**Create RDS Instance**:
```bash
# Using AWS CLI
aws rds create-db-instance \
    --db-instance-identifier impact-compendium-db \
    --db-instance-class db.t3.micro \
    --engine mysql \
    --engine-version 8.0.35 \
    --master-username admin \
    --master-user-password your-secure-password \
    --allocated-storage 20 \
    --storage-type gp2 \
    --vpc-security-group-ids sg-xxxxxxxxx \
    --db-subnet-group-name your-subnet-group \
    --backup-retention-period 7 \
    --storage-encrypted \
    --multi-az false \
    --publicly-accessible false
```

**Security Group Configuration**:
```bash
# Allow Lambda access to RDS
aws ec2 authorize-security-group-ingress \
    --group-id sg-rds-security-group \
    --protocol tcp \
    --port 3306 \
    --source-group sg-lambda-security-group
```

### Database Initialization

**Run Database Creation Script**:
```bash
# Initialize database schema
python create_db.py
```

**Run Alembic Migrations**:
```bash
# Apply database migrations
alembic upgrade head
```

## Lambda Deployment

### Deployment Package Creation

**Create Deployment Package**:
```bash
# Create deployment directory
mkdir lambda-deployment
cd lambda-deployment

# Copy application code
cp -r ../app .
cp ../requirements.txt .
cp ../.env .

# Install dependencies
pip install -r requirements.txt -t .

# Create deployment package
zip -r impact-compendium-api.zip .
```

### Lambda Function Configuration

**Create Lambda Function**:
```bash
aws lambda create-function \
    --function-name impact-compendium-api \
    --runtime python3.9 \
    --role arn:aws:iam::account:role/lambda-execution-role \
    --handler app.main.handler \
    --zip-file fileb://impact-compendium-api.zip \
    --timeout 30 \
    --memory-size 512 \
    --environment Variables='{
        "DB_HOST":"your-rds-endpoint",
        "DB_NAME":"impact_compendium",
        "DB_USER":"admin",
        "DB_PASSWORD":"your-password",
        "ENVIRONMENT":"production"
    }' \
    --vpc-config SubnetIds=subnet-xxx,subnet-yyy,SecurityGroupIds=sg-lambda
```

**Update Function Code**:
```bash
# Update existing function
aws lambda update-function-code \
    --function-name impact-compendium-api \
    --zip-file fileb://impact-compendium-api.zip
```

### Lambda Layer (Optional)

**Create Dependencies Layer**:
```bash
# Create layer for common dependencies
mkdir python
pip install -r requirements.txt -t python/
zip -r dependencies-layer.zip python/

aws lambda publish-layer-version \
    --layer-name impact-compendium-dependencies \
    --zip-file fileb://dependencies-layer.zip \
    --compatible-runtimes python3.9
```

## API Gateway Setup

### HTTP API Configuration

**Create API Gateway**:
```bash
aws apigatewayv2 create-api \
    --name impact-compendium-api \
    --protocol-type HTTP \
    --cors-configuration AllowOrigins="*",AllowMethods="*",AllowHeaders="*"
```

**Create Integration**:
```bash
aws apigatewayv2 create-integration \
    --api-id your-api-id \
    --integration-type AWS_PROXY \
    --integration-uri arn:aws:lambda:region:account:function:impact-compendium-api \
    --payload-format-version 2.0
```

**Create Routes**:
```bash
# Catch-all route for FastAPI
aws apigatewayv2 create-route \
    --api-id your-api-id \
    --route-key 'ANY /{proxy+}' \
    --target integrations/your-integration-id
```

**Deploy API**:
```bash
aws apigatewayv2 create-deployment \
    --api-id your-api-id \
    --stage-name prod
```

## IAM Roles and Permissions

### Lambda Execution Role

**Create Role**:
```json
{
  "Version": "2012-10-17",
  "Statement": [
    {
      "Effect": "Allow",
      "Principal": {
        "Service": "lambda.amazonaws.com"
      },
      "Action": "sts:AssumeRole"
    }
  ]
}
```

**Attach Policies**:
```bash
# Basic Lambda execution
aws iam attach-role-policy \
    --role-name lambda-execution-role \
    --policy-arn arn:aws:iam::aws:policy/service-role/AWSLambdaBasicExecutionRole

# VPC access (if RDS is in VPC)
aws iam attach-role-policy \
    --role-name lambda-execution-role \
    --policy-arn arn:aws:iam::aws:policy/service-role/AWSLambdaVPCAccessExecutionRole
```

### Custom Policies

**RDS Access Policy**:
```json
{
  "Version": "2012-10-17",
  "Statement": [
    {
      "Effect": "Allow",
      "Action": [
        "rds:DescribeDBInstances",
        "rds:DescribeDBClusters"
      ],
      "Resource": "*"
    }
  ]
}
```

**Cognito Access Policy**:
```json
{
  "Version": "2012-10-17",
  "Statement": [
    {
      "Effect": "Allow",
      "Action": [
        "cognito-idp:AdminGetUser",
        "cognito-idp:AdminListGroupsForUser"
      ],
      "Resource": "arn:aws:cognito-idp:region:account:userpool/your-pool-id"
    }
  ]
}
```

## Cognito User Pool Setup

### User Pool Configuration

**Create User Pool**:
```bash
aws cognito-idp create-user-pool \
    --pool-name impact-compendium-users \
    --policies '{
        "PasswordPolicy": {
            "MinimumLength": 8,
            "RequireUppercase": true,
            "RequireLowercase": true,
            "RequireNumbers": true,
            "RequireSymbols": false
        }
    }' \
    --auto-verified-attributes email \
    --username-attributes email
```

**Create User Pool Client**:
```bash
aws cognito-idp create-user-pool-client \
    --user-pool-id your-pool-id \
    --client-name impact-compendium-client \
    --generate-secret \
    --explicit-auth-flows ADMIN_NO_SRP_AUTH,ALLOW_USER_PASSWORD_AUTH,ALLOW_REFRESH_TOKEN_AUTH
```

## Monitoring and Logging

### CloudWatch Configuration

**Log Groups**:
```bash
# Lambda function logs
aws logs create-log-group \
    --log-group-name /aws/lambda/impact-compendium-api

# API Gateway logs
aws logs create-log-group \
    --log-group-name /aws/apigateway/impact-compendium-api
```

**Metrics and Alarms**:
```bash
# Error rate alarm
aws cloudwatch put-metric-alarm \
    --alarm-name impact-compendium-error-rate \
    --alarm-description "High error rate in Impact Compendium API" \
    --metric-name Errors \
    --namespace AWS/Lambda \
    --statistic Sum \
    --period 300 \
    --threshold 10 \
    --comparison-operator GreaterThanThreshold \
    --dimensions Name=FunctionName,Value=impact-compendium-api \
    --evaluation-periods 2
```

### Application Logging

**Structured Logging Configuration**:
```python
# app/utils/logging.py
import logging
import json
from datetime import datetime

class JSONFormatter(logging.Formatter):
    """JSON formatter for structured logging"""
    
    def format(self, record):
        log_entry = {
            "timestamp": datetime.utcnow().isoformat(),
            "level": record.levelname,
            "message": record.getMessage(),
            "module": record.module,
            "function": record.funcName,
            "line": record.lineno
        }
        
        if record.exc_info:
            log_entry["exception"] = self.formatException(record.exc_info)
        
        return json.dumps(log_entry)

def setup_logging():
    """Configure application logging"""
    logger = logging.getLogger()
    logger.setLevel(logging.INFO)
    
    handler = logging.StreamHandler()
    handler.setFormatter(JSONFormatter())
    logger.addHandler(handler)
```

## Security Configuration

### Network Security

**VPC Configuration**:
```bash
# Create VPC for RDS and Lambda
aws ec2 create-vpc --cidr-block 10.0.0.0/16

# Create private subnets for RDS
aws ec2 create-subnet --vpc-id vpc-xxx --cidr-block 10.0.1.0/24
aws ec2 create-subnet --vpc-id vpc-xxx --cidr-block 10.0.2.0/24

# Create security groups
aws ec2 create-security-group \
    --group-name lambda-sg \
    --description "Security group for Lambda functions"

aws ec2 create-security-group \
    --group-name rds-sg \
    --description "Security group for RDS instances"
```

### Secrets Management

**AWS Secrets Manager**:
```bash
# Store database credentials
aws secretsmanager create-secret \
    --name impact-compendium/database \
    --description "Database credentials for Impact Compendium" \
    --secret-string '{
        "username": "admin",
        "password": "your-secure-password",
        "host": "your-rds-endpoint",
        "port": 3306,
        "dbname": "impact_compendium"
    }'
```

**Environment Variable Security**:
```python
# Use AWS Secrets Manager in production
import boto3
import json

def get_database_credentials():
    """Retrieve database credentials from Secrets Manager"""
    client = boto3.client('secretsmanager')
    
    try:
        response = client.get_secret_value(SecretId='impact-compendium/database')
        return json.loads(response['SecretString'])
    except Exception as e:
        logger.error(f"Failed to retrieve database credentials: {e}")
        raise
```

## Performance Optimization

### Lambda Configuration

**Memory and Timeout Optimization**:
```bash
# Update Lambda configuration for optimal performance
aws lambda update-function-configuration \
    --function-name impact-compendium-api \
    --memory-size 512 \
    --timeout 30 \
    --reserved-concurrent-executions 10
```

**Provisioned Concurrency** (for consistent performance):
```bash
aws lambda put-provisioned-concurrency-config \
    --function-name impact-compendium-api \
    --qualifier '$LATEST' \
    --provisioned-concurrency-executions 2
```

### Database Optimization

**RDS Performance Insights**:
```bash
# Enable Performance Insights
aws rds modify-db-instance \
    --db-instance-identifier impact-compendium-db \
    --enable-performance-insights \
    --performance-insights-retention-period 7
```

**Connection Pooling Configuration**:
```python
# Optimized connection pool for Lambda
engine = create_engine(
    database_url,
    poolclass=QueuePool,
    pool_size=2,              # Smaller pool for Lambda
    max_overflow=0,           # No overflow in Lambda
    pool_pre_ping=True,
    pool_recycle=3600,
    echo=False
)
```

## Deployment Automation

### CI/CD Pipeline

**GitHub Actions Workflow**:
```yaml
name: Deploy Impact Compendium API

on:
  push:
    branches: [main]

jobs:
  deploy:
    runs-on: ubuntu-latest
    
    steps:
    - uses: actions/checkout@v2
    
    - name: Set up Python
      uses: actions/setup-python@v2
      with:
        python-version: 3.9
    
    - name: Install dependencies
      run: |
        pip install -r requirements.txt
        pip install awscli
    
    - name: Run tests
      run: pytest tests/
    
    - name: Create deployment package
      run: |
        mkdir deployment
        cp -r app deployment/
        cp requirements.txt deployment/
        cd deployment
        pip install -r requirements.txt -t .
        zip -r ../impact-compendium-api.zip .
    
    - name: Deploy to Lambda
      env:
        AWS_ACCESS_KEY_ID: ${{ secrets.AWS_ACCESS_KEY_ID }}
        AWS_SECRET_ACCESS_KEY: ${{ secrets.AWS_SECRET_ACCESS_KEY }}
      run: |
        aws lambda update-function-code \
          --function-name impact-compendium-api \
          --zip-file fileb://impact-compendium-api.zip
```

### Infrastructure as Code

**AWS CDK Stack** (optional):
```python
from aws_cdk import (
    Stack,
    aws_lambda as _lambda,
    aws_apigateway as apigateway,
    aws_rds as rds,
    aws_ec2 as ec2
)

class ImpactCompendiumStack(Stack):
    def __init__(self, scope, construct_id, **kwargs):
        super().__init__(scope, construct_id, **kwargs)
        
        # VPC
        vpc = ec2.Vpc(self, "ImpactCompendiumVPC")
        
        # RDS
        database = rds.DatabaseInstance(
            self, "ImpactCompendiumDB",
            engine=rds.DatabaseInstanceEngine.mysql(),
            instance_type=ec2.InstanceType.of(
                ec2.InstanceClass.T3,
                ec2.InstanceSize.MICRO
            ),
            vpc=vpc
        )
        
        # Lambda
        api_function = _lambda.Function(
            self, "ImpactCompendiumAPI",
            runtime=_lambda.Runtime.PYTHON_3_9,
            handler="app.main.handler",
            code=_lambda.Code.from_asset("deployment"),
            vpc=vpc
        )
        
        # API Gateway
        api = apigateway.LambdaRestApi(
            self, "ImpactCompendiumAPIGateway",
            handler=api_function
        )
```

## Testing and Validation

### Local Testing

**Run Local Development Server**:
```bash
# Start local development server
uvicorn app.main:app --reload --host 0.0.0.0 --port 8000
```

**Test Database Connection**:
```bash
# Test database connectivity
python -c "
from app.db.connection import db_connection
engine = db_connection.get_engine()
with engine.connect() as conn:
    result = conn.execute('SELECT 1')
    print('Database connection successful')
"
```

### Production Testing

**Health Check**:
```bash
# Test deployed API
curl https://your-api-gateway-url/health
```

**Load Testing**:
```bash
# Use Apache Bench for load testing
ab -n 1000 -c 10 https://your-api-gateway-url/api/studies/
```

## Troubleshooting

### Common Issues

**Lambda Cold Start**:
- Use provisioned concurrency for consistent performance
- Optimize package size to reduce cold start time
- Consider connection pooling strategies

**Database Connection Timeout**:
- Check VPC configuration and security groups
- Verify RDS instance is running and accessible
- Review connection pool settings

**Memory Issues**:
- Monitor Lambda memory usage in CloudWatch
- Increase memory allocation if needed
- Optimize database queries to reduce memory usage

### Debugging

**CloudWatch Logs**:
```bash
# View Lambda logs
aws logs tail /aws/lambda/impact-compendium-api --follow

# Filter error logs
aws logs filter-log-events \
    --log-group-name /aws/lambda/impact-compendium-api \
    --filter-pattern "ERROR"
```

**Database Debugging**:
```python
# Enable SQL query logging for debugging
engine = create_engine(database_url, echo=True)
```

## Cost Optimization

### Lambda Cost Management

- **Right-size Memory**: Use CloudWatch metrics to optimize memory allocation
- **Timeout Optimization**: Set appropriate timeout values
- **Concurrent Execution Limits**: Control maximum concurrent executions

### RDS Cost Management

- **Instance Sizing**: Start with t3.micro and scale as needed
- **Storage Optimization**: Use gp2 storage with appropriate size
- **Backup Retention**: Set reasonable backup retention period

### Monitoring Costs

```bash
# Set up billing alerts
aws budgets create-budget \
    --account-id your-account-id \
    --budget '{
        "BudgetName": "Impact Compendium Monthly Budget",
        "BudgetLimit": {
            "Amount": "100",
            "Unit": "USD"
        },
        "TimeUnit": "MONTHLY",
        "BudgetType": "COST"
    }'
```

## Maintenance and Updates

### Regular Maintenance Tasks

1. **Security Updates**: Keep dependencies updated
2. **Database Maintenance**: Regular backup verification
3. **Performance Monitoring**: Review CloudWatch metrics
4. **Cost Review**: Monthly cost analysis
5. **Log Cleanup**: Manage log retention policies

### Update Procedures

**Application Updates**:
1. Test changes locally
2. Deploy to staging environment
3. Run integration tests
4. Deploy to production
5. Monitor for issues

**Database Updates**:
1. Create Alembic migration
2. Test migration on staging
3. Backup production database
4. Apply migration to production
5. Verify data integrity
