# Impact Compendium Deployment Guide

## Prerequisites
- AWS CLI configured with `IBD-DEV` profile
- Backend Lambda package built and uploaded to S3
- Frontend built (`npm run build` in Frontend directory)

## Quick Deployment

### Testing Environment
```bash
# Deploy infrastructure
./scripts/deploy-cf.sh testing

# Deploy frontend
./scripts/deploy-frontend.sh testing
```

### Production Environment
```bash
# Deploy infrastructure (with confirmation prompt)
./scripts/deploy-cf.sh production

# Deploy frontend (with confirmation prompt)  
./scripts/deploy-frontend.sh production
```

## Manual Steps

### 1. Build and Upload Backend
```bash
cd Backend
zip -r lambda-complete.zip . -x "*.git*" "*__pycache__*" "*.pyc" "tests/*" ".venv/*"
aws s3 cp lambda-complete.zip s3://impact-compendium-sam-deploy-1761858516/ --profile IBD-DEV
```

### 2. Build Frontend
```bash
cd Frontend
npm run build
```

### 3. Deploy Infrastructure
```bash
cd Infrastructure
./scripts/deploy-cf.sh [testing|production]
```

### 4. Deploy Frontend
```bash
cd Infrastructure  
./scripts/deploy-frontend.sh [testing|production]
```

## Environment Outputs

After deployment, get environment details:
```bash
aws cloudformation describe-stacks \
    --stack-name impact-compendium-[testing|production] \
    --profile IBD-DEV \
    --region us-east-1 \
    --query 'Stacks[0].Outputs' \
    --output table
```

## Cleanup

Delete environment:
```bash
./scripts/delete-cf.sh impact-compendium-[testing|production]
```
