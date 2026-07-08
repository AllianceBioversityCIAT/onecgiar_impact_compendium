# AGENTS.md — Impact Compendium

Guide for AI coding agents (Claude Code, OpenCode, Antigravity, etc.) working in this repository. Human-oriented detail lives in [`README.md`](README.md); Claude-specific depth in [`CLAUDE.md`](CLAUDE.md).

## What this project is

CGIAR research impact study management platform: FastAPI (Python 3.9) on AWS Lambda + React 18/TypeScript/Vite frontend + AWS SAM infrastructure. Region `us-east-1`, environments `testing`/`prod`, local AWS profile `IBD-DEV`.

## Constitutional baseline (SDD)

These four artifacts are the source of truth for all spec-driven work. Read the relevant one **before** proposing, specifying, or implementing changes:

1. **[`docs/prd.md`](docs/prd.md)** — product scope, personas, acceptance criteria, open questions. Consult when deciding *what* to build.
2. **[`docs/system-design/design.md`](docs/system-design/design.md)** — UI/UX system: `--ic-*` design tokens (brand gold `#fdc82f`), component inventory, top-header navigation (no sidebar), accessibility rules, explicitly **no dark mode**. Consult for any UI change.
3. **[`docs/detailed-design/detailed-design.md`](docs/detailed-design/detailed-design.md)** — the technical blueprint *as it actually runs*: raw-SQL data model, API surface, auth model, Lambda constraints, dead-code/drift register. Consult for any backend/API/data change.
4. **[`docs/specs/general-setup/`](docs/specs/general-setup/)** — mandatory formats for spec files (`requirements.md`, `design.md`, `task.md` covering tasks + execution logs).

**Module specs** live under `docs/specs/{features,bugs,enhancements}/<kebab-slug>/` as a 4-file set (requirements / design / tasks / execution) sharing a 3-letter uppercase PREFIX (e.g. `FR-EXR-002`, `EXR-T1`). Root `specs/` is the legacy archive — reference only; its `data/` SQL dump is the authoritative DB schema.

## Multi-agent execution (`.agents/`)

`/sdd-execute` runs a Leader → Implementer → Reviewer loop defined by:

- [`.agents/leader.md`](.agents/leader.md) — orchestration, task selection, 3-attempt rework ceiling, execution audit trail, `[SPEC:<type>/<slug>] <message>` commit standard, Pivot Protocol.
- [`.agents/implementer.md`](.agents/implementer.md) — implementation rules: no scope creep, design-token discipline, backend reality rules, verification before reporting.
- [`.agents/reviewer.md`](.agents/reviewer.md) — read-only audit with structured PASS/FAIL output.

## Non-negotiable ground truths

1. **The ORM is dead code.** All runtime queries are raw SQL via SQLAlchemy `text()`. `app/models/` column names disagree with the real database — never derive contracts from them.
2. **Lambda is stateless**: 300 s / 512 MB; no post-response background work; no persistent `/tmp`; binary responses via `StreamingResponse` + API Gateway `BinaryMediaTypes`.
3. **`redirect_slashes=False`** — trailing slashes in routes are load-bearing; match existing paths exactly.
4. **Design tokens only** — no hardcoded hex colors in frontend changes (`src/styles/design-tokens.css` is canonical).
5. **Never commit credentials**; `.env` is gitignored (`SECURITY.md`).

## Verification commands (no CI — evidence goes in `execution.md`)

| Tier | From | Commands |
|---|---|---|
| Backend | `impact-compendium-app/Backend/` | `make test` · `make check-all` (black 88-col + isort + flake8 + mypy) |
| Frontend | `impact-compendium-app/Frontend/` | `npm run test:unit` (Vitest) · `npm run lint` · `npm run build` · `npm run test` (Playwright, scoped `test:<area>`) |
| Local run | `impact-compendium-app/` | `./scripts/start_local.sh` (frontend :5173, backend :8000) |

## CodeGraph

`.codegraph/` is initialized (generated database gitignored). Prefer `codegraph_search` / `codegraph_callers` / `codegraph_callees` / `codegraph_impact` over text search for symbol lookup, call tracing, and change-impact analysis. Re-index with `codegraph index` after large structural changes.
