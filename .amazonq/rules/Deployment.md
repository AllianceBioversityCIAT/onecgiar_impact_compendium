# Deployment Rules

## AWS Profile

- **Always use profile**: `IBD-DEV`
- **Always use region**: `us-east-1` (North Virginia)

## Naming Conventions

### Base Component Names (NEVER CHANGE)
- **S3 Bucket**: `impact-compendium-storage`
- **RDS Instance**: `impact-compendium-db`
- **Lambda Functions**: `impact-compendium-api`, `impact-compendium-auth`
- **API Gateway**: `impact-compendium-api`
- **CloudFront Distribution**: `impact-compendium-cdn`
- **Cognito User Pool**: `impact-compendium-users`
- **CloudWatch Log Groups**: `impact-compendium-logs`

### Environment Suffixes (ONLY CHANGE THIS)
- **Development**: `-dev`
- **Staging**: `-staging`
- **Production**: `-prod`

### Final Resource Names
```
Development: impact-compendium-storage-dev
Staging: impact-compendium-storage-staging
Production: impact-compendium-storage-prod
```

## Required Tags (ALL RESOURCES)

### Cost Tracking Tags
```yaml
Project: "impact-compendium"
Environment: "dev|staging|prod"
Owner: "cgiar-alliance"
CostCenter: "research-platform"
BudgetCategory: "infrastructure"
CreatedBy: "sam-deployment"
CreatedDate: "YYYY-MM-DD"
```

### Operational Tags
```yaml
Application: "impact-compendium"
Component: "frontend|backend|database|cdn"
Maintenance: "auto|manual"
Backup: "enabled|disabled"
Monitoring: "enabled"
```

## Resource Reuse Rules

### DO NOT CREATE NEW INSTANCES
- **One S3 bucket per environment** (not per feature)
- **One RDS instance per environment** (use databases, not instances)
- **One API Gateway per environment** (use resources/methods)
- **One CloudFront distribution per environment**
- **One Cognito User Pool per environment**

### Environment Isolation
- Use **database schemas** instead of new RDS instances
- Use **S3 prefixes** instead of new buckets
- Use **API Gateway stages** instead of new APIs
- Use **Lambda aliases** instead of new functions

## Cost Control

### Budget Limits
- **Development**: $35/month
- **Staging**: $25/month  
- **Production**: $70/month

### Auto-Stop Rules
- **Development RDS**: Auto-stop after 2 hours of inactivity
- **Staging RDS**: Auto-stop weekends
- **Production RDS**: Always running

### Resource Limits
```yaml
Lambda:
  memory: 256MB (max 512MB for prod)
  timeout: 30s (max 60s for prod)
  
RDS:
  instance_class: db.t3.micro (dev/staging)
  instance_class: db.t3.small (prod only if needed)
  storage: 20GB (max 50GB)
  
S3:
  storage_class: Standard-IA (after 30 days)
  lifecycle: Delete after 365 days (non-prod)
```