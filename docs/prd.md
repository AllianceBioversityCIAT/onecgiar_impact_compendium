# Impact Compendium — Product Requirements Document

| | |
|---|---|
| **Version** | 1.0 |
| **Date** | 2026-07-08 |
| **Status** | Living document — Baseline |
| **Owner** | CGIAR Alliance Bioversity & CIAT |
| **Scope note** | Describes the product as **shipped today**, plus explicitly-labeled open questions. Aspirational features from `specs/architecture/impact_compendium_technical_spec.md` (viewer role, MFA, audit logs, dashboards, PowerBI, mobile) are listed under Roadmap Candidates, not requirements. |

## 1. Overview & Purpose

The Impact Compendium is a web platform for CGIAR / Alliance Bioversity & CIAT to **register, manage, search, and export research impact studies** together with their indicators and contextual metadata (impact areas, countries, regions, contributing centers/initiatives, crops, keywords, intervention types).

It serves as the single authoritative catalog of CGIAR impact evidence, supporting evidence-based decision-making and cross-initiative knowledge sharing.

## 2. Problem Statement

CGIAR's agricultural-research impact evidence is scattered and unstructured. Before the Compendium, analysts had to inspect studies one-by-one to read multi-value attributes (regions, impact areas, contributors, indicators), and there was no consistent, exportable view of the portfolio. The product centralizes this evidence into one structured, searchable, exportable repository.

## 3. Target Personas

Grounded in the implemented role model (Cognito groups enforced in `Backend/app/middleware/auth.py`):

| Persona | Cognito group(s) | What they do in the product |
|---|---|---|
| **Researcher** (default for new users) | `researcher`/`researchers` | Creates and edits impact studies through the 3-step wizard; browses and searches the portfolio; exports reports. |
| **Administrator** | `admin`/`administrators` | Everything a Researcher does, plus user lifecycle management (create/enable/disable/delete, password resets), group management, and admin stats/health views. |
| **Research analyst / reviewer** (consumer, no dedicated role) | any authenticated user | Searches, filters, reads study detail, and downloads Excel exports (summary and full report) for analysis outside the app. |

> A read-only **Viewer** role is described in the technical spec but **does not exist in code** — see Open Questions Q1.

## 4. Goals & Success Metrics

**Goals** (from `specs/architecture/impact_compendium_technical_spec.md` §1):

1. Streamline collection of impact-study data via structured, validated forms.
2. Improve data quality and comparability across initiatives.
3. Make the evidence base searchable and exportable for analysts and reviewers.
4. Support evidence-based decisions and cross-initiative collaboration.

**Success metrics** — ⚠️ *proposed, not yet validated with stakeholders* (see Q5):

| Metric | Proposed target |
|---|---|
| Studies registered in the compendium | Growing quarter-over-quarter |
| Full-report export completes within Lambda limits | ≤ 5,000 rows, < 300 s, < 512 MB (hard platform cap — verified) |
| Study creation wizard completion (Step 1 → submit) | No abandonment caused by data loss (steps persist locally) |
| API latency / page load | < 500 ms API, < 2 s page (aspirational targets from spec §9, unmeasured) |

## 5. Scope

### In scope (shipped)

- Cognito-backed authentication (login, forgot password, forced password change); all non-`/login` routes protected.
- 3-step study create/edit wizard (`/studies/new/step-{1,2,3}`, `/studies/edit/:id/step-{1,2,3}`) submitting as one atomic `POST /api/studies/complete`.
- Dashboard browse: debounced URL-synced search, server-side sort, pagination, expandable rows, slide-over study detail.
- Study relationships: impact areas (primary/secondary), countries, regions, contributors (centers + initiatives), crop types, keywords, intervention types, indicators.
- CLARISA-sourced reference data (centers, initiatives, regions, countries, impact areas).
- Excel exports: **Export Summary** (`GET /api/reports/export`) and **Export Full Report** (`GET /api/reports/export/full`, one row per study, multi-value relations collapsed into delimited cells), both capped at 5,000 rows.
- Admin user & group management via Cognito.

### Out of scope (explicitly deferred — sources: `specs/features/full-report-export-v2/`, `specs/bugs/excel-report/`)

- CSV/JSON export (xlsx only).
- Async/S3-based export and export job history (Lambda statelessness; 5,000-row cap fits synchronous limits).
- Filter-before-export.
- Rewriting the stale ORM layer as part of feature work (full report intentionally uses raw SQL against the real schema).
- Mobile-first UI (current app is desktop-first).

## 6. User Stories

1. As a **Researcher**, I can create a study in three guided steps — core fields, then relationships, then indicators — without losing progress if I navigate between steps, so that data entry is complete and structured.
2. As a **Researcher**, I can edit an existing study through the same wizard, so that corrections follow the same validation path as creation.
3. As any **authenticated user**, I can search, sort, and paginate the study portfolio and open a study's full detail in a slide-over panel, so that I can find evidence quickly.
4. As a **Research analyst**, I can download a full Excel report where each study is one row with its multi-value attributes collapsed into cells, so that I can analyze the portfolio without opening studies one-by-one.
5. As an **Administrator**, I can create, disable, and delete users, reset passwords, and manage group membership, so that access stays controlled without AWS console work.
6. As a **Researcher**, I select impact areas, countries, regions, centers, and initiatives from CLARISA-controlled vocabularies, so that studies are comparable across initiatives.

## 7. Acceptance Criteria (portfolio-level)

- **AC-1** A study created via the wizard persists its core row and *all* selected relationships; a save reported as successful SHALL NOT silently drop relationships (known gap — see `docs/detailed-design/detailed-design.md` §9).
- **AC-2** The full-report export downloads as a valid `.xlsx` (openable in Excel, correct magic bytes) with the filename pattern `impact_compendium_full_report_YYYYMMDD_HHMMSS.xlsx`, for portfolios up to 5,000 studies.
- **AC-3** Study write operations require the researcher (or admin) role; user-management operations require the admin role; unauthenticated requests to protected endpoints receive 401.
- **AC-4** Study IDs surface to users in the `ICD-###` format everywhere they appear.
- **AC-5** Wizard step data survives navigation between steps within a session (localStorage persistence) and is cleared after successful submission.

## 8. Assumptions, Dependencies & Constraints

| ID | Type | Statement |
|---|---|---|
| A1 | Assumption | The real MySQL schema (see `specs/data/` dump) is authoritative; the SQLAlchemy ORM models are stale and must not be treated as the data contract. |
| A2 | Assumption | Any authenticated user may read all studies; write requires researcher+. Reads on several endpoints are currently unauthenticated (gap — Q4). |
| D1 | Dependency | **CLARISA** — CGIAR's controlled-vocabulary service supplies centers, initiatives, regions, countries, impact areas. |
| D2 | Dependency | **AWS Cognito** — all authentication and role membership. Emails are lowercased to avoid case-sensitivity login failures. |
| C1 | Constraint | Lambda: 300 s timeout, 512 MB, stateless (no post-response work, no persistent `/tmp`) — drives the 5,000-row export cap and synchronous export design. |
| C2 | Constraint | Lambda runs **outside any VPC**; RDS is publicly accessible by design (no NAT cost). |
| C3 | Constraint | API Gateway `BinaryMediaTypes` must include the xlsx MIME type or downloads corrupt. |

## 9. Open Questions

| ID | Question |
|---|---|
| Q1 | Is a read-only **Viewer** role intended product scope, or should the spec's RBAC section be retired? |
| Q2 | Is study "type" a fixed three-value taxonomy (Impact Study / Outcome Study / Impact Outcome Story) or the data-driven `category_id` the schema implements? Which is canonical? |
| Q3 | The model stores `status = draft` but no publish/archive workflow exists. Is a study lifecycle (draft → published → archived) real scope? |
| Q4 | Should read endpoints (study list/detail, reference data, **report exports**) require authentication? They currently do not. |
| Q5 | What are the real adoption/usage KPIs? None are defined beyond aspirational load targets. |
| Q6 | Are audit logging, version history, and MFA (present in the technical spec, absent in code) committed scope? |

## 10. Roadmap Candidates (aspirational — from technical spec §13, uncommitted)

PRMS/ROAR sync · PowerBI connector · automated CLARISA sync · mobile app · AI-assisted indicator extraction · publication approval workflows.
