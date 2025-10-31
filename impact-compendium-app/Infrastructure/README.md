# Impact Compendium Infrastructure

**Deployment Method:** Pure CloudFormation  
**Profile:** IBD-DEV  
**Region:** us-east-1

## Quick Start

### Deploy Testing Environment
```bash
./scripts/deploy-cf.sh
```

### Delete Testing Environment
```bash
./scripts/delete-cf.sh impact-compendium-testing
```

## Files

- `cloudformation-complete.yaml` - Complete infrastructure template
- `scripts/deploy-cf.sh` - Deployment script
- `scripts/delete-cf.sh` - Cleanup script

## Current Deployment

**Stack:** `impact-compendium-testing`  
**Status:** ✅ DEPLOYED  
**Database:** ✅ RESTORED (22 tables)

### Endpoints
- **API:** `https://plquqwcug2.execute-api.us-east-1.amazonaws.com/testing`
- **Database:** `impact-compendium-db-testing.caillnmrvhaw.us-east-1.rds.amazonaws.com`

### Resources
- Lambda Function: `impact-compendium-backend-testing`
- S3 Bucket: `impact-compendium-frontend-testing-569113802249`
- RDS MySQL: `impact-compendium-db-testing`
- Cognito User Pool: Auto-generated
- CloudFront Distribution: Auto-generated
