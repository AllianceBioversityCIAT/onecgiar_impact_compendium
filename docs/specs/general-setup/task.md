# General Setup — `tasks.md` & `execution.md` Template & Execution Standards

> Methodology template for the Impact Compendium. Every spec's `tasks.md` MUST follow this format, and execution MUST be logged in `execution.md` as defined below (standardized from the two legacy specs — the per-task log wins, with the feature spec's Blockers/Assessment sections folded in).

## `tasks.md` structure

```markdown
# Tasks — <Feature|Bug Fix|Enhancement>: <Name> (<PREFIX>)

## Document Control
| Version | Date | Author | Status | Source |
(Source: ./requirements.md, ./design.md)

## Legend
- Status: `[ ]` not started · `[~]` in progress · `[x]` done
- Size: S (≤2h) · M (2–4h) · L (4–8h) · XL (8h+)
- Skills: only agent skills actually applicable to this repo
  (e.g. api-design-principles, aws-serverless, error-handling-patterns,
   tailwind-design-system, vercel-react-best-practices — never list N/A entries)

## Phase 1 — <name, e.g. Backend>
### <PREFIX>-T1 · <Title>
- **Status:** `[ ]`
- **Skills:** `<skill>`, `<skill>`
- **Size:** S|M|L|XL
- **Dependencies:** — | <PREFIX>-T<n>[, ...]
- **Requirements covered:** FR-<PREFIX>-NNN, ...
- **Design Ref:** §6.1, §7.2
- **Verification:** <exact command, e.g. `cd impact-compendium-app/Backend && make test`>

**Scope**
<what to build — bounded, no scope creep>

**Tests**
<what test coverage this task adds/updates>

**Done when**
<observable completion criteria>

## Dependency Graph        (ASCII)
## Task Summary            (table: ID | Title | Size | Status)
## Requirement Coverage Matrix   (every FR/NFR ID → covering task; full coverage asserted)
```

### Task rules

1. **One ID scheme everywhere**: tasks are `<PREFIX>-T<n>` in `tasks.md`, `execution.md`, and commits alike (the legacy `TASK-` prefix in execution logs is retired).
2. **Verification is per-task and explicit** — the exact command lives in the task metadata. Canonical commands:
   - Backend: `make test`, `make check-all` (from `impact-compendium-app/Backend/`)
   - Frontend: `npm run test:unit`, `npm run lint`, `npm run build`; e2e `npm run test` or a scoped `test:<area>` (from `impact-compendium-app/Frontend/`)
3. **Coverage matrix is mandatory** — every requirement maps to ≥ 1 task before the spec is Approved.
4. **Status-sync is a gate, not a task**: whoever flips the last task to `[x]` MUST in the same commit update the Document Control Status of all four spec files. Never create a "flip statuses" task (legacy FFR-T7 failure mode).
5. Phases group by tier (Backend → Frontend → Tests/Docs is the usual order); dependencies point only backwards or sideways within a phase.

## `execution.md` structure (the audit trail)

```markdown
# Execution Log — <Name> (<PREFIX>)

## Document Control
| Spec | Started | Last Updated | Status |

## Task Execution History
### <PREFIX>-T<n>: <title>       ← one block per task attempt/completion
- **Status:** Completed | Halted (rework ceiling) | Pivoted
- **Date:** YYYY-MM-DD
- **Attempts:** N (Reviewer PASS on attempt N | HALTED after 3 FAILs)
- **Files Changed:** path — one-line why (each)
- **Decisions Made:** ...
- **Issues Encountered:** ...
- **Reviewer Findings:** final PASS summary, or the outstanding FAIL items
- **Verification:** verbatim command(s) + outcome (paste evidence, e.g.
  "`python3 -m pytest tests/test_reports_export.py -q` passed with 5 tests")

## Pivot Records                  (only if the Pivot Protocol fired)
### Pivot Record: <PREFIX>-T<n>
- **Evidence the spec is wrong:** ...
- **Escalation outcome:** ...

## Blockers                       (open impediments, or "None")
## Current Assessment             (short honest status of the whole spec)
```

### Execution rules

1. **Every loop iteration is logged** — including FAILed attempts, with the Reviewer's structured feedback.
2. **Verification evidence is verbatim** — command + real output summary; "tests pass" without evidence is a FAIL.
3. **Status vocabulary mapping** (one concept, three surfaces): task `[x]` ⇔ execution block `Completed` ⇔ (when all tasks done) Document Control `Implemented`.
4. **Commit standard**: `[SPEC:<type>/<slug>] <message>` (e.g. `[SPEC:features/full-report-export-v2] add GROUP_CONCAT export query`). One task's work per commit where practical.
5. No CI exists — the pasted verification evidence in `execution.md` IS the quality record. Treat it accordingly.
