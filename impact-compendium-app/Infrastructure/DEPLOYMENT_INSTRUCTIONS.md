# Deployment Instructions

## Prerequisites

- AWS CLI configured with `IBD-DEV` profile
- SAM CLI installed
- Node.js and npm installed
- Required dependencies: pandas, openpyxl (backend), react-hot-toast (frontend)

## Quick Deployment Commands

### Complete Deployment (Backend + Frontend)

Deploy to **testing** environment (default):
```bash
cd Infrastructure/scripts
./deploy-complete.sh
```

Deploy to **production** environment:
```bash
cd Infrastructure/scripts
./deploy-complete.sh production
```

### Individual Component Deployment

**Backend Only:**
```bash
cd Infrastructure/backend-sam
sam build --profile IBD-DEV
sam deploy --config-env testing --profile IBD-DEV
```

**Frontend Only:**
```bash
cd Infrastructure/scripts
./deploy-frontend.sh
```

## Environment Configuration

### Testing Environment
- **Stack Name**: `impact-compendium-backend-testing`
- **API URL**: `https://jdbnqw4efc.execute-api.us-east-1.amazonaws.com/testing/`
- **Frontend URL**: `https://dt3m7tyug8c1q.cloudfront.net`
- **Lambda Timeout**: 300 seconds (5 minutes)
- **Memory**: 512 MB

### Production Environment
- **Stack Name**: `impact-compendium-backend-production`
- **Requires confirmation**: Yes (manual approval)

## Deployment Process

The `deploy-complete.sh` script performs these steps:

1. **Backend Deployment**
   - SAM build with dependencies
   - Deploy Lambda function and API Gateway
   - Update timeout and memory settings

2. **Frontend Build**
   - Run `npm run build` in Frontend directory
   - Generate optimized production assets

3. **Frontend Deployment**
   - Upload assets to S3 bucket
   - Invalidate CloudFront cache
   - Update distribution

## Recent Updates

### Excel Export Feature
- Added pandas and openpyxl dependencies
- Increased Lambda timeout to 300 seconds
- Added toast notifications with react-hot-toast
- Implemented export state management

### Button Improvements
- Changed "Download Excel" to "Export Full Report"
- Added loading spinner during export
- Disabled button during processing to prevent concurrent requests

## Troubleshooting

### Timeout Issues
- Lambda timeout increased to 300 seconds for Excel generation
- If still timing out, consider implementing async processing

### Build Failures
- Check Node.js version compatibility
- Ensure all dependencies are installed
- Verify file case sensitivity (Card.tsx vs card.tsx)

### Deployment Failures
- Verify AWS profile: `aws sts get-caller-identity --profile IBD-DEV`
- Check SAM CLI version
- Ensure proper permissions for CloudFormation

## Environment Variables Location

Testing environment variables are configured in:
- **SAM Config**: `backend-sam/samconfig.toml`
- **Frontend**: Environment-specific `.env` files
- **CloudFormation**: Parameter overrides in deployment scripts
