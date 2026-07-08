# Impact Compendium — Detailed Design (Technical Blueprint)

| | |
|---|---|
| **Version** | 1.0 |
| **Date** | 2026-07-08 |
| **Status** | Living document — Baseline |
| **Scope note** | Documents the system **as it actually runs**. Where older architecture docs (`Backend/architecture/*.md`, parts of the technical spec) describe an aspirational clean architecture, this document records reality and names the drift. |

## 1. System Overview

Three-tier serverless app in `us-east-1`:

```
React 18 + TS + Vite (Amplify/Cognito)          FastAPI 0.104 (Python 3.9)
  Frontend  ── Bearer JWT ──►  API Gateway REST ──►  Lambda (Mangum) ──►  MySQL RDS (public)
                                    │                     │
                              BinaryMediaTypes       Secrets Manager (DB password)
                              (xlsx round-trip)      Cognito (JWKS verification)
```

- Lambda: `python3.9`, x86_64, **300 s timeout, 512 MB**, handler `main.handler` = `Mangum(app, lifespan="off")`, **no VPC** (RDS publicly accessible by design).
- SAM stack (`Infrastructure/backend-sam/template.yaml`) imports DB endpoint + Cognito pool/client IDs from a sibling infra stack (`Fn::ImportValue`), resolves `DB_PASSWORD` from Secrets Manager.
- Environments: `testing`, `prod`. Local profile `IBD-DEV`.

### 1.1 The single most important architectural fact

**The runtime does not use the ORM.** All routers query MySQL through raw SQL via SQLAlchemy `text()` (~110 raw queries; 63 in `studies.py` alone). The SQLAlchemy models under `app/models/` and the `StudiesService`/`AuthService` classes are **dead code** whose column names disagree with the real database (`studies.id` vs real `studies.study_id`; `Country.name` vs real `clarisa_countries.country_name`). The real architecture is:

```
routers (HTTP + business logic + raw SQL)  →  db/connection.py  →  MySQL
services/  = Cognito integration only (cognito_auth.py, cognito_user_service.py)
```

**Rules:** the SQL dump in `specs/data/` and the raw SQL in routers are the schema source of truth. Never derive a data contract from `app/models/`. Do not "fix" features by resurrecting the ORM unless a spec explicitly scopes that migration.

## 2. Domain Modules & Responsibilities

| Module | Prefix | Responsibility | Auth |
|---|---|---|---|
| `routers/auth.py` | `/api/auth` | login stub (mock/dev; prod auth is Amplify-direct), `/me`, `/verify-token`, `/status` | mixed |
| `routers/studies.py` | `/api/studies` | full study CRUD incl. atomic `POST /complete` & `PUT /{id}/complete` upserts | writes: researcher |
| `routers/indicators.py` | `/api/indicators` | indicator reads (mock fallback if DB down) | none |
| `routers/admin.py` | `/api/admin` | stats, health | admin |
| `routers/reports.py` | `/api/reports` | summary + Excel exports (pandas/openpyxl) | **none (gap)** |
| `routers/users.py` | `/api/users` | Cognito user/group management (boto3) | admin |
| `routers/clarisa.py` | `/api/clarisa` | CLARISA reference reads | none |
| `routers/reference.py` | `/api/reference` | reference reads (some hardcoded fallbacks) | none |
| `routers/study_relations.py` | `/api/study-relations` | relationship reads + contributor write | none |
| `routers/debug.py` | `/api/debug` | relationship dump for debugging | none |

Active services: `services/cognito_auth.py` (JWT verification, module-global `cognito_auth` singleton with per-warm-container JWKS cache), `services/cognito_user_service.py` (Cognito Admin API). Dead: `studies_service.py`, `auth_service.py`, `cognito_service.py` (older duplicate), all of `models/`, most of `schemas/` (routers return raw `Dict[str, Any]`).

Utilities: `utils/` (logging setup, pagination, filters, email utils). App shell: `app/main.py` (CORS, request-logging middleware that short-circuits OPTIONS, global exception handlers, `/health`, router registration; AWS region/profile bootstrap at module load).

## 3. Data Model & Entities (real schema)

- **`studies`** — PK `study_id` (client-supplied, not auto-increment), `title`, `summary`, `year` (int), `period_start`/`period_end` (DATE, stored `YYYY-01-01`/`YYYY-12-31`), `doi`, `category_id` → `categories.study_category_id`, `intervention_details`, `study_intervention_types_intervention_type_id` (FK that requires the junction row to exist first), `status` (only `draft` used), `is_active` (soft-delete flag), `created_at`, `last_updated_date`, `created_by` (email). Surfaced to users as **`ICD-###`** (routers strip the prefix).
- **`categories`** — `study_category_id`, `name`, `is_active`.
- **Junction tables** (all with `is_active`; hard-deleted and re-inserted on study edit):
  - `studies_impact_areas` — `studies_impact_areas_id`, `studies_study_id`, `clarisa_impacts_areas_impact_area_id`, **`impact_area_level`** ∈ `primary`/`secondary`/NULL (NULL-with-lowest-id counts as primary in reports).
  - `studies_countries`, `studies_regions`, `studies_crop_types`, `studies_keywords` — simple (study_id, ref_id) pairs.
  - `studies_contributors` — study_id + nullable `clarisa_initiatives_initiative_id` OR `clarisa_centers_center_id`.
  - `studies_intervention_types` — own PK + `details`.
  - `studies_indicators` — PK `indicator_id`, `indicator_measure`, `unit_measure`, `result_reported`.
- **Reference / CLARISA** (all with `is_active`): `clarisa_countries` (`country_id`, `country_name`), `clarisa_cgiar_regions`, `clarisa_impacts_areas`, `clarisa_initiatives` (name, acronym), `clarisa_centers` (name, acronym), `crop_types`, `keywords`, `intervention_types`.

ERD: `specs/data/impact.png`; authoritative dump under `specs/data/`.

## 4. API Surface & Contracts

All under `/api`; `redirect_slashes=False` — **trailing slashes are load-bearing and inconsistent** (e.g. `/clarisa/centers/` has one, `/reference/categories` does not); match the existing route exactly.

- **auth**: `POST /login` (dev stub), `POST /logout`, `GET /me` 🔒, `GET /verify-token` 🔒, `GET /status`.
- **studies**: `GET /check-id/{id}` · `GET /` (params `q`, `page`, `pageSize` ≤ 100, `sort=field:dir`, `category`, `year_from`, `year_to`) · `GET /{id}` · `GET /search/` · `POST /` ✍️ · `POST /complete` ✍️ · `PUT /{id}` ✍️ · `PUT /{id}/complete` ✍️ · `DELETE /{id}` ✍️  (✍️ = researcher/admin).
- **reports**: `GET /summary` · `GET /export` (summary xlsx, ≤ 5,000 rows) · `GET /export/full` (denormalized full report xlsx). Currently unauthenticated.
- **users** (all admin): user CRUD, `PUT /{u}/status`, `POST /{u}/reset-password`, group CRUD/assignment.
- **admin** (admin): `GET /stats`, `GET /health`.
- **clarisa / reference / study_relations / indicators / debug**: read endpoints as listed in §2.
- App-level: `GET /health`, `GET /`, `/docs`, `/redoc`, `/openapi.json`.

**Response conventions**: raw dicts (Pydantic schemas mostly unused). Success envelope varies by endpoint; several list endpoints return `{success: false, error: …}` **with HTTP 200** on failure (see §9). Binary responses use `StreamingResponse` + `BytesIO`; xlsx content type must be in API Gateway `BinaryMediaTypes`.

## 5. Backend Workflows & Business Rules

- **Study create/upsert** (`POST /complete`, `studies.py:1111`): one request carries all three wizard steps → `INSERT … ON DUPLICATE KEY UPDATE` the studies row → **DELETE all junction rows** → insert intervention-type junction first (FK dependency) → re-insert contributors/countries/regions/impact areas (primary + secondary)/keywords/crop types/indicators → single commit. ⚠️ Each relationship insert is wrapped in try/except that only logs a warning — a save can report success with silently dropped relationships (known defect class; new work must not extend this pattern).
- **Study edit** (`PUT /{id}/complete`): same delete-all-then-reinsert pattern.
- **Study delete**: hard delete across 8 relationship tables then the study row (RDS FKs block direct delete); the `is_active` soft-delete column exists but delete is hard.
- **Full-report export** (`reports.py:407`): `SET SESSION group_concat_max_len = 1000000` → single query with correlated `GROUP_CONCAT` subqueries per relationship (chosen over JOIN+GROUP BY to avoid row explosion; ~1.5 s / 224 MB for 5,000 rows in testing) → pandas DataFrame → openpyxl → `StreamingResponse`. Cap 5,000 rows. Filename `impact_compendium_full_report_YYYYMMDD_HHMMSS.xlsx`.
- **User provisioning** (`users.py`): mostly via `CognitoUserService`; ⚠️ `create_user`/`reset_password` instantiate inline boto3 clients with a hardcoded pool-id fallback (`us-east-1_yFLIp9zBk`) — consolidate when touched. Email = username, lowercased.
- **Category mapping**: frontend sends the DB `category_id` directly (fallback 156); no mapping table in code.

## 6. Frontend Architecture & State Boundaries

- Entry `src/main.tsx`: `AuthProvider` + `BrowserRouter`; every non-`/login` route inside `ProtectedRoute`.
- **Global state = auth only**: `AuthContext` (`user {email, sub, groups}`, `isAuthenticated`, `isAdmin`, `login/logout/refreshUser`; cross-tab sync via `storage` event on `ic_access_token`). Everything else is local `useState`.
- **Services layer** (`src/services/`): `auth.ts` (Amplify/Cognito; tokens in `localStorage`), `api.ts` (`apiGet/Post/Put/Delete` with Bearer injection, base `${VITE_API_BASE_URL}/api`, central 401 → clear + redirect `/login`; `studyAPI`, `getReferenceData`), `userService.ts` (admin ops).
- **Wizard state**: `localStorage` keys `studyFormStep1/2/3` (JSON), combined into one payload on submit, cleared after success. No form library (no RHF/Zod).
- **Data fetching**: direct `apiGet` in `useEffect` + local state. No query cache/polling/optimistic layer — introducing one requires a spec-level decision.
- Utilities: `utils/http.ts` (`parseFilename` for Content-Disposition), `exportHelpers.ts`; both Vitest-tested. Only hook: `useDebouncedValue`.
- UI system: see `docs/system-design/design.md` (tokens, components, a11y rules).

## 7. Integration Points

| Integration | Mechanism |
|---|---|
| **Cognito** | Frontend: Amplify v6 (`aws-config.ts`). Backend: JWKS fetch + RS256 verification (`services/cognito_auth.py`), audience = client ID, issuer check. Mock mode auto-engages when pool/client env vars are unset (token `mock_jwt_token_12345` → canned researcher). Roles from `cognito:groups` claim. |
| **CLARISA** | Consumed as pre-loaded reference tables (`clarisa_*`); no live API calls at runtime. |
| **Secrets Manager** | `DB_PASSWORD` via `{{resolve:secretsmanager:…}}` in the SAM template. |
| **API Gateway** | REST; `BinaryMediaTypes` = xlsx MIME + `application/octet-stream`; CORS also enforced in `GatewayResponses`. |

## 8. Security & Authorization Model

- Dependencies in `middleware/auth.py`: `get_current_user` (401), `get_current_user_optional`, `require_admin` (403 unless `admin`/`administrators`), `require_researcher` (403 unless admin* or `researcher`/`researchers`).
- Enforced today: study writes → researcher+; user/group management + admin stats → admin.
- **Known gaps** (candidate security spec; see PRD Q4): study/reference/indicator/relations/debug reads and **both report exports** are unauthenticated; raw DB error strings leak in 500 responses; `debug` router exposed in prod builds.
- CORS wide open (`allow_origins=["*"]`, `allow_credentials=False`) — deliberate; OPTIONS short-circuited in middleware.
- Never commit credentials; `.env` gitignored (`SECURITY.md`).

## 9. Error Handling & Observability

- Global handlers (`app/main.py`): `HTTPException` → `{error, status_code, path}`; bare `Exception` → logged with `exc_info`, generic 500.
- **Convention drift to stop extending**: several routers catch their own exceptions and return `{success: false, error: …}` with HTTP 200 (e.g. `list_studies`); write endpoints raise `HTTPException(500, f"Database error: {e}")`, leaking driver messages. **Rule for new code**: raise proper `HTTPException`s with sanitized messages; let the global handler shape the envelope; correct status codes.
- Logging: `utils/logging.py setup_logging()`, per-module loggers; `log_requests` middleware logs every request/response with timing. Leftover `DEBUG Study {id}` info-level logs in the study detail endpoint are noise to remove when touched.
- No metrics/tracing beyond CloudWatch logs.

## 10. Testing Strategy

| Tier | Command (from tier root) | What exists |
|---|---|---|
| Backend | `make test` (`pytest tests/ -v`) | ~107 tests: studies CRUD (32), API endpoints (23), studies updated (19), reports export (10), user mgmt (7), models (6), schema changes (6), JWT (4) |
| Backend quality | `make check-all` = `lint` (flake8) + `check-format` (black 88-col, isort) + `type-check` (mypy) | configured in `pyproject.toml` / `.flake8` |
| Frontend unit | `npm run test:unit` (Vitest) | only `src/utils/*.test.ts` (http, exportHelpers) |
| Frontend e2e | `npm run test` (Playwright; scoped: `test:auth`, `test:dashboard`, `test:studies`, `test:responsive`, `test:performance`, `test:report`) | scenario suites under `Frontend/tests/` |
| Frontend build gate | `npm run build` (`tsc && vite build`) | type-checks the app |

No CI pipeline is configured — verification is run locally and must be pasted as evidence in spec execution logs.

## 11. Technical Constraints & Assumptions

1. **Lambda statelessness** — no module-level mutable state as a feature, no `BackgroundTasks` after the response, no persistent `/tmp`. Long work completes inside the request (or moves to SQS/Step Functions via a spec). Background: `specs/bugs/excel-report/`.
2. **300 s / 512 MB** budget bounds exports and heavy queries; current export cap 5,000 rows.
3. **DB pooling** (`db/connection.py`): QueuePool size 5 / overflow 10 / `pool_pre_ping` / recycle 3600 s; `get_db()` yields `None` (not an error) when the engine is unavailable — routers branch on `if db:`.
4. **`redirect_slashes=False`** — match trailing slashes exactly.
5. **Binary via API Gateway** — `StreamingResponse` + `BytesIO` + registered `BinaryMediaTypes` only.
6. **No VPC on Lambda** — keep it that way unless a spec re-architects networking (cost decision, commit `36b0aef`).
7. **Python 3.9 / FastAPI 0.104 / SQLAlchemy 2.0 text()** — pin-compatible changes only.
8. **AWS bootstrap at module load** (`app/main.py`): `AWS_PROFILE=IBD-DEV` only outside Lambda; region always set.
9. **SAM build quirks** — stale `.aws-sam/` cache and `PythonPipBuilder:CopySource` hangs; prefer `sam build --use-container` (Docker required). See `Infrastructure/CLAUDE.md`.

## 12. Known Dead Code & Drift Register

| Item | Status | Action when touched |
|---|---|---|
| `app/models/*` (ORM) | Dead; columns disagree with real schema; `clarisa_centers` defined twice | Never use as contract; deletion requires its own spec |
| `app/services/studies_service.py`, `auth_service.py` | Dead (never wired) | Same |
| `app/services/cognito_service.py` | Superseded by `cognito_user_service.py` | Consolidate |
| Most `app/schemas/*` | Unused (routers return raw dicts) | Adopt or remove per endpoint spec |
| `react-hot-toast` | Mounted, zero call sites | Remove (system-design D3) |
| `Backend/architecture/*.md`, parts of `Frontend/architecture/*.md` | Describe unshipped architecture | Read skeptically; this document wins |
