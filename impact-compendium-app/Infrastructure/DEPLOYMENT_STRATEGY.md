# Deployment Strategy

## Current Architecture

### **Recommended Approach: SAM-based Deployment**
We are currently using **SAM (Serverless Application Model)** for Lambda deployment, which is the recommended approach.

#### **Active Deployment:**
- **Backend**: `backend-sam/template.yaml` (SAM)
- **Frontend**: S3 + CloudFront (manual deployment)
- **Database**: Existing RDS instance (shared)

#### **Legacy Templates:**
- `cloudformation-testing-environment.yaml` - Complete infrastructure (not currently used)
- `cloudformation-production-environment.yaml` - Production infrastructure (not currently used)

## Environment Configuration

### **Testing Environment (Active)**
```bash
# Deploy backend
cd backend-sam && sam deploy --config-env testing --profile IBD-DEV

# Deploy frontend  
./scripts/deploy-frontend.sh testing
```

**Resources:**
- Stack: `impact-compendium-backend-testing`
- API: `https://jdbnqw4efc.execute-api.us-east-1.amazonaws.com/testing/`
- Frontend: `https://dt3m7tyug8c1q.cloudfront.net`
- Cognito: `us-east-1_yFLIp9zBk`

### **Production Environment (To Be Created)**
```bash
# Deploy backend
cd backend-sam && sam deploy --config-env production --profile IBD-DEV

# Deploy frontend
./scripts/deploy-frontend.sh production
```

**Resources:**
- Stack: `impact-compendium-backend-prod`
- API: `https://api.impact-compendium.com/prod/` (custom domain needed)
- Frontend: Custom domain needed
- Cognito: New production user pool needed

## Deployment Commands

### **Current (SAM-based)**
```bash
# Testing
sam deploy --config-env testing --profile IBD-DEV

# Production  
sam deploy --config-env production --profile IBD-DEV
```

### **Alternative (CloudFormation)**
```bash
# Complete infrastructure deployment
./scripts/deploy-cf.sh testing
./scripts/deploy-cf.sh production
```

## Next Steps for Production

1. **Create Production Cognito User Pool**
2. **Set up Custom Domain for API Gateway**
3. **Configure Production Frontend Domain**
4. **Update Production Environment Variables**
5. **Deploy Production Stack**
