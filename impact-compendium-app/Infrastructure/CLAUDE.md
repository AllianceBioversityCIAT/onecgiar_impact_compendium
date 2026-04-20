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

## Prerequisites Before Any Deploy

| Prerequisite | Why | How to check |
|---|---|---|
| **Docker daemon running** | `sam build --use-container` mounts the source into the official `public.ecr.aws/sam/build-python3.9` image. Without a running daemon the build fails immediately with `Error: Running AWS SAM projects locally requires Docker`. | `docker info` returns the daemon info (not an error). On macOS: open Docker Desktop and wait for the whale icon to go steady. |
| AWS CLI configured with profile `IBD-DEV` | All scripts pass `--profile IBD-DEV`. | `aws sts get-caller-identity --profile IBD-DEV` returns your identity. |
| Network access to AWS (us-east-1) | CloudFormation, S3, Lambda, CloudFront APIs. | The above `aws sts` call. |
| Python 3.9+ on the host | Only needed when running `sam build` **without** `--use-container` (not recommended). With `--use-container` the container supplies 3.9. | `python3 --version`. |

`deploy-backend.sh` runs a preflight check and refuses to proceed if Docker isn't reachable — the script prints a one-line fix hint instead of hanging for minutes.

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

### 6. SQLAlchemy ORM models are stale relative to the real MySQL schema
**Source of truth is `specs/data/dump-TEST-impact_compendium-202511151703.sql`, not `Backend/app/models/`.** The ORM models drift from the real DB in several places:

| ORM model claims | Real DB has |
|---|---|
| `studies.id` as PK | `studies.study_id` |
| `studies.updated_at` | `studies.last_updated_date` (+ a misnamed `last_updated_by datetime`) |
| `study_categories` table, PK `id` | `categories` table, PK `study_category_id` |
| `studies_indicators.indicator_name`, `indicator_value`, `unit`, `methodology` | `studies_indicators.indicator_measure`, `unit_measure`, `result_reported` |
| `studies_contributors.contributor_name`, `role` | Doesn't exist — only `clarisa_centers_center_id`, `clarisa_initiatives_initiative_id` |
| `studies_impact_areas (study_id, impact_area_id)` | `studies_impact_areas (studies_study_id, clarisa_impacts_areas_impact_area_id, impact_area_level)` |
| `study_intervention_types` (singular `study`) | `studies_intervention_types` (plural) + extra `details` column |
| `narratives` has `study_id` | **No `study_id` FK at all** — keyed by `section_key` (UNIQUE). These are page-level section narratives, not per-study notes |

**Implication:** new SQL in `Backend/app/routers/*.py` must use **raw SQL against the real schema** (the pattern used in `reports.py` and `studies.py`). The ORM will compile-run but produces wrong column references at runtime. Fixing the ORM is its own work item — tracked separately; do not assume it's safe to use.

**How to check a field:** open the dump, `/^CREATE TABLE \`<table>\``, and use the column names from there.

### 7. Frontend `aws s3 sync --delete` can serve broken pages for 5–15 min
Vite emits hashed asset names (`index-<hash>.js`, `index-<hash>.css`). A deploy does:
1. Upload new `index.html` + new hashed assets.
2. **Delete the old hashed assets** (via `--delete`).
3. Invalidate CloudFront.

During the invalidation window, a browser with a **cached old `index.html`** (referencing the old hashes) will 404 on the deleted assets → the page renders **without CSS/JS** (default browser styles, unstyled forms — looks broken, the data may still load if the JS eventually loads elsewhere).

**User-facing fix:** hard-reload (`Cmd+Shift+R` / `Ctrl+F5`) to bypass browser cache.

**Root fix (not yet applied):** `deploy-frontend.sh` should upload `index.html` with `Cache-Control: no-cache, must-revalidate` so browsers always revalidate it, while hashed assets keep their long `max-age`. Two-pass upload:
```bash
aws s3 sync dist/ s3://$S3_BUCKET/ --delete \
    --exclude index.html --cache-control "public, max-age=31536000, immutable"
aws s3 cp dist/index.html s3://$S3_BUCKET/index.html \
    --cache-control "no-cache, must-revalidate"
```
Once that lands, the stale-cache window disappears: the browser always fetches fresh `index.html`, which references current asset hashes.

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
