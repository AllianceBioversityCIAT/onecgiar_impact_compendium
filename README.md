# Impact Compendium

CGIAR research impact study management platform. A FastAPI backend and React frontend deployed serverless on AWS.

## Repository Layout

```
onecgiar_impact_compendium/
├── docs/                         # SDD constitutional baseline (PRD, designs, spec formats)
│   ├── prd.md                    # Product requirements
│   ├── system-design/design.md   # UI/UX system blueprint (tokens, components, a11y)
│   ├── detailed-design/detailed-design.md  # Technical blueprint (as-it-runs)
│   └── specs/                    # New feature/bug specs + general-setup/ formats
├── .agents/                      # Leader / Implementer / Reviewer personas (SDD execution)
├── impact-compendium-app/        # The application
│   ├── Backend/                  # FastAPI (Python 3.9) → AWS Lambda via Mangum
│   ├── Frontend/                 # React 18 + TypeScript + Vite, AWS Amplify (Cognito)
│   ├── Infrastructure/           # AWS SAM + CloudFormation, deploy scripts
│   └── scripts/start_local.sh    # Boots both servers locally
├── specs/                        # Legacy archive: architecture, bugs, infrastructure, data
├── infrastructure-no-nat.yaml    # CloudFormation: Lambda outside VPC
├── infrastructure-restore.yaml   # CloudFormation: full infra reference
└── SECURITY.md                   # Security guidelines
```

## Tech Stack

- **Backend**: FastAPI 0.104, SQLAlchemy 2.0, PyMySQL, Pydantic 2, Mangum (Lambda adapter), python-jose / pyjwt for Cognito JWT, openpyxl for Excel export.
- **Frontend**: React 18, TypeScript, Vite, React Router v6, Tailwind CSS, AWS Amplify v6 (Cognito), react-hot-toast. Tests via Playwright + Vitest.
- **Infra**: AWS SAM, API Gateway REST, Lambda (python3.9, x86_64, 300s / 512MB), MySQL RDS (publicly accessible — Lambda runs **outside VPC**), Cognito User Pool, Secrets Manager.
- **Region**: `us-east-1`. **Local AWS profile**: `IBD-DEV`. **Environments**: `testing`, `prod`.

## Quick Start (Local)

```bash
cd impact-compendium-app
./scripts/start_local.sh
```

- Frontend: <http://localhost:5173>
- Backend: <http://localhost:8000> (API docs at `/docs`)

Requires `Backend/.env` (copy from `Backend/.env.example`) with `DB_HOST/USER/PASSWORD/NAME/PORT`. The script creates a Python venv, installs deps, tests the DB connection, then starts uvicorn + vite.

**Prerequisites**:
- Node.js ≥16, npm, Python ≥3.9.
- **Docker Desktop running** — required for any backend deploy (`sam build --use-container`). Start Docker Desktop and wait for the whale icon to stabilize before running `deploy-backend.sh` or `deploy-complete.sh`. `deploy-backend.sh` runs a preflight check and aborts with a clear hint if Docker isn't reachable.
- AWS CLI configured with the `IBD-DEV` profile (`aws sts get-caller-identity --profile IBD-DEV` should work).

## Deployment

| Goal | Command |
|---|---|
| Backend code change (preferred path) | `cd impact-compendium-app/Infrastructure && ./scripts/deploy-backend.sh testing` |
| Frontend change | `cd impact-compendium-app/Infrastructure && ./scripts/deploy-frontend.sh testing` |
| Fresh environment / coordinated update | `cd impact-compendium-app/Infrastructure && ./scripts/deploy-complete.sh testing` |
| Status check | `cd impact-compendium-app/Infrastructure && ./scripts/check-status.sh testing` |

Full deployment manual: [`impact-compendium-app/Infrastructure/CLAUDE.md`](impact-compendium-app/Infrastructure/CLAUDE.md). Cheat sheet: [`impact-compendium-app/Infrastructure/README.md`](impact-compendium-app/Infrastructure/README.md).

## Code Quality

**Secret scanning (all contributors — one-time setup per clone):**

```bash
brew install gitleaks pre-commit   # or: pip install pre-commit / see gitleaks releases
pre-commit install                 # from the repo root
```

Every commit is then scanned by [gitleaks](https://github.com/gitleaks/gitleaks) (`.pre-commit-config.yaml`) and blocked if it contains credentials — the same class of findings GitGuardian enforces on pull requests. Never commit real values; `.env` files stay gitignored (see `SECURITY.md`).

**Backend** (from `impact-compendium-app/Backend/`):
```bash
make check-all     # black + isort + flake8 + mypy
make test          # pytest
```

**Frontend** (from `impact-compendium-app/Frontend/`):
```bash
npm run lint
npm run format
npm run test:unit  # Vitest
npm run test       # Playwright
npm run build      # tsc + vite build
```

## Documentation

**SDD constitutional baseline** (source of truth for new feature/bug specs):

- [`docs/prd.md`](docs/prd.md) — product requirements: problem, personas, scope, acceptance criteria, open questions.
- [`docs/system-design/design.md`](docs/system-design/design.md) — UI/UX system: design tokens, component inventory, navigation, accessibility rules.
- [`docs/detailed-design/detailed-design.md`](docs/detailed-design/detailed-design.md) — technical blueprint as the system actually runs (data model, API surface, auth, Lambda constraints).
- [`docs/specs/general-setup/`](docs/specs/general-setup/) — mandatory formats for spec `requirements.md` / `design.md` / `tasks.md` + execution logs. New specs live under `docs/specs/{features,bugs,enhancements}/<slug>/`.

**Project guides & reference:**

- [`CLAUDE.md`](CLAUDE.md) — root context for AI/automation collaborators (architecture, conventions, gotchas).
- [`AGENTS.md`](AGENTS.md) — tool-agnostic guide for AI coding agents (ground truths, verification commands).
- [`impact-compendium-app/CLAUDE.md`](impact-compendium-app/CLAUDE.md) — per-tier (Backend / Frontend / Infrastructure) layout, commands, and conventions.
- [`impact-compendium-app/Infrastructure/CLAUDE.md`](impact-compendium-app/Infrastructure/CLAUDE.md) — deploy scripts reference, stack topology, SAM/CloudFormation gotchas.
- [`impact-compendium-app/Backend/architecture/`](impact-compendium-app/Backend/architecture/) — backend architecture notes.
- [`impact-compendium-app/Frontend/architecture/`](impact-compendium-app/Frontend/architecture/) — `FRONTEND_ARCHITECTURE.md`, `COMPONENT_ARCHITECTURE.md`, `FIELD_MAPPING.md`, `DEVELOPMENT_GUIDE.md`.
- [`specs/architecture/impact_compendium_technical_spec.md`](specs/architecture/impact_compendium_technical_spec.md) — full technical spec.
- [`specs/data/impact.png`](specs/data/impact.png) — DB ERD diagram.
- [`SECURITY.md`](SECURITY.md) — credential management, environment variables, incident response.

## License & Attribution

CGIAR Alliance Bioversity & CIAT.
