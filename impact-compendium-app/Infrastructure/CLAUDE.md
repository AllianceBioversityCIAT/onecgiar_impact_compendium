# Infrastructure — AWS SAM + CloudFormation Guide

Backend deployed via AWS SAM. Base infra (RDS, Cognito, S3, CloudFront) deployed via raw CloudFormation. Two stacks per environment, joined by `Fn::ImportValue`. Parent context in [`../CLAUDE.md`](../CLAUDE.md).

## Layout

```
Infrastructure/
├── backend-sam/
│   ├── template.yaml             # SAM stack: API Gateway + Lambda + IAM
│   ├── samconfig.toml            # Per-env deploy config (default | testing | production)
│   └── DEPLOYMENT_STRATEGY.md
├── cloudformation-infrastructure-only.yaml   # Base infra: VPC, RDS, Cognito, S3, CloudFront
├── DEPLOYMENT_GUIDE.md
├── DEPLOYMENT_QUICK_REFERENCE.md
└── scripts/                       # Deploy / status / cleanup helpers
```

## Two-Stack Topology

Per environment (`testing`, `prod`):

| Stack | Template | Resources | Created by |
|---|---|---|---|
| `impact-compendium-<env>` | `cloudformation-infrastructure-only.yaml` | RDS (MySQL), Cognito User Pool, S3 (frontend), CloudFront, Secrets Manager | `deploy-complete.sh` (creates if missing) |
| `impact-compendium-backend-<env>` | `backend-sam/template.yaml` | API Gateway REST + Lambda function (`impact-compendium-backend-api-<env>`) + IAM | `deploy-backend.sh` or `deploy-complete.sh` |

The backend stack imports from the infra stack:
```yaml
Fn::ImportValue: !Sub "${ProjectName}-${Environment}-db-endpoint"
Fn::ImportValue: !Sub "${ProjectName}-${Environment}-cognito-pool-id"
Fn::ImportValue: !Sub "${ProjectName}-${Environment}-cognito-client-id"
```
DB password resolved at runtime: `{{resolve:secretsmanager:${ProjectName}/${Environment}/db-password:SecretString:password}}`.

Lambda runs **outside the VPC** — RDS must be publicly accessible (commit `36b0aef`). Trade-off: simpler deploy, no NAT cost; relies on RDS security groups + IAM for protection.

## Scripts — When to Use What

| Script | Use when | Touches |
|---|---|---|
| `deploy-backend.sh <env>` | **Default for backend code changes.** Infra stack already exists and you only need to ship Lambda code. | Backend stack only |
| `deploy-frontend.sh <env>` | Frontend code changes only. | S3 bucket + CloudFront invalidation |
| `deploy-complete.sh <env>` | Fresh environment (creates infra if missing) **or** full coordinated update across infra + backend + frontend. | All three (infra check, backend, frontend) |
| `check-status.sh <env>` | Quick status of both stacks; surfaces failure events; suggests which deploy script to run. | Read-only |
| `delete-complete.sh <env>` | Tear down a whole environment cleanly. | All stacks (destructive) |
| `force-delete.sh <env> [backend\|infrastructure\|all]` | Stuck stack rescue when normal delete fails. | Destructive — read it before running |

**Defaults to `testing`.** Profile `IBD-DEV`, region `us-east-1` are hard-coded in every script.

## SAM Template Quick Facts

`backend-sam/template.yaml` — things worth knowing without re-reading the file:

- **Lambda**: `python3.9`, `x86_64`, **timeout 300s, memory 512MB**. `CodeUri: ../../Backend/`, `Handler: main.handler`.
- **API Gateway** stage name = environment (`testing` / `prod`). CORS handled by FastAPI/Mangum, not Gateway mock integrations.
- **`BinaryMediaTypes`** registers two content-types so API Gateway will base64-decode Lambda responses for binary downloads:
  - `application/vnd.openxmlformats-officedocument.spreadsheetml.sheet` (xlsx)
  - `application/octet-stream`
- **`GatewayResponses`** sets permissive CORS headers on `DEFAULT_4XX` / `DEFAULT_5XX` so error responses don't fail browser preflight.
- **IAM**: Lambda gets full `cognito-idp:*` on the imported user pool, `secretsmanager:GetSecretValue` on the DB password secret, and CloudWatch Logs.

## samconfig.toml — Per-Env Build/Deploy Settings

```
[default.build.parameters]   cached = true, parallel = true
[default.deploy.parameters]  resolve_s3 = true, no-confirm-changeset, region us-east-1
[testing.deploy.parameters]  stack_name = "impact-compendium-backend-testing"
[production.deploy.parameters]  confirm_changeset = true   # prod requires manual approval
```

Always invoke deploy with `--config-env testing` or `--config-env production`. The `[default]` block is the build profile; the env block selects the right stack name + parameter overrides.

## Gotchas (Hard-Won)

### 1. `sam build` hangs at `--base-dir … adjusting uri ../../Backend/`
A stale `.aws-sam/build/` directory (especially one with mode `700` or a Finder-duplicated name like `ImpactCompendiumFunction 3`) silently blocks the build before Docker even launches. Symptoms: log freezes after the "adjusting uri" line; CPU usage near zero; no container starts.

**Fix:** clear the cache before building. `mv` is more reliable than `rm -rf` because some macOS sandboxing setups deny `rm` on these dirs without printing an error:
```bash
[ -d .aws-sam ] && mv .aws-sam ".aws-sam.OLD-$(date +%s)"
sam build --use-container --profile IBD-DEV
```
`deploy-backend.sh` and `deploy-complete.sh` now do this automatically. Always pass `--use-container` so the build uses the official `public.ecr.aws/sam/build-python3.9` image and isn't sensitive to host Python.

### 2. `UPDATE_ROLLBACK_COMPLETE` is a healthy "exists" state
A failed update leaves the stack in `UPDATE_ROLLBACK_COMPLETE` — the stack is intact at the previous good version. Older script logic (`if status == CREATE_COMPLETE || UPDATE_COMPLETE`) treated this as "missing" and tried `create-stack`, which fails with `AlreadyExistsException`. All scripts now include `UPDATE_ROLLBACK_COMPLETE` in the "exists" set. Watch for the same pattern if you add new status checks.

### 3. API Gateway needs an `Accept` header that matches `BinaryMediaTypes`
For Lambda-returned binary (xlsx, octet-stream) to reach the client as bytes, the **client must send `Accept: <type>`** matching a `BinaryMediaTypes` entry. `Accept: */*` is treated as "no preference" and the base64-encoded Lambda body leaks through as text — Excel rejects it as corrupt.

Frontend fetch must look like:
```ts
fetch(url, {
  headers: {
    Accept: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
    ...authHeaders,
  },
})
```
`deploy-backend.sh` smoke-tests this after deploy: it curls `/api/reports/export` with the binary Accept header and verifies the response starts with the ZIP magic bytes `50 4B 03 04`.

### 4. `sam validate` lint warning about `GatewayResponses`
> *GatewayResponses works only with inline Swagger specified in 'DefinitionBody'*

Pre-existing template lint warning, **not** fatal — `sam build`/`deploy` still work. Don't waste time on it unless you're rewriting the template.

### 5. `sam build` without `--use-container` uses the host Python
The host's `python3` may not match the Lambda runtime (3.9), producing wheels that fail at runtime (e.g. `cryptography`, `pandas`). Always `--use-container` for deploys; reserve host build for quick local iteration.

## Standard Backend Deploy Flow (for code-only changes)

```bash
cd impact-compendium-app/Infrastructure
./scripts/deploy-backend.sh testing
```

Equivalent manual flow (what the script does):
```bash
cd backend-sam
[ -d .aws-sam ] && mv .aws-sam .aws-sam.OLD-$(date +%s)
AWS_PROFILE=IBD-DEV sam build --use-container --profile IBD-DEV
AWS_PROFILE=IBD-DEV sam deploy --config-env testing --profile IBD-DEV
```

After deploy, tail logs:
```bash
AWS_PROFILE=IBD-DEV aws logs tail /aws/lambda/impact-compendium-backend-api-testing \
    --profile IBD-DEV --since 10m --follow
```

## Reference

- `DEPLOYMENT_GUIDE.md` — long-form walkthrough.
- `DEPLOYMENT_QUICK_REFERENCE.md` — command crib sheet.
- `backend-sam/DEPLOYMENT_STRATEGY.md` — backend-stack design notes.
- `../../specs/infrastructure/igad_sam_architecture_*.md` — SAM architecture proposal + diagrams.
