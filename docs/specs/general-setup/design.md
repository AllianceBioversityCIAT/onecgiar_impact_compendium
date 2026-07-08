# General Setup — `design.md` Template & Writing Standards

> Methodology template for the Impact Compendium. Every spec's `design.md` MUST follow this format (codified from `specs/bugs/excel-report/design.md` and `specs/features/full-report-export-v2/design.md`).

## Required document structure

```markdown
# Design — <Feature|Bug Fix|Enhancement>: <Name> (<PREFIX>)

## Document Control
| Version | Date | Author | Status | Source requirements |
(Same Status enum as requirements.md; Source requirements = ./requirements.md)

## 1. Executive Summary
## 2. Root Cause                (bug specs only — table with `path:line` evidence;
                                 feature specs write "N/A")
## 3. Architecture Overview     (ASCII Before/After diagrams when structure changes)
## 4. Extended Directory Structure
     File tree of every touched path, annotated with the legend:
     [E] existing · [M] modified · [N] new · [D] deleted
## 5. Data Model                (real schema — column names from raw SQL / specs/data dump,
                                 NEVER from app/models/)
## 6. API Design                (tables: endpoints kept / modified / new / deleted,
                                 each row mapped to Requirement IDs; exact trailing slashes)
## 7. Backend Module Design     (SQL sketches + Python handler sketches)
## 8. Frontend Component Architecture   (TS sketches; tokens + components from
                                          docs/system-design/design.md)
## 9. Design Decisions
     Table D1..Dn: Decision | Rationale | Trade-off / Alternative considered
```

Fixed section slots — inapplicable sections carry "N/A", never renumber.

## Design writing rules

1. **Traceability**: every API/data/UI element maps back to Requirement IDs (`FR-<PREFIX>-NNN`). Anything unmapped is scope creep — cut it or add the requirement first.
2. **Cite reality**: `path:line` for existing code; `§` references for cross-file sections; relative links (`./requirements.md`).
3. **Respect the constitution**:
   - Data contracts from the real schema (`docs/detailed-design/detailed-design.md` §3), not the dead ORM.
   - Lambda constraints (§11): synchronous work ≤ 300 s / 512 MB; no post-response tasks; binary via `StreamingResponse` + `BinaryMediaTypes`.
   - Error handling: raise sanitized `HTTPException`s; correct status codes; never the `{success:false}`-with-200 pattern (§9).
   - UI: `--ic-*` design tokens only, existing `ui/` primitives first, dialog a11y rules (`docs/system-design/design.md` §7–§10).
   - Route paths must match `redirect_slashes=False` exactly.
4. **Design Decisions table is mandatory** — capture rejected alternatives; future specs rely on it.
5. Diagrams are ASCII-in-markdown (renders everywhere, diffable).

## Constitutional alignment checklist (before marking Approved)

- [ ] Every requirement in `./requirements.md` is addressed or explicitly deferred with a decision entry.
- [ ] No contract derived from dead code (detailed-design §12 register checked).
- [ ] New/changed endpoints listed with auth dependency (`get_current_user` / `require_researcher` / `require_admin`) stated explicitly.
- [ ] UI changes name the exact tokens/components they use.
- [ ] Verification approach identified per module (which `make` target / npm script proves it).
