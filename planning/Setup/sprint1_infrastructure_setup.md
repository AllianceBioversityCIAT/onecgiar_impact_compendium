# Sprint 1: Infrastructure Setup & Environments

## Sprint Goal
Establish AWS infrastructure foundation with SAM templates, CI/CD pipeline, and development/production environments for the Impact Compendium Application.

## Duration
**2 weeks** (10 working days)

## Deliverables
- AWS SAM project structure with CloudFormation templates
- CI/CD pipeline (GitHub Actions → AWS deployment)
- Development and Production environments
- Infrastructure documentation and deployment guides
- Cost monitoring and budget alerts setup
- Security baseline (IAM roles, policies, secrets management)

## Tasks / Activities

### Infrastructure Foundation
1. **Initialize AWS SAM Project Structure**
   - Create `template.yaml` with core resources (API Gateway, Lambda placeholders, RDS, Cognito)
   - Configure `samconfig.toml` for dev/prod environments
   - Set up project directory structure following SAM best practices

2. **Configure AWS Environments**
   - Set up AWS profiles for IBD-DEV account
   - Create CloudFormation stacks for dev and prod environments
   - Configure VPC, subnets, security groups for RDS access

3. **Implement CI/CD Pipeline**
   - Create GitHub Actions workflow for automated deployment
   - Configure SAM build and deploy stages
   - Set up environment-specific parameter overrides

### Security & Monitoring Setup
4. **Security Baseline Implementation**
   - Create IAM roles and policies following least privilege principle
   - Set up AWS Secrets Manager for database credentials
   - Configure SSM Parameter Store for application configuration

5. **Cost Monitoring & Governance**
   - Implement CloudWatch billing alarms ($60, $70, $85 thresholds)
   - Set up cost allocation tags for all resources
   - Create budget monitoring dashboard

6. **Database Infrastructure**
   - Deploy RDS MySQL instance (db.t3.micro) with encryption
   - Configure automated backups and maintenance windows
   - Set up database subnet groups and security groups

### Documentation & Validation
7. **Infrastructure Documentation**
   - Create deployment runbooks and troubleshooting guides
   - Document environment-specific configurations
   - Generate architecture diagrams using existing specs

8. **Environment Validation**
   - Deploy and test infrastructure in dev environment
   - Validate connectivity between all components
   - Perform basic smoke tests on deployed resources

9. **Monitoring & Observability Setup**
   - Configure CloudWatch log groups for Lambda functions
   - Set up basic metrics and alarms for RDS and API Gateway
   - Implement X-Ray tracing for distributed debugging

10. **Security Scanning & Compliance**
    - Run AWS Config rules for compliance checking
    - Implement CloudTrail for audit logging
    - Validate security group configurations and access patterns

## Dependencies
- AWS account access with appropriate permissions (IBD-DEV profile)
- GitHub repository setup for source control
- Domain name registration (if custom domain required)
- Technical specification document (completed)

## Responsible Roles
- **DevOps Engineer** (Lead): Infrastructure setup, CI/CD pipeline
- **Backend Developer**: SAM template configuration, Lambda structure
- **Security Engineer**: IAM policies, secrets management, compliance
- **Technical Architect**: Architecture validation, documentation review

## Tools & MCPs Used
- **aws-serverless-mcp-server**: SAM project initialization and deployment
- **awslabs.cdk-mcp-server**: Infrastructure as Code guidance and best practices
- **awslabs.cost-explorer-mcp-server**: Cost monitoring setup and budget configuration
- **AWS CLI**: Direct AWS service configuration and validation

## Definition of Done (DoD)
- [ ] SAM template successfully deploys to dev environment without errors
- [ ] CI/CD pipeline automatically deploys changes on git push to main branch
- [ ] RDS MySQL instance is accessible from Lambda functions in private subnet
- [ ] All resources are properly tagged for cost allocation
- [ ] CloudWatch billing alarms are configured and tested
- [ ] Security scan passes with no critical vulnerabilities
- [ ] Infrastructure documentation is complete and reviewed
- [ ] Smoke tests pass in both dev and prod environments
- [ ] Cost monitoring dashboard shows expected baseline costs (<$35/month for dev)
- [ ] All secrets are stored in AWS Secrets Manager (no hardcoded credentials)

## Success Metrics
- Infrastructure deployment time: <30 minutes for full stack
- Zero manual configuration steps required after initial setup
- All automated tests pass in CI/CD pipeline
- Cost baseline established and monitored
- Security compliance score >95%

## Next Sprint Preview
**Sprint 2** will focus on frontend design integration, retrieving the Figma mockups using the figma-mcp server, and establishing the React application foundation with proper component structure, routing, and theming based on the Impact Compendium design system.
