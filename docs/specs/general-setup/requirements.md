# General Setup — `requirements.md` Template & Writing Standards

> Methodology template for the Impact Compendium. Every spec's `requirements.md` under `docs/specs/<type>/<slug>/` MUST follow this format. It codifies (and standardizes) the conventions established in `specs/bugs/excel-report/` and `specs/features/full-report-export-v2/`.

## Spec taxonomy & naming

- New specs live under **`docs/specs/{features,bugs,enhancements}/<kebab-slug>/`** (root `specs/` is the legacy archive — read-only reference).
- Slug: descriptive kebab-case; version suffix allowed (`full-report-export-v2`).
- Each spec declares a **3-letter uppercase PREFIX** (e.g. `EXR`, `FFR`) that threads through every ID in all four files.
- A complete spec = `requirements.md` + `design.md` + `tasks.md` + `execution.md` (created at execution time).

## Required document structure

```markdown
# Requirements — <Feature|Bug Fix|Enhancement>: <Name> (<PREFIX>)

## Document Control
| Version | Date | Author | Status | Source |
(Status enum — use exactly one of:)
Draft | Approved | In Progress | Implemented | Implemented — verification gaps | Superseded

## References
| ID | Reference | Location |
R1..Rn — every claim about existing behavior cites exact `path:line`.

## 1. Executive Summary
## 2. Glossary
## 3. System Context & Scope
   ### 3.1 In Scope        (table)
   ### 3.2 Out of Scope / Deferred   (table, with reason)
## 4. Data Model Reference   (OPTIONAL — omit the section body but keep the
                              heading with "N/A" if not needed; never renumber)
## 5. Stakeholders
## 6. Functional Requirements
## 7. Non-Functional Requirements
## 8. Requirement ID Index   (table: every ID → one-line summary)
## 9. Assumptions & Open Questions   (A1.., Q1.. labels)
```

Section numbers are **fixed slots** — optional sections say "N/A" rather than shifting numbering (this fixes the drift between the two legacy specs).

## Requirement writing rules

1. **Tables, grouped by sub-area**, columns: `ID | Requirement | Priority | Source`.
2. **EARS phrasing** with capitalized modal verbs: `SHALL` (mandatory), `SHOULD` (recommended). Event-driven form where applicable: "WHEN <trigger>, the system SHALL <response>."
3. **IDs**: `FR-<PREFIX>-NNN` (functional) / `NFR-<PREFIX>-NNN` (non-functional), 3-digit zero-padded, numbered in **gapped blocks per area** (e.g. 001–009 user-facing, 010–019 backend, 020–029 frontend) so areas can grow without renumbering.
4. **Priority**: `Must` | `Should` only.
5. **Source**: cite a Reference ID (`R2`), a `path:line`, or the requesting stakeholder — never leave blank.
6. Requirements must be **testable** — no vague adjectives ("fast", "intuitive") without a measurable bound.
7. Ground every "existing behavior" claim in code reality. This codebase has known doc/code drift (dead ORM, aspirational architecture docs) — cite the raw SQL / actual component, and check `docs/detailed-design/detailed-design.md` §12 before trusting any older doc.

### Example (verbatim style)

```markdown
| FR-EXR-002 | The downloaded filename SHALL follow the pattern `impact_compendium_full_report_YYYYMMDD_HHMMSS.xlsx` using the server's timestamp at generation. | Must | Existing behavior (reports.py:217) |
```

## Constitutional alignment checklist (before marking Approved)

- [ ] Consistent with `docs/prd.md` scope and personas (or updates it).
- [ ] UI requirements reference tokens/components from `docs/system-design/design.md`.
- [ ] Technical claims consistent with `docs/detailed-design/detailed-design.md` (esp. §1.1 raw-SQL truth, §11 Lambda constraints).
- [ ] Every FR/NFR appears in the Requirement ID Index.
- [ ] Open questions that block design are answered or explicitly accepted as risks.
