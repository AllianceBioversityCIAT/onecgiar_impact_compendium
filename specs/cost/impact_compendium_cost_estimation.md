# Impact Compendium Database - AWS Cost Estimation

**Document Version:** 1.0  
**Date:** October 21, 2025  
**Author:** AWS Cloud Economist & Cost Optimization Team  
**Project:** CGIAR/Alliance Bioversity & CIAT Impact Compendium  
**Region:** us-east-1 (N. Virginia)  
**Pricing Date:** October 2025

---

## 1. Executive Summary

The **Impact Compendium Database** is designed as a cost-effective, serverless research platform targeting **50-200 monthly active users** with low to moderate traffic patterns. This analysis provides detailed cost estimates for a production-ready AWS architecture optimized for budget constraints while maintaining reliability and performance.

**Target Budget:** Under $100/month  
**Recommended Configuration:** $78/month steady-state cost  
**Architecture:** Serverless (SAM + Lambda + RDS)

---

## 2. Architecture Context

Based on the technical specification, the system includes:
- **Frontend:** React SPA (S3 + CloudFront)
- **Backend:** Python FastAPI (Lambda + API Gateway)
- **Database:** MySQL (RDS db.t3.micro)
- **Authentication:** AWS Cognito
- **Monitoring:** CloudWatch
- **Security:** Secrets Manager, IAM
- **Environments:** Development + Production

**Traffic Assumptions:**
- 100-150 active users/month
- 500-1,000 API requests/day
- 30,000 Lambda invocations/month
- 10GB static content storage
- 5GB monthly data transfer

---

## 3. Detailed Cost Breakdown

### 3.1 Primary Services Cost Analysis

| Service | Resource Configuration | Usage Assumptions | Monthly Cost (USD) | Annual Cost (USD) | % of Total |
|---------|------------------------|-------------------|-------------------|------------------|-----------|
| **RDS MySQL** | db.t3.micro, Single-AZ, 20GB GP2 | 100% uptime, 20GB storage | $15.84 | $190.08 | 20.3% |
| **Lambda** | 10 functions, 256MB, ARM64 | 30K invocations, 2s avg duration | $8.50 | $102.00 | 10.9% |
| **API Gateway (REST)** | 1 API, standard features | 30K requests/month | $10.50 | $126.00 | 13.5% |
| **S3 Standard** | Static hosting + attachments | 10GB storage, 5GB egress | $3.25 | $39.00 | 4.2% |
| **CloudFront** | CDN distribution | 10GB data transfer, 100K requests | $8.50 | $102.00 | 10.9% |
| **Cognito** | User Pool + App Client | 150 MAU (within free tier) | $0.00 | $0.00 | 0.0% |
| **CloudWatch** | Logs + Metrics + Alarms | 5GB logs, 50 metrics, 10 alarms | $12.75 | $153.00 | 16.4% |
| **Secrets Manager** | Database credentials | 5 secrets, 1K API calls | $2.50 | $30.00 | 3.2% |
| **Route 53** | DNS hosting | 1 hosted zone, 1M queries | $6.50 | $78.00 | 8.3% |
| **RDS Snapshots** | Automated backups | 20GB × 7 days retention | $1.40 | $16.80 | 1.8% |
| **Data Transfer** | Inter-service communication | 2GB/month | $1.80 | $21.60 | 2.3% |
| **CloudFormation** | Stack management | 2 stacks, standard operations | $0.00 | $0.00 | 0.0% |
| **IAM** | Roles and policies | Standard usage | $0.00 | $0.00 | 0.0% |
| **SSM Parameter Store** | Configuration parameters | 15 standard parameters | $0.00 | $0.00 | 0.0% |

### 3.2 Cost Summary

| **Total Monthly Cost** | **$71.54** |
|------------------------|------------|
| **Total Annual Cost** | **$858.48** |
| **Daily Average Cost** | **$2.35** |

### 3.3 Cost Distribution

| Service Category | Monthly Cost | Percentage |
|------------------|--------------|------------|
| **Compute (Lambda + API Gateway)** | $19.00 | 26.6% |
| **Database (RDS + Backups)** | $17.24 | 24.1% |
| **Content Delivery (S3 + CloudFront)** | $11.75 | 16.4% |
| **Monitoring (CloudWatch)** | $12.75 | 17.8% |
| **Networking (Route 53 + Data Transfer)** | $8.30 | 11.6% |
| **Security (Secrets Manager)** | $2.50 | 3.5% |

---

## 4. Cost Optimization Recommendations

### 4.1 Immediate Optimizations (0-30 days)

| Optimization Area | Strategy | Implementation | Potential Monthly Savings | Effort Level |
|-------------------|----------|----------------|---------------------------|--------------|
| **API Gateway** | Switch to HTTP API | Replace REST API with HTTP API | $6.30 (60% reduction) | Low |
| **Lambda Architecture** | Use ARM64 Graviton2 | Update SAM template | $1.70 (20% reduction) | Low |
| **CloudWatch Logs** | Reduce retention to 14 days | Update log group settings | $4.25 (33% reduction) | Low |
| **RDS Storage** | Use GP3 instead of GP2 | Modify RDS instance | $0.80 (5% reduction) | Low |
| **S3 Storage Class** | Use Intelligent Tiering | Enable on S3 bucket | $0.65 (20% reduction) | Low |

**Total Immediate Savings: $13.70/month (19% reduction)**

### 4.2 Medium-term Optimizations (1-3 months)

| Optimization Area | Strategy | Implementation | Potential Monthly Savings | Effort Level |
|-------------------|----------|----------------|---------------------------|--------------|
| **RDS Scheduling** | Auto-stop during off-hours | Implement Lambda scheduler | $7.92 (50% reduction) | Medium |
| **Lambda Provisioned Concurrency** | Remove if not needed | Review and optimize | $2.00 | Medium |
| **CloudFront Caching** | Optimize cache policies | Increase TTL, compress content | $2.55 (30% reduction) | Medium |
| **Reserved Capacity** | RDS Reserved Instance (1-year) | Purchase RI for production | $4.75 (30% reduction) | Medium |

**Total Medium-term Savings: $17.22/month (24% reduction)**

### 4.3 Advanced Optimizations (3-6 months)

| Optimization Area | Strategy | Implementation | Potential Monthly Savings | Effort Level |
|-------------------|----------|----------------|---------------------------|--------------|
| **Database Optimization** | Aurora Serverless v2 | Migrate from RDS MySQL | $8.00-12.00 | High |
| **Multi-region Strategy** | Consolidate to single region | Remove dev environment | $25.00 (35% reduction) | High |
| **Container Migration** | Lambda → Fargate Spot | For long-running processes | $3.00-5.00 | High |

---

## 5. Scenario Comparison

### 5.1 Cost Scenarios

| Scenario | Configuration | Monthly Cost | Annual Cost | Use Case |
|----------|---------------|--------------|-------------|----------|
| **Minimal Dev** | Single environment, db.t3.micro with auto-stop, basic monitoring | $35.50 | $426.00 | Development/testing only |
| **Production Ready** | Dual environment, optimized configuration, full monitoring | $57.84 | $694.08 | Recommended production setup |
| **High Availability** | Multi-AZ RDS, enhanced monitoring, reserved instances | $89.25 | $1,071.00 | Enterprise-grade reliability |
| **Scale-up (5x users)** | Larger RDS instance, increased Lambda memory, CDN optimization | $145.75 | $1,749.00 | 500+ monthly active users |

### 5.2 Growth Projection

| User Range | Monthly Cost | Key Scaling Factors |
|------------|--------------|-------------------|
| **50-100 users** | $45-60 | Lambda invocations, API Gateway requests |
| **100-200 users** | $60-80 | RDS connections, CloudWatch logs |
| **200-500 users** | $80-120 | Database instance size, data transfer |
| **500+ users** | $120-200 | Multi-AZ RDS, reserved capacity needed |

---

## 6. Implementation Roadmap

### Phase 1: Foundation (Month 1)
- **Budget:** $71.54/month
- **Focus:** Deploy basic architecture with cost monitoring
- **Key Actions:**
  - Implement CloudWatch billing alarms
  - Set up cost allocation tags
  - Deploy with HTTP API instead of REST API

### Phase 2: Optimization (Month 2-3)
- **Budget:** $57.84/month (19% reduction)
- **Focus:** Implement immediate optimizations
- **Key Actions:**
  - Switch to ARM64 Lambda functions
  - Optimize CloudWatch log retention
  - Implement RDS auto-stop for development

### Phase 3: Advanced Tuning (Month 4-6)
- **Budget:** $45-55/month (25-35% reduction)
- **Focus:** Advanced cost optimizations
- **Key Actions:**
  - Consider Aurora Serverless v2 migration
  - Implement reserved instance strategy
  - Optimize data transfer patterns

---

## 7. Cost Monitoring & Governance

### 7.1 Budget Alerts
```yaml
Budget Thresholds:
  - Warning: $60/month (85% of target)
  - Critical: $70/month (100% of target)
  - Emergency: $85/month (120% of target)
```

### 7.2 Key Metrics to Monitor
- **Lambda Duration:** Target <2s average
- **RDS CPU Utilization:** Target <70%
- **API Gateway Request Count:** Monitor for unexpected spikes
- **Data Transfer Costs:** Track egress charges
- **Storage Growth:** Monitor S3 and RDS storage trends

### 7.3 Monthly Review Checklist
- [ ] Review AWS Cost Explorer dashboard
- [ ] Analyze top 5 cost drivers
- [ ] Check for unused resources
- [ ] Validate auto-scaling policies
- [ ] Review and optimize CloudWatch log retention

---

## 8. Risk Assessment

### 8.1 Cost Risks

| Risk | Probability | Impact | Mitigation |
|------|-------------|--------|------------|
| **Unexpected traffic spikes** | Medium | High | Implement API throttling, CloudWatch alarms |
| **Database connection leaks** | Low | High | Connection pooling, monitoring |
| **Log volume explosion** | Medium | Medium | Log level optimization, retention policies |
| **Data transfer overages** | Low | Medium | CloudFront optimization, compression |

### 8.2 Technical Debt Considerations
- **RDS Single-AZ:** Acceptable for research platform, but consider Multi-AZ for production
- **No Reserved Instances:** Suitable for variable workloads, evaluate after 6 months
- **Basic Monitoring:** Sufficient for current scale, enhance as system grows

---

## 9. Conclusion & Recommendations

### 9.1 Optimal Configuration
**Recommended Setup:** Production-ready configuration at **$57.84/month** after immediate optimizations.

**Key Benefits:**
- 19% cost reduction from baseline through immediate optimizations
- Scalable architecture supporting 200+ users
- Comprehensive monitoring and security
- Room for growth without architectural changes

### 9.2 Budget Achievement
✅ **Target Met:** Under $100/month budget achieved  
✅ **Optimized Cost:** $57.84/month steady-state  
✅ **Growth Headroom:** Can scale to 500 users within $120/month  

### 9.3 Final Recommendations

1. **Start with optimized configuration** ($57.84/month) rather than baseline
2. **Implement cost monitoring** from day one with CloudWatch billing alarms
3. **Review costs monthly** and optimize based on actual usage patterns
4. **Plan for reserved instances** after 6 months of stable usage
5. **Consider Aurora Serverless v2** migration when user base exceeds 300 MAU

### 9.4 Success Metrics
- **Cost Efficiency:** <$0.30 per monthly active user
- **Performance:** <2s API response time at 95th percentile
- **Availability:** >99.5% uptime for production environment
- **Scalability:** Support 3x user growth without architecture changes

---

**Next Steps:**
1. Implement Phase 1 deployment with cost monitoring
2. Schedule monthly cost review meetings
3. Set up automated cost optimization recommendations
4. Plan Phase 2 optimizations for month 2-3 implementation

**Document Status:** Final  
**Next Review Date:** November 21, 2025  
**Approval Required:** Finance Team, Technical Architecture Board
