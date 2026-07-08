# Impact Compendium — System Design (UI/UX Blueprint)

| | |
|---|---|
| **Version** | 1.0 |
| **Date** | 2026-07-08 |
| **Status** | Living document — Baseline |
| **Canonical token source** | `impact-compendium-app/Frontend/src/styles/design-tokens.css` |
| **Scope note** | Documents the UI system **as shipped**, names its debts explicitly, and sets the rules new work must follow. Where shipped code deviates from tokens, the token wins for all new/modified code. |

## 1. Product Experience Principles

1. **Data-entry confidence** — the study wizard must never lose work: steps persist locally, validation is inline and field-level, and destructive actions always confirm.
2. **Portfolio at a glance** — the dashboard is the workhorse: fast search, server-side sort, expandable rows, and a slide-over detail keep analysts in one screen.
3. **One brand yellow** — CGIAR gold (`--ic-color-primary: #fdc82f`) is the single primary. New code must not introduce hardcoded hex variants (see §12 D2).
4. **Desktop-first, honest about it** — the app targets desktop analysts; responsive work is limited and deliberate, not implied.
5. **Calm feedback** — one notification pattern, short-lived, top-right; modals only for decisions.

## 2. Information Architecture

```
Login (public)
└── App (authenticated, top header shell)
    ├── Home                      — hero landing
    ├── Studies / Dashboard      — portfolio table (search, sort, paginate, expand, detail slide-over)
    │   └── Study wizard          — Step 1 (core) → Step 2 (relations) → Step 3 (indicators)
    │       ├── /studies/new/step-{1,2,3}
    │       └── /studies/edit/:id/step-{1,2,3}   (same components; :id = edit mode)
    └── Settings (admin only)     — user & group management
```

## 3. Primary User Flows

1. **Create study**: Add study → Step 1 core fields (validated) → Step 2 relationships (CLARISA lookups, multi-selects) → Step 3 indicators → single submit (`POST /api/studies/complete`) → success feedback → dashboard. Step data persists to `localStorage` (`studyFormStep1/2/3`) and clears on submit.
2. **Edit study**: dashboard row action → wizard pre-populated at Step 1 → same flow, `PUT /{id}/complete`.
3. **Find & inspect**: dashboard search (debounced, URL-synced) → sort/paginate → expand row or open slide-over detail.
4. **Export**: dashboard → Export Summary or Export Full Report → xlsx download (filename from `Content-Disposition`).
5. **Administer users** (admin): Settings → user table → create/edit modals, enable/disable, reset password, group assignment.
6. **Auth**: login → (optional) forced password change → app; forgot-password flow; 401 anywhere → token cleared → redirect `/login`.

## 4. Screen Inventory

| Route | Screen | Notes |
|---|---|---|
| `/login` | Login | Public. Split-screen image + form. Own layout. |
| `/` | Home | Hero landing inside AppLayout. |
| `/dashboard` | Dashboard | Table + expansion + `StudyDetailsPanel` slide-over + Pagination. |
| `/studies` | Studies | Currently re-exports Dashboard; nav "Studies" highlights for both. |
| `/studies/new/step-{1,2,3}` | CreateStudy Step 1–3 | Wizard; header cross-fades to `ProgressStepper`. |
| `/studies/edit/:id/step-{1,2,3}` | Same components | `:id` drives edit mode; `/studies/edit/:id` lands on Step 1. |
| `/settings` | Settings | Admin-gated (`isAdmin`); user/group management. |
| `*` | — | Redirects to `/`. |

## 5. Navigation Model

A single **fixed top header** (`HeaderBar`, `fixed top-0`, white, shadow) — **there is no sidebar** (the `--ic-sidebar-width` token and older architecture docs are vestigial):

- Left: logo → `/`.
- Center: Home · Studies · Settings (admin only). Active tab: soft gold background + gold bottom border + amber text.
- Right: "Add study" button + circular user-initials avatar menu (My Account / Settings / Log out).
- **Wizard mode**: nav cross-fades (500 ms) to `ProgressStepper`; avatar becomes a close (X).

## 6. Layout Patterns

- **`AppLayout`** (`src/layouts/AppLayout.tsx`): `min-h-screen` on `--ic-surface-muted`, HeaderBar, `<main class="max-w-[95vw] mx-auto px-4 py-4 pt-28">`. Non-form pages auto-wrap in a white card; form pages pass `hasFormFooter` to skip it.
- **`FormLayout` + `FormFooter`**: the wizard shell with sticky footer actions.
- Login and Studies render their own full-screen layouts.

## 7. Design Tokens

Canonical: `src/styles/design-tokens.css` (single `:root`). Tailwind bridges a subset in `tailwind.config.js` (`primary/accent/neutral/surface/surface-muted/border`, `fontFamily.sans`).

**Color**

| Token | Value | Use |
|---|---|---|
| `--ic-color-primary` | `#fdc82f` | Brand gold — primary actions, active states |
| `--ic-color-accent` | `#f07e28` | Orange accent, gradients |
| `--ic-color-gold` / `--ic-color-amber` | `#d19f2a` / `#b96a28` | Secondary brand, active nav text |
| `--ic-color-mustard` | `#dc9700` | Global focus outline (`global.css`) |
| `--ic-color-text` / `--ic-color-text-light` | `#1f2937` / `#6b7280` | Body / secondary text |
| `--ic-surface` / `--ic-surface-muted` | `#ffffff` / `#f9fafb` | Card / page background |
| `--ic-border` / `--ic-border-light` | `#e5e7eb` / `#f3f4f6` | Borders |
| Status | error `#dc2626` · success `#059669` · warning `#d97706` | Feedback |
| Category badges | impact `#dc2626` · outcome `#059669` · story `#2563eb` · other `#7c3aed` | Study category Badge |
| Row states | expanded bg `#fff9f0` · hover `#fff3d6` | Dashboard table |

**Typography**: `Inter, system-ui, …`; ramp 12–24 px (body 14 px, line-height 1.5); weights 400/500/600/700.
**Spacing**: 4–48 px scale. **Radius**: 4/6/8/12 px. **Shadows**: sm/md/lg. **Layout**: header 64 px. **Z-index**: header 100 · slide-over 180 · modal 200.

**Rules for new/modified code:**

1. Use `--ic-*` tokens (or their Tailwind bridges) — **no hardcoded hex**. Known shipped violations (`#FFC850` Button, `#FFC84F` HeaderBar, `#FEC750` SlideOver, `#FFF9E6`, `bg-[#F3F3F5]`, Tailwind `blue-600` accents in Table) are debt to converge toward `#fdc82f`/tokens whenever a file is touched.
2. New semantic needs → add a token to `design-tokens.css` first, then use it.
3. Reviewers reject hardcoded colors/sizing that bypass tokens.

## 8. Component Inventory

**Primitives — `src/components/ui/`** (33 files; barrel `index.ts` exports 14):

- **Form**: `Button` (primary/secondary/ghost · sm/md/lg — no danger variant), `Input`, `Textarea`, `Select` (native), `CustomSelect`, `SearchableSelect`, `MultiSelect`, `DatePicker`, `YearPicker`, `Chip`.
- **Data**: `Table` (sortable, expandable, drag-to-reorder columns — currently domain-hardwired to study column keys), `TableSkeleton`, `Pagination`, `Badge`, `Card`, `EmptyState`, `Tooltip`.
- **Overlays/feedback**: `ConfirmDialog` (danger/warning/info), `ConfirmationModal`, `ContactModal`, `SuccessModal`, `SuccessNotification`, `Notification` (the real toast system), `SlideOver` (right drawer, Esc-close, scroll-lock).
- **Chrome**: `HeaderBar`, `Footer`, `FooterBar` (exported as `FormFooter`), `ProgressStepper`, `StudyContextHeader`, `EnvironmentBanner`.

**Feature components**: `ProtectedRoute`, `ForgotPassword`, `PasswordChange`; `settings/` (`UserManagement`, `UserTable`, `GroupManagement`, `CreateUserModal`, `EditUserModal`).

**Composition rules**: prefer existing primitives; extend `ui/` (and its barrel) rather than one-off styling in pages; new overlay components must follow §10's dialog accessibility rules.

## 9. Responsive Behavior

Shipped state: desktop-first and thin — `lg:` ×29, `sm:` ×8, zero `md:`; only Login/Home adapt; tables rely on `overflow-x-auto`; no mobile nav.

**Rules**: don't mix fixed pixel widths with responsive classes in new code; wide content scrolls in its own container; treat true mobile support as a scoped future feature, not an incidental promise.

## 10. Accessibility Expectations

Shipped: global mustard focus ring; `aria-sort` on table headers; keyboard support for table sort/expand and SlideOver Esc-close; semantic landmarks (`header/nav/main/table`); icon buttons carry `title`.

**Required for all new/modified UI** (gap-closing rules):

1. Dialogs/drawers: `role="dialog"`, `aria-modal="true"`, focus trap, focus restore on close.
2. Menus: `aria-haspopup`/`aria-expanded` on the trigger (user avatar menu is the known offender).
3. Active nav links: `aria-current="page"` (derive from router state, not `window.location`).
4. Respect `prefers-reduced-motion` for transitions ≥ 200 ms.
5. Interactive elements keyboard-reachable with a visible focus state.
6. Target: WCAG 2.1 AA for touched surfaces (no automated a11y tests exist yet — see §13).

## 11. Dark Mode Behavior

**None.** No `darkMode` key in Tailwind config; `design-tokens.css` has a single `:root` with no dark variant. Decision D4: dark mode is explicitly out of scope until a feature spec introduces token-level dark values — do not add ad-hoc `dark:` classes.

## 12. Design Decisions

| ID | Decision | Rationale |
|---|---|---|
| D1 | Top-header navigation, no sidebar | Shipped reality; sidebar tokens/docs are vestigial. Retire sidebar references rather than build one. |
| D2 | `#fdc82f` (`--ic-color-primary`) is the single brand gold | Four shipped variants are debt; converge when touching a file, never add a fifth. |
| D3 | `Notification` (bespoke, top-right, 4 s auto-dismiss) is the toast system | `react-hot-toast` is mounted but has zero call sites — dead weight to remove, not adopt. |
| D4 | No dark mode | See §11. |
| D5 | Wizard state persists in `localStorage`, submitted as one atomic payload | Simple, survives navigation, no form library. RHF/Zod from older docs are **not** used — don't introduce them piecemeal. |
| D6 | Data fetching = `apiGet` in `useEffect` + local `useState`; global state is auth only (`AuthContext`) | No query cache/polling layer exists; adding one is a scoped architectural decision, not incidental. |
| D7 | Field-level validation: `error` prop → red border + inline message + asterisk for required | Consistent across `Input`/`Select`; wizard gates step progression on validity. |
| D8 | Loading = `TableSkeleton` / disabled-button states; empty = `EmptyState` | Uniform feedback vocabulary. |

## 13. Open Gaps / Open Questions

1. Consolidate the overlapping feedback components (`Notification`, `SuccessNotification`, `SuccessModal`, `ConfirmDialog`, `ConfirmationModal`) into a smaller set; remove dead `react-hot-toast`.
2. Generalize `Table` (currently hardcodes study column keys) or rename it `StudiesTable` honestly.
3. Complete the `ui/index.ts` barrel (14/33 exported) and standardize import style.
4. Off-brand `blue-600` accents in Table sort/expand — retoken.
5. Older architecture docs (`Frontend/architecture/*.md`) describe shadcn/Radix, a sidebar, RHF/Zod, and hooks that don't exist — trust their token names/field mapping, treat the rest as stale.
6. No automated accessibility tests despite the WCAG 2.1 AA target.
