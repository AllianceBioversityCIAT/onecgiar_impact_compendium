# impact-compendium-app — Application Guide

The runnable application: Backend (FastAPI), Frontend (React+Vite), Infrastructure (AWS SAM). Root-level project context lives in `../CLAUDE.md`.

## Layout

```
impact-compendium-app/
├── Backend/         # FastAPI (Python 3.9) → AWS Lambda via Mangum
├── Frontend/        # React 18 + TypeScript + Vite, AWS Amplify (Cognito)
├── Infrastructure/  # AWS SAM (backend-sam/template.yaml) + CloudFormation infra
├── scripts/         # start_local.sh — boots both servers
└── README.md        # Quick start
```

## Quick Start

```bash
# Boots backend (uvicorn :8000) + frontend (vite :5173)
./scripts/start_local.sh
```

Requires `Backend/.env` (copy from `.env.example`) with `DB_HOST/USER/PASSWORD/NAME/PORT`. The script creates `.venv`, installs deps, tests DB connectivity, then launches both servers.

URLs: Frontend http://localhost:5173 · Backend http://localhost:8000 · API docs http://localhost:8000/docs

---

## Backend (`Backend/`)

### Entry & wiring
- **Lambda handler**: `main.py` exports `handler = Mangum(app)` (re-exports `app.main:app`).
- **App**: `app/main.py` — FastAPI instance, CORS, request logger, exception handlers, health/root endpoints, router registration.
- **Region/profile bootstrap**: `app/main.py` sets `AWS_DEFAULT_REGION=us-east-1` always; sets `AWS_PROFILE=IBD-DEV` when **not** running in Lambda (detected via `AWS_LAMBDA_FUNCTION_NAME`).

### Layout
```
Backend/
├── main.py                  # Lambda entrypoint (Mangum)
├── app/
│   ├── main.py              # FastAPI app + router registration
│   ├── config/              # Settings
│   ├── db/connection.py     # SQLAlchemy engine factory
│   ├── middleware/
│   ├── models/              # SQLAlchemy ORM (studies, indicators, clarisa_*, users, ...)
│   ├── schemas/             # Pydantic request/response models
│   ├── routers/             # HTTP layer (one file per domain)
│   ├── services/            # Business logic (auth_service, cognito_*, studies_service)
│   └── utils/               # logging, helpers
├── tests/                   # pytest suite
├── requirements.txt         # Runtime deps
├── requirements-dev.txt     # Lint/test deps
├── pyproject.toml           # black + isort + mypy config
├── .flake8                  # flake8 config
├── Makefile                 # lint / format / test / check-all
└── lint.sh                  # Runs all linters
```

### Routers (mounted under `/api/<domain>`)
`auth, studies, indicators, admin, reports, users, clarisa, reference, study_relations, debug` — see `app/main.py` for the prefix table.

### Conventions
- Layering: `routers/` (HTTP only) → `services/` (business logic, transactions) → `models/` + `schemas/` (data) → `db/` (engine).
- Pydantic v2; FastAPI `redirect_slashes=False` — be exact with trailing slashes.
- CORS is permissive: `allow_origins=["*"]`, `allow_credentials=False`. The `OPTIONS` short-circuit lives in `log_requests` middleware.
- All exceptions are funneled through `http_exception_handler` and `general_exception_handler` for a consistent error envelope (`{error, status_code, path}`).

### Commands
```bash
make format       # black + isort
make lint         # flake8
make type-check   # mypy
make check-all    # lint + check-format + type-check
make test         # pytest tests/ -v
./lint.sh         # equivalent to check-all
```
Detail in `Backend/LINTING.md`.

### Lambda constraints (must respect)
- Runtime python3.9, x86_64, **timeout 300s, memory 512MB** (see `Infrastructure/backend-sam/template.yaml`).
- Container freezes on response → **no `BackgroundTasks` after the response, no module-level mutable state, no `/tmp` files** that need to persist across invocations. Long-running work must complete inside the request, otherwise use SQS/Step Functions.
- Binary responses (e.g. xlsx) require `StreamingResponse` + `BytesIO` and the content-type must be in `BinaryMediaTypes` of the SAM template.

---

## Frontend (`Frontend/`)

### Entry & routing
- `src/main.tsx` — wraps `<App>` in `AuthProvider` + `BrowserRouter` + `Toaster` + `EnvironmentBanner`.
- All routes except `/login` are wrapped in `<ProtectedRoute>` (Cognito-gated).
- Multi-step study workflow: `/studies/new/step-{1,2,3}` and `/studies/edit/:id/step-{1,2,3}` reuse the same components — the `:id` param drives edit vs create mode.
- Fallback: `*` → `Navigate to="/"`.

### Layout
```
Frontend/
├── src/
│   ├── main.tsx              # App entry + router
│   ├── aws-config.ts         # Amplify/Cognito config
│   ├── pages/                # Route components (Login, Home, Dashboard, Studies, Settings, CreateStudy/Step{1,2,3})
│   ├── components/           # ProtectedRoute, ForgotPassword, PasswordChange, ui/, settings/
│   ├── contexts/             # AuthContext
│   ├── hooks/                # Reusable hooks
│   ├── layouts/              # Page shells
│   ├── services/             # api.ts (HTTP), auth.ts
│   ├── types/                # Shared TS types
│   ├── utils/                # http, helpers (vitest unit tests live here)
│   ├── mocks/                # Dev fixtures
│   └── styles/global.css     # Tailwind base + tokens
├── tests/                    # Playwright suites + scenario scripts
├── public/
├── package.json
├── vite.config.ts
├── tailwind.config.js
├── tsconfig.json
├── .eslintrc.cjs / .prettierrc
└── playwright.config.js
```

### Stack
React 18, TypeScript, Vite, React Router v6, Tailwind, AWS Amplify v6 (Cognito), react-hot-toast, xlsx.

### Environment
- `VITE_API_BASE_URL` — backend root (defaults to `http://localhost:8000` via `start_local.sh`).
- Per-env files: `.env.local`, `.env.production`. `.env.example` is the template.

### Commands
```bash
npm run dev              # Vite dev server
npm run build            # tsc + vite build
npm run lint             # ESLint
npm run lint:fix
npm run format           # Prettier
npm run test:unit        # Vitest (utils/http.test.ts)
npm run test             # Playwright full suite
npm run test:auth | test:dashboard | test:studies | test:responsive | test:performance
npm run test:report      # Open HTML report
```
Test details in `Frontend/TESTING.md`.

---

## Infrastructure (`Infrastructure/`)

> **Detail** lives in [`Infrastructure/CLAUDE.md`](Infrastructure/CLAUDE.md) — stack topology, scripts (when to use which), SAM template specifics, and the SAM/CloudFormation gotchas (stale `.aws-sam`, `UPDATE_ROLLBACK_COMPLETE` handling, BinaryMediaTypes/`Accept` negotiation). Read it before deploying or modifying scripts.

### Layout
```
Infrastructure/
├── backend-sam/
│   ├── template.yaml             # SAM stack: API + Lambda + IAM
│   ├── samconfig.toml            # Per-env deploy config
│   └── DEPLOYMENT_STRATEGY.md
├── cloudformation-infrastructure-only.yaml   # Sibling stack: RDS, Cognito, etc.
├── DEPLOYMENT_GUIDE.md
├── DEPLOYMENT_QUICK_REFERENCE.md
└── scripts/                       # Deploy helpers
```

### Key facts
- Two stacks: a **base infra** stack (RDS, Cognito) and the **backend-sam** stack (API Gateway + Lambda). The SAM stack imports outputs from the base stack via `Fn::ImportValue: ${ProjectName}-${Environment}-{db-endpoint|cognito-pool-id|cognito-client-id}`.
- DB password resolved at runtime from Secrets Manager: `{{resolve:secretsmanager:${ProjectName}/${Environment}/db-password:SecretString:password}}`.
- Lambda has **no VPC config** (commit `36b0aef`) — RDS must be publicly accessible. Trade-off: simpler deploy, no NAT cost, in exchange for relying on RDS security groups + IAM for protection.
- `BinaryMediaTypes` includes `application/vnd.openxmlformats-officedocument.spreadsheetml.sheet` and `application/octet-stream` — required for xlsx round-trip through API Gateway.
- Environments: `testing`, `prod`. Default project name: `impact-compendium`.

### Known build issue
`PythonPipBuilder:CopySource` can hang on incremental builds — clear `.aws-sam/` or use `sam build --use-container`.

---

## Where to look next

- Architecture deep-dives: `Backend/architecture/`, `Frontend/architecture/`, and `../specs/architecture/`.
- Active bug specs: `../specs/bugs/` (each has `requirements.md`, `design.md`, `tasks.md`).
- DB schema: `../specs/data/impact.erd` + `impact.png`; SQL dumps in the same folder.
- Security policy: `../SECURITY.md`.
