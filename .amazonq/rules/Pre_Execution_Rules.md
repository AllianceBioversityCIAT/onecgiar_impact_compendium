# Amazon Q Pre-Execution Rules
**Impact Compendium Application Sprint Automation**

## 📛 RULE 1 – PROJECT CONTEXT VALIDATION
**Name:** ContextGuard

### Requirements:
- ✅ Project root folder: `onecgiar_impact_compendium/`
- ⚠️ Required folders: `/Frontend`, `/Backend`, `/Infrastructure`, `/planning`
- ✅ Technical spec: `specs/architecture/impact_compendium_technical_spec.md`

### Validation Status:
- Project root: ✅ EXISTS
- Planning folder: ✅ EXISTS  
- Technical spec: ✅ EXISTS
- Frontend folder: ✅ CREATED (impact-compendium-app/Frontend)
- Backend folder: ✅ CREATED (impact-compendium-app/Backend)
- Infrastructure folder: ✅ CREATED (impact-compendium-app/Infrastructure)

## 📛 RULE 2 – NAMING CONSISTENCY
**Name:** FileNamingPolicy

### Conventions:
- Sprint files: `sprint{number}_{short_name}.md` ✅ COMPLIANT
- Architecture docs: `{component}_architecture_{topic}.md`
- No spaces, lowercase + underscores only
- Outputs under `/specs/architecture/`

## 📛 RULE 3 – VERSION CONTROL & SAFETY
**Name:** VersionShield

### Git Requirements:
- Initialize Git repository
- Commit baseline "pre-sprint" state
- Post-sprint commits: "Sprint {number}: {summary} completed by Amazon Q"
- Backup before overwriting files

## 📛 RULE 4 – EXECUTION SEQUENCE
**Name:** SequentialFlow

### Sprint Order: 1 → 2 → 3 → 4 → 5 → 6 → 7
- Each sprint must pass validation before next
- Verify all expected outputs exist
- No critical errors in SAM/architecture files

## 📛 RULE 5 – DEPENDENCY INTEGRITY
**Name:** DependencyLock

### Cross-Sprint Dependencies:
- Sprint 2 ← Sprint 1 (infrastructure base)
- Sprint 3 ← Sprint 1 (backend folder + env vars)
- Sprint 4 ← Sprint 1,3 (RDS config + backend code)
- Sprint 5 ← Sprint 1 (Cognito definition)
- Sprint 6 ← Sprint 3,4 (working endpoints)
- Sprint 7 ← Sprint 1-6 (all deliverables)

## 📛 RULE 6 – COST CONSCIOUSNESS
**Name:** BudgetSentinel

### Budget Limits:
- Development: $35/month
- Staging: $25/month
- Production: $70/month
- **Total limit: $100/month**

## 📛 RULE 7 – SECURITY & SECRETS HANDLING
**Name:** SecretSanitizer

### Requirements:
- Use AWS Secrets Manager/SSM Parameters only
- Never expose secrets in files
- Auto-redact sensitive values

## 📛 RULE 8 – LOGGING & TRACEABILITY
**Name:** TraceLog

### Log File: `/planning/execution_log.txt`
- Sprint start/end timestamps
- Executor: Amazon Q + MCP name
- Outputs generated
- Status tracking

## 📛 RULE 9 – OUTPUT QUALITY CHECKS
**Name:** QualityGate

### Requirements:
- Valid Markdown syntax
- Valid YAML schema
- Include: Title, Version, Author, Date
- No incomplete sections

## 📛 RULE 10 – DOCUMENTATION INTEGRITY
**Name:** DocLinker

### Cross-References:
- Architecture docs ↔ diagrams
- Planning docs ↔ sprint reports
- Master index: `/planning/index_of_documents.md`

## 📛 RULE 11 – RESOURCE CLEANUP POLICY
**Name:** CleanUpGuardian

### Requirements:
- Delete unused AWS resources post-test
- Remove SAM stacks (dev/test) after validation
- Verify idle cost = $0

## 📛 RULE 12 – FINAL VALIDATION
**Name:** FinalSeal

### Sprint 7 Requirements:
- All architecture docs present
- Diagram PNGs generated
- Cost estimation finalized
- Release notes: `/planning/final_release_notes.md`
- Git tag: `v1.0-impact-compendium`

## 📛 RULE 13 – COMMUNICATION STANDARD
**Name:** ReportSync

### Status Reporting:
- After each sprint: Success/Warning/Failed
- Append to: `/planning/project_progress.md`

## ✅ MCP SERVER ASSIGNMENTS
- **awslabs.cdk-mcp-server** → architecture generation
- **figma-mcp** → UI component extraction
- **aws-serverless-mcp-server** → SAM templates & deployment
- **awslabs.cost-explorer-mcp-server** → cost analysis

## 🚨 PRE-EXECUTION CHECKLIST
Before Sprint 1:
- [ ] Apply ContextGuard validation
- [ ] Initialize Git repository
- [ ] Create missing folders
- [ ] Verify AWS profile: IBD-DEV
- [ ] Confirm region: us-east-1
- [ ] Validate budget limits
- [ ] Initialize execution log