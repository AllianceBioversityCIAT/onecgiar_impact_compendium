# Impact Compendium Infrastructure

**Deployment Method:** CloudFormation  
**Profile:** IBD-DEV  
**Region:** us-east-1

## Quick Deployment

### Testing Environment
```bash
./scripts/deploy-cf.sh testing
./scripts/deploy-frontend.sh testing
```

### Production Environment
```bash
./scripts/deploy-cf.sh production
./scripts/deploy-frontend.sh production
```

## Files

### Essential Files
- `cloudformation-complete.yaml` - Complete infrastructure template
- `DEPLOYMENT.md` - Detailed deployment guide

### Scripts
- `deploy-cf.sh` - Deploy infrastructure (testing/production)
- `deploy-frontend.sh` - Deploy frontend (testing/production)
- `delete-cf.sh` - Delete CloudFormation stack
- `troubleshoot.sh` - Troubleshooting utilities

## Current Deployment

**Stack:** `impact-compendium-testing`  
**Frontend:** https://dt3m7tyug8c1q.cloudfront.net  
**API:** https://c554ivnf2j.execute-api.us-east-1.amazonaws.com/testing
