# Impact Compendium — Infrastructure

AWS SAM (backend) on top of CloudFormation (base infra). Deployed per environment (`testing`, `prod`) in `us-east-1`. AWS profile: `IBD-DEV`.

> For deployment **conventions, gotchas, and decision rationale**, read [`CLAUDE.md`](./CLAUDE.md). This README is the cheat sheet — `CLAUDE.md` is the manual.

![Architecture](./impact-compendium-infrastructure.png)

## Two-Stack Topology

| Stack (per environment) | Template | Resources |
|---|---|---|
| `impact-compendium-<env>` | `cloudformation-infrastructure-only.yaml` | RDS (MySQL, **publicly accessible**), Cognito User Pool, S3 (frontend), CloudFront, Secrets Manager |
| `impact-compendium-backend-<env>` | `backend-sam/template.yaml` | API Gateway REST + Lambda (`impact-compendium-backend-api-<env>`) + IAM |

Backend stack imports DB endpoint, Cognito pool ID, and Cognito client ID from the infra stack via `Fn::ImportValue`. DB password is resolved at runtime from Secrets Manager.

**Lambda runs outside the VPC** (commit `36b0aef`) — RDS is reached over the public endpoint, gated by RDS security groups. Trade-off: simpler deploy, no NAT cost.

## Backend Quick Facts

- Runtime `python3.9`, `x86_64`, **timeout 300s, memory 512MB**.
- `BinaryMediaTypes` registers `application/vnd.openxmlformats-officedocument.spreadsheetml.sheet` and `application/octet-stream` so xlsx/octet-stream responses round-trip uncorrupted. **Clients must send a matching `Accept` header** — `*/*` leaks the base64 body through as text.
- CORS is handled inside FastAPI/Mangum (not via API Gateway mock integrations).

## Scripts

All scripts default `ENVIRONMENT` to `testing`. Run from the `Infrastructure/` directory.

| Script | When to use |
|---|---|
| `./scripts/deploy-backend.sh <env>` | **Backend code changes only** — preferred path. Skips infra entirely; pre-cleans `.aws-sam/` to avoid the build hang; uses `--use-container`; smoke-tests the export endpoint after deploy. |
| `./scripts/deploy-frontend.sh <env>` | Frontend code changes — builds, syncs `dist/` to S3, invalidates CloudFront. |
| `./scripts/deploy-complete.sh <env>` | Fresh environment (creates infra if missing) **or** coordinated update across infra check + backend + frontend. |
| `./scripts/check-status.sh <env>` | Quick status of both stacks; surfaces failure events; suggests which deploy script to run. |
| `./scripts/update-frontend-config.sh <env>` | Sync frontend `.env` files with the current backend API URL + Cognito IDs. |
| `./scripts/delete-complete.sh <env>` | Tear down a whole environment cleanly. **Destructive.** |
| `./scripts/force-delete.sh <env> [backend\|infrastructure\|all]` | Stuck-stack rescue. **Destructive — read before running.** |

## Common Flows

**Ship a backend code change to testing:**
```bash
./scripts/deploy-backend.sh testing
```

**Ship a frontend change to testing:**
```bash
cd ../Frontend && npm run build && cd ../Infrastructure
./scripts/deploy-frontend.sh testing
```

**Stand up a fresh environment from scratch:**
```bash
./scripts/deploy-complete.sh testing
```

**Tail Lambda logs after a deploy:**
```bash
AWS_PROFILE=IBD-DEV aws logs tail /aws/lambda/impact-compendium-backend-api-testing \
    --profile IBD-DEV --since 10m --follow
```

## Known Gotchas

Full detail in [`CLAUDE.md`](./CLAUDE.md). Quick list:

1. **`sam build` hangs at `adjusting uri ../../Backend/`** — stale `.aws-sam/build/` (especially mode-700 dirs from Finder duplicates). `mv .aws-sam .aws-sam.OLD-…` is more reliable than `rm -rf` (some sandboxes silently deny `rm`). The deploy scripts now do this automatically.
2. **`UPDATE_ROLLBACK_COMPLETE` is a healthy "exists" state** — older script logic that only treated `*_COMPLETE` as "exists" would fall through to `create-stack` and fail with `AlreadyExistsException`. All scripts now treat it as healthy.
3. **API Gateway `BinaryMediaTypes` requires a matching client `Accept` header** — `*/*` returns base64 text. Frontend code must send the explicit content-type for xlsx downloads.
4. **Always build with `--use-container`** so the build matches the Lambda runtime regardless of host Python.
5. **`sam validate` lint about `GatewayResponses` and `DefinitionBody`** — pre-existing template lint warning, not fatal. Ignore.

## Documentation

- [`CLAUDE.md`](./CLAUDE.md) — deployment conventions, scripts reference, gotchas (read this first).
- [`DEPLOYMENT_GUIDE.md`](./DEPLOYMENT_GUIDE.md) — long-form walkthrough.
- [`DEPLOYMENT_QUICK_REFERENCE.md`](./DEPLOYMENT_QUICK_REFERENCE.md) — command crib sheet.
- [`backend-sam/DEPLOYMENT_STRATEGY.md`](./backend-sam/DEPLOYMENT_STRATEGY.md) — backend-stack design notes.
- [`../../specs/infrastructure/`](../../specs/infrastructure/) — SAM architecture proposal + diagrams.
