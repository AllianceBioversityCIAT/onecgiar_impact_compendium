# Impact Compendium Backend Deployment Strategy

## Overview

This document outlines the deployment strategy for the Impact Compendium FastAPI backend using AWS SAM (Serverless Application Model) for the testing environment.

## Architecture Analysis

### Current Backend Structure
```
Backend/
├── app/
│   ├── main.py              # FastAPI application with all routes
│   ├── routers/             # API route modules
│   │   ├── auth.py          # Authentication endpoints
│   │   ├── studies.py       # Studies CRUD operations
│   │   ├── indicators.py    # Indicators management
│   │   ├── admin.py         # Administrative functions
│   │   ├── reports.py       # Reporting and analytics
│   │   ├── users.py         # User management (Cognito)
│   │   ├── clarisa.py       # CLARISA reference data
│   │   ├── reference.py     # Reference data endpoints
│   │   └── study_relations.py # Study relationships
│   ├── models/              # SQLAlchemy ORM models
│   ├── schemas/             # Pydantic schemas
│   ├── services/            # Business logic services
│   ├── utils/               # Utility functions
│   ├── middleware/          # Custom middleware
│   ├── config/              # Configuration management
│   └── db/                  # Database connection
├── main.py                  # Lambda handler (Mangum adapter)
├── requirements.txt         # Python dependencies
└── .env                     # Environment variables
```

### Key Features Implemented
1. **API Routes**: 40+ endpoints covering all business logic
2. **Database Integration**: MySQL RDS with SQLAlchemy ORM
3. **Authentication**: AWS Cognito integration
4. **Documentation**: Swagger UI at `/docs`
5. **CORS**: Configured for cross-origin requests
6. **Error Handling**: Comprehensive exception handling
7. **Logging**: Structured logging for monitoring

## Deployment Strategy

### 1. Infrastructure Dependencies

The backend depends on existing infrastructure deployed via CloudFormation:

**Required Resources:**
- ✅ VPC with private subnets
- ✅ RDS MySQL database (`impact-compendium-db-testing`)
- ✅ Cognito User Pool (`us-east-1_yFLIp9zBk`)
- ✅ Security Groups for Lambda-RDS communication
- ✅ Secrets Manager for database credentials

**Available Exports:**
- `impact-compendium-testing-db-endpoint`
- `impact-compendium-testing-cognito-pool-id`
- `impact-compendium-testing-cognito-client-id`

### 2. SAM Deployment Approach

**Benefits of SAM:**
- Simplified Lambda deployment
- Built-in API Gateway integration
- Environment-specific configurations
- Easy rollback capabilities
- Local testing support

**Template Structure:**
```yaml
# template.yaml
- API Gateway with CORS configuration
- Lambda function with VPC configuration
- IAM roles and policies
- Environment variables from existing infrastructure
```

### 3. Deployment Process

#### Prerequisites
```bash
# Install SAM CLI
pip install aws-sam-cli

# Configure AWS profile
aws configure --profile IBD-DEV
```

#### Deployment Steps
```bash
cd Infrastructure/backend-sam/

# 1. Build the application
sam build --profile IBD-DEV

# 2. Deploy to testing environment
./deploy-backend.sh

# 3. Test the deployment
curl https://{api-id}.execute-api.us-east-1.amazonaws.com/testing/health
```

### 4. Environment Configuration

#### Lambda Environment Variables
```yaml
ENVIRONMENT: testing
DB_HOST: impact-compendium-db-testing.caillnmrvhaw.us-east-1.rds.amazonaws.com
DB_NAME: impact_compendium
DB_USER: admin
DB_PASSWORD: "{{resolve:secretsmanager:impact-compendium/testing/db-password}}"
DB_PORT: "3306"
COGNITO_USER_POOL_ID: us-east-1_yFLIp9zBk
COGNITO_CLIENT_ID: 2dcfk6il6d3h87qvob771t84b5
COGNITO_REGION: us-east-1
```

#### VPC Configuration
```yaml
VpcConfig:
  SecurityGroupIds:
    - sg-{lambda-security-group}  # Allows outbound to RDS
  SubnetIds:
    - subnet-{private-1}          # Private subnet 1
    - subnet-{private-2}          # Private subnet 2
```

### 5. API Gateway Configuration

#### CORS Settings
```yaml
Cors:
  AllowMethods: "'GET,POST,PUT,DELETE,OPTIONS'"
  AllowHeaders: "'Content-Type,Authorization,X-Api-Key'"
  AllowOrigin: "'*'"
  AllowCredentials: true
```

#### Routes
- `/{proxy+}` - All API routes
- `/` - Root endpoint
- `/docs` - Swagger UI
- `/openapi.json` - OpenAPI specification

### 6. Security Configuration

#### IAM Policies
```yaml
Policies:
  - VPCAccessPolicy: {}           # VPC access for Lambda
  - CognitoAccess:               # Cognito operations
      - cognito-idp:*
  - SecretsManagerAccess:        # Database password retrieval
      - secretsmanager:GetSecretValue
```

#### Database Security
- RDS in private subnets only
- Security group restricts access to Lambda SG
- Database credentials in Secrets Manager
- SSL/TLS encryption in transit

### 7. Monitoring and Logging

#### CloudWatch Integration
- Lambda function logs: `/aws/lambda/impact-compendium-backend-api-testing`
- API Gateway logs: Enabled for debugging
- Custom metrics for business logic

#### Health Checks
- `/health` - Database connectivity check
- `/api/auth/status` - Cognito service status
- `/api/reference/categories` - Basic API functionality

### 8. Testing Strategy

#### Automated Tests
```bash
# Unit tests
cd Backend/
python -m pytest tests/

# Integration tests
curl https://{api-url}/health
curl https://{api-url}/api/reference/categories
curl https://{api-url}/docs
```

#### Manual Testing Checklist
- [ ] Health endpoint returns "connected"
- [ ] Swagger UI loads without errors
- [ ] Reference data endpoints work
- [ ] Database queries execute successfully
- [ ] CORS headers present in responses
- [ ] Authentication endpoints respond correctly

### 9. Rollback Strategy

#### SAM Rollback
```bash
# Rollback to previous version
aws cloudformation cancel-update-stack \
    --stack-name impact-compendium-backend-testing \
    --profile IBD-DEV

# Or delete and redeploy
sam delete --profile IBD-DEV
```

#### Database Rollback
- Database schema changes require manual rollback
- Use RDS snapshots for data recovery
- Test schema changes in development first

### 10. Production Considerations

#### Scaling Configuration
```yaml
# For production deployment
MemorySize: 1024              # Increased memory
Timeout: 60                   # Longer timeout
ReservedConcurrency: 100      # Limit concurrent executions
```

#### Security Enhancements
- API Gateway authentication
- WAF integration
- VPC endpoints for AWS services
- Enhanced monitoring and alerting

## Deployment Commands

### Quick Deployment
```bash
cd Infrastructure/backend-sam/
./deploy-backend.sh
```

### Manual Deployment
```bash
# Build
sam build --profile IBD-DEV

# Deploy with parameters
sam deploy \
    --config-env testing \
    --profile IBD-DEV \
    --parameter-overrides \
        Environment=testing \
        ProjectName=impact-compendium
```

### Local Testing
```bash
# Start local API
sam local start-api --profile IBD-DEV

# Test locally
curl http://localhost:3000/health
```

## Troubleshooting

### Common Issues

1. **VPC Configuration Errors**
   - Verify security group allows Lambda → RDS communication
   - Check subnet routing to NAT Gateway for internet access

2. **Database Connection Issues**
   - Verify Secrets Manager permissions
   - Check RDS security group inbound rules
   - Validate database endpoint and credentials

3. **CORS Issues**
   - Verify API Gateway CORS configuration
   - Check FastAPI CORS middleware settings
   - Test with browser developer tools

4. **Import Errors**
   - Ensure all dependencies in requirements.txt
   - Check Python path and module imports
   - Verify Lambda layer compatibility

### Debugging Commands
```bash
# Check Lambda logs
sam logs --name ImpactCompendiumFunction --profile IBD-DEV

# Describe stack
aws cloudformation describe-stacks \
    --stack-name impact-compendium-backend-testing \
    --profile IBD-DEV

# Test API Gateway
aws apigateway test-invoke-method \
    --rest-api-id {api-id} \
    --resource-id {resource-id} \
    --http-method GET \
    --profile IBD-DEV
```

## Next Steps

1. **Deploy to Testing**: Execute deployment script
2. **Validate Functionality**: Run comprehensive tests
3. **Monitor Performance**: Set up CloudWatch dashboards
4. **Document APIs**: Update Swagger documentation
5. **Prepare Production**: Adapt configuration for prod environment
