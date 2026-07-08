# Security Guidelines

## Environment Variables and Secrets Management

### ✅ DO
- Use environment variables for all sensitive configuration
- Use AWS Secrets Manager or AWS Systems Manager Parameter Store for production secrets
- Copy `.env.example` files to `.env` and configure with actual values
- Use strong, randomly generated passwords
- Rotate credentials regularly

### ❌ DON'T
- Never commit `.env` files with real credentials
- Never hardcode passwords, API keys, or tokens in source code
- Never use default or weak passwords
- Never expose sensitive data in logs or error messages

## Database Security

### Current Configuration
- Database credentials are now environment-based
- Production should use AWS Secrets Manager
- Connection strings should never be hardcoded

### Recommendations
```bash
# Use AWS Secrets Manager for production
aws secretsmanager create-secret \
  --name "impact-compendium/db-credentials" \
  --description "Database credentials for Impact Compendium" \
  --secret-string '{"username":"admin","password":"your-secure-password"}'
```

## Authentication Security

### Password Generation
- Passwords are now generated using secure random methods
- Minimum 16 characters with mixed case, numbers, and symbols
- Users should be notified through secure channels about password changes

### Token Management
- JWT tokens are stored securely in localStorage
- Tokens should have appropriate expiration times
- Consider implementing token refresh mechanisms

## AWS Security

### IAM Best Practices
- Use least privilege principle
- Create specific IAM roles for each service
- Enable MFA for all AWS accounts
- Regularly audit IAM permissions

### Cognito Security
- User Pool IDs and Client IDs are not secrets but should be environment-specific
- Enable MFA for user accounts
- Configure appropriate password policies

## File Security

### Protected Files
The following files contain sensitive information and are protected by .gitignore:
- `.env` files
- AWS credentials
- Database connection strings
- Private keys and certificates

### Safe Files
These files are safe to commit:
- `.env.example` files (templates only)
- Configuration templates
- Public configuration

## Monitoring and Logging

### Security Logging
- Log authentication attempts
- Monitor for suspicious activity
- Never log sensitive data (passwords, tokens, etc.)

### Error Handling
- Sanitize error messages before displaying to users
- Log detailed errors server-side only
- Implement proper error boundaries

## Deployment Security

### Environment Separation
- Use different credentials for dev/staging/production
- Implement proper CI/CD security practices
- Use infrastructure as code (SAM/CDK) for consistent deployments

### Network Security
- Use VPC for database isolation
- Implement proper security groups
- Enable encryption in transit and at rest

## Incident Response

### If Credentials Are Compromised
1. Immediately rotate all affected credentials
2. Review access logs for unauthorized activity
3. Update all applications with new credentials
4. Document the incident and lessons learned

### Reporting Security Issues
- Report security vulnerabilities to the development team
- Do not disclose security issues publicly
- Follow responsible disclosure practices
