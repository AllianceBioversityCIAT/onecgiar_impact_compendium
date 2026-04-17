# Impact Compendium — Project Guide

CGIAR research impact study management platform. Three-tier app deployed on AWS.

> **Application detail** lives in [`impact-compendium-app/CLAUDE.md`](impact-compendium-app/CLAUDE.md) — Backend, Frontend, and Infrastructure conventions, commands, and gotchas. Read it before working inside that directory.

## Repository Layout

```
onecgiar_impact_compendium/
├── impact-compendium-app/
│   ├── Backend/         # FastAPI (Python 3.9) → AWS Lambda via Mangum
│   ├── Frontend/        # React 18 + TypeScript + Vite, AWS Amplify (Cognito)
│   ├── Infrastructure/  # AWS SAM (backend-sam/template.yaml) + CloudFormation
│   └── scripts/         # start_local.sh — runs both servers locally
├── specs/               # Architecture, bugs, infrastructure, and data specs
│   ├── architecture/    # impact_compendium_technical_spec.md
│   ├── bugs/            # Active bug-fix specs (e.g. excel-report)
│   ├── data/            # SQL dumps, ERD (impact.erd / impact.png)
│   └── infrastructure/  # SAM architecture proposals + diagrams
├── infrastructure-no-nat.yaml      # CloudFormation: Lambda outside VPC
└── infrastructure-restore.yaml     # CloudFormation: full infra reference
```

## Tech Stack

- **Backend**: FastAPI 0.104, SQLAlchemy 2.0, PyMySQL, Pydantic 2, Mangum (Lambda adapter), python-jose / pyjwt for Cognito JWT, openpyxl for Excel export.
- **Frontend**: React 18, TypeScript, Vite, React Router v6, Tailwind CSS, AWS Amplify v6 (Cognito), react-hot-toast, xlsx. Tests via Playwright + Vitest.
- **Infra**: AWS SAM, API Gateway REST, Lambda (python3.9, x86_64, 300s timeout, 512MB), MySQL RDS (publicly accessible — Lambda runs **outside VPC**), Cognito User Pool, Secrets Manager for DB password.
- **Region**: `us-east-1`. **Local AWS profile**: `IBD-DEV`. **Environments**: `testing`, `prod`.

## Local Development

```bash
# From impact-compendium-app/
./scripts/start_local.sh
```
- Frontend: http://localhost:5173
- Backend: http://localhost:8000  (docs at `/docs`)
- Requires `Backend/.env` (copy from `.env.example`) with `DB_HOST/USER/PASSWORD/NAME/PORT`.
- Script creates `.venv`, installs `requirements.txt`, tests DB connection, then starts uvicorn + vite.

## Backend Conventions

- Entry: `Backend/main.py` exports `handler = Mangum(app)` for Lambda. App lives at `Backend/app/main.py`.
- Routers under `app/routers/` mounted with `/api/<domain>` prefix: `auth, studies, indicators, admin, reports, users, clarisa, reference, study_relations, debug`.
- Layers: `routers/` (HTTP) → `services/` (business logic) → `models/` (SQLAlchemy) / `schemas/` (Pydantic) / `db/` (connection).
- AWS region/profile is set at module-load time in `app/main.py` (Lambda detects via `AWS_LAMBDA_FUNCTION_NAME`).
- CORS is wide-open (`allow_origins=["*"]`, no credentials) — enforced both in FastAPI middleware and SAM `GatewayResponses`. The `OPTIONS` handler short-circuits in `log_requests` middleware.
- Lint/format: `make lint | format | type-check | check-all` (black 88-col, isort, flake8, mypy). See `Backend/LINTING.md`.
- Tests: `make test` → pytest under `Backend/tests/`.

## Frontend Conventions

- Entry: `Frontend/src/main.tsx` — wraps `<App>` in `AuthProvider` + `BrowserRouter`. All non-`/login` routes are wrapped in `<ProtectedRoute>`.
- Multi-step study workflow: `/studies/new/step-{1,2,3}` and `/studies/edit/:id/step-{1,2,3}` (same components, ID drives edit mode).
- Auth: `aws-config.ts` configures Amplify against the Cognito pool. JWT used for `Authorization: Bearer …` on backend calls.
- API base URL: `VITE_API_BASE_URL` (set per env in `.env.local` / `.env.production`).
- Lint/format: `npm run lint | lint:fix | format`. ESLint + Prettier configured.
- Tests: `npm run test` (Playwright), `npm run test:unit` (Vitest for `utils/http`).

## Deployment (SAM)

- Template: `impact-compendium-app/Infrastructure/backend-sam/template.yaml`.
- Stack imports DB endpoint, Cognito pool ID, and Cognito client ID from a sibling infra stack via `Fn::ImportValue: ${ProjectName}-${Environment}-{...}`. DB password is pulled from Secrets Manager at runtime.
- `BinaryMediaTypes` includes `application/vnd.openxmlformats-officedocument.spreadsheetml.sheet` and `application/octet-stream` — required for xlsx downloads to round-trip through API Gateway uncorrupted.
- Lambda has **no VPC config** — RDS must be publicly accessible (see commit `36b0aef`).
- Build hangs at `PythonPipBuilder:CopySource` have happened during incremental builds — try `sam build --use-container` or clear `.aws-sam/` cache.
- See `Infrastructure/DEPLOYMENT_GUIDE.md` and `backend-sam/DEPLOYMENT_STRATEGY.md`.

## Gotchas

- **Lambda is stateless**: do not rely on module-level dicts, `BackgroundTasks` running after the response, or `/tmp` files persisting across invocations. Containers freeze on response and may not be reused. Long-running work must complete inside the request, or use SQS/Step Functions. (Background: `specs/bugs/excel-report/` documents the async-export bug caused by exactly this.)
- For binary responses (xlsx, etc.) use `StreamingResponse` with `BytesIO` and ensure the Content-Type is in `BinaryMediaTypes`.
- Lambda timeout is 300s, memory 512MB — keep Excel exports / heavy queries within those limits (current cap: 5000 rows).
- `redirect_slashes=False` is set on FastAPI — be exact with trailing slashes in routes.
- `.env` files are gitignored; `.env.example` is the template. Never commit real credentials. See `SECURITY.md`.
- `AWS_PROFILE=IBD-DEV` is hard-coded for local runs in `app/main.py` — make sure that profile exists in `~/.aws/credentials`.

## Reference Docs (in repo)

- [`impact-compendium-app/CLAUDE.md`](impact-compendium-app/CLAUDE.md) — child guide with per-tier (Backend / Frontend / Infrastructure) layout, commands, and conventions.
- `specs/architecture/impact_compendium_technical_spec.md` — full technical spec.
- `specs/data/impact.erd` + `impact.png` — DB ERD.
- `specs/infrastructure/igad_sam_architecture_*.md` — SAM architecture proposal/docs.
- `impact-compendium-app/Frontend/architecture/` — `FRONTEND_ARCHITECTURE.md`, `COMPONENT_ARCHITECTURE.md`, `FIELD_MAPPING.md`, `DEVELOPMENT_GUIDE.md`.
- `impact-compendium-app/Backend/architecture/` — backend architecture notes.
- `impact-compendium-app/Infrastructure/DEPLOYMENT_GUIDE.md` + `DEPLOYMENT_QUICK_REFERENCE.md`.
