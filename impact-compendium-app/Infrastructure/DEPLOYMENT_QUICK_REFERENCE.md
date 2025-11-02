# Impact Compendium - Deployment Quick Reference

## 🚀 Essential Commands

### Check Status
```bash
cd Infrastructure/
./scripts/check-status.sh testing
```

### Deploy Everything (Safe to run multiple times)
```bash
./scripts/deploy-complete.sh testing
```

### Update Frontend Only
```bash
./scripts/deploy-frontend.sh testing
```

### Clean Up Everything
```bash
./scripts/delete-complete.sh testing
```

## 📋 Deployment Flow

```
1. check-status.sh     → See what's deployed
2. deploy-complete.sh  → Deploy missing components
3. deploy-frontend.sh  → Quick frontend updates
4. delete-complete.sh  → Clean up when done
```

## 🏗️ Architecture

### Two-Stack System
- **Infrastructure**: `impact-compendium-infra-testing`
  - VPC, RDS, Cognito, S3, CloudFront
- **Backend**: `impact-compendium-backend-testing`
  - Lambda, API Gateway

### Smart Deployment
- ✅ **Checks existing resources** before creating
- ✅ **Updates instead of duplicating**
- ✅ **Uses CloudFormation exports** (no hardcoded IDs)
- ✅ **Idempotent operations** (safe to re-run)

## 🔗 Key URLs After Deployment

```bash
# API Endpoint
https://{api-id}.execute-api.us-east-1.amazonaws.com/testing/

# API Documentation  
https://{api-id}.execute-api.us-east-1.amazonaws.com/testing/docs

# Frontend Application
https://{cloudfront-id}.cloudfront.net
```

## 🛠️ Troubleshooting

### Infrastructure Issues
```bash
# Check CloudFormation stacks
aws cloudformation list-stacks --profile IBD-DEV --region us-east-1

# View stack events
aws cloudformation describe-stack-events \
  --stack-name impact-compendium-infra-testing \
  --profile IBD-DEV --region us-east-1
```

### Backend Issues
```bash
# Check Lambda logs
sam logs --name ImpactCompendiumFunction --profile IBD-DEV --tail

# Test API health
curl https://your-api-url/health
```

### Frontend Issues
```bash
# Check S3 bucket contents
aws s3 ls s3://impact-compendium-frontend-testing-{account-id} --profile IBD-DEV

# Rebuild and redeploy
cd Frontend/
npm run build
cd ../Infrastructure/
./scripts/deploy-frontend.sh testing
```

## 📁 File Structure

```
Infrastructure/
├── cloudformation-infrastructure-only.yaml  # Infrastructure template
├── backend-sam/template.yaml               # Backend SAM template
├── scripts/
│   ├── deploy-complete.sh                  # 🚀 Main deployment
│   ├── check-status.sh                     # 📊 Status checker  
│   ├── deploy-frontend.sh                  # 🌐 Frontend updater
│   └── delete-complete.sh                  # 🗑️ Cleanup
└── DEPLOYMENT_GUIDE.md                     # 📖 Full documentation
```

## ⚡ Development Workflow

### First Time Setup
```bash
./scripts/deploy-complete.sh testing
```

### Daily Development
```bash
# Frontend changes
./scripts/deploy-frontend.sh testing

# Backend changes  
cd backend-sam/
sam build --profile IBD-DEV
sam deploy --config-env testing --profile IBD-DEV

# Check everything
../scripts/check-status.sh testing
```

### End of Day
```bash
# Optional: Clean up to save costs
./scripts/delete-complete.sh testing
```

## 💰 Cost Management

### Testing Environment: ~$35/month
- RDS db.t3.micro: ~$15/month
- Lambda: ~$5/month  
- S3 + CloudFront: ~$10/month
- Other services: ~$5/month

### Cost Optimization
- **Auto-stop RDS**: After 2 hours inactivity
- **Delete when not needed**: Use cleanup script
- **Monitor usage**: Check AWS Cost Explorer

## 🔒 Security Notes

### Required AWS Profile
- **Always use**: `--profile IBD-DEV`
- **Region**: `us-east-1`
- **Verify**: `aws sts get-caller-identity --profile IBD-DEV`

### Resource Naming
- **Base**: `impact-compendium`
- **Environment suffix**: `-testing` or `-prod`
- **Account ID suffix**: For S3 buckets only

## 📞 Support

### Common Solutions
1. **"Stack already exists"** → Use `check-status.sh` first
2. **"Import not found"** → Redeploy infrastructure stack
3. **"Build failed"** → Check Python dependencies in Backend/
4. **"Frontend 404"** → Run `deploy-frontend.sh` again

### Emergency Reset
```bash
# Nuclear option: Delete everything and start fresh
./scripts/delete-complete.sh testing
# Wait 5 minutes for complete deletion
./scripts/deploy-complete.sh testing
```
