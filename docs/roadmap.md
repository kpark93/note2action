# note2action — Roadmap & Learning Plan

This turns the original rough outline into a module-by-module plan, written
for a beginner. Each module says **what you build**, **what you learn**, and
**how you prove it works**. Modules are ordered so each one stands on the
last — don't skip ahead past an unproven module.

**Status legend:** ✅ done · 🔶 partially done · ◻ not started

**You are here → end of Phase A (Modules 1–7). Next up: Module 8.**

---

## Phase 0 — The product (the "why" behind every module)

A meeting-notes-to-action-items app, three core screens:

1. **Capture** — paste raw meeting notes, hit "Extract action items."
2. **Review** — extracted items as editable cards (title, owner, due date,
   priority, confidence badge; low-confidence items flagged). The core screen.
3. **Tasks** — a table of saved items with inline status dropdown and
   owner/status filters.

Style: clean and utilitarian like Linear — neutral grays, one accent color,
generous whitespace, strong type hierarchy, no gradients or decorative icons.

---

## Phase A — Foundations (build the skeleton, then the product UI)

### Module 1 — Monorepo scaffold ✅

**Build:** the `my-platform` layout — pnpm workspaces for the JS/TS apps
(`apps/web`, `apps/ai`, `packages/shared`); the Python app (`apps/api`)
deliberately **outside** the workspace, managed by `uv` with a
`pyproject.toml`; `docker-compose.yml` running all three; root `package.json`
scripts (`dev`, `dev:down`, `dev:local`, `lint`, `test`); README with
prerequisites, quickstart, and a port table.

**Learn:** what a _monorepo_ is (one repository holding several apps), what a
_workspace_ is (pnpm treating those apps as linked packages), and why Python
stays out of it (JS monorepo tooling and Python don't mix — `uv` + root
scripts is the clean seam).

**Ports (chosen to not collide with other local projects):** web 5173,
api 8000, ai 3000.

**Prove it:** `pnpm dev` (Docker) and `pnpm dev:local` (native) both bring up
all three apps.

### Module 2 — Three services that prove they're alive ✅

**Build:**

- `apps/api` — FastAPI + uvicorn: `/api/health` and a stub `GET /api/items`,
  persistence behind an in-memory _repository class_ (a Python class that
  stores data in a list, shaped so a real database can replace it later
  without touching the endpoints). One pytest per endpoint.
- `apps/web` — React 19 + Vite + TypeScript, with a Vite _dev-server proxy_
  so `/api/*` forwards to FastAPI (no CORS configuration needed in dev).
  The sidebar health dot is the health check wired into real UI.

**Prove it:** health dot goes green; `pnpm test` passes the API tests.

### Module 3 — The AI service ✅

**Decision (from the outline): Vercel AI SDK in Next.js vs FastAPI → Next.js
won.** Keeping AI in its own Next.js app isolates the Vercel AI SDK, its env
keys, and its deploy story from the rest of the stack.

**Build:** `apps/ai` — Next.js App Router with `/api/chat` (`streamText` +
`useChat` demo page) and `/api/extract` (turns raw notes into structured
action items). Provider lives in `lib/provider.ts` — Anthropic by default,
swappable. `.env.example` checked in, `.env` gitignored. The web app reaches
it through a second Vite proxy: `/ai-api/*` → ai service.

**Prove it:** a streamed chat reply works; pasting notes in Capture returns
typed action items.

### Module 4 — Shared contracts ✅

**Build:** `packages/shared` — zod _schemas_ (runtime validators that also
generate TypeScript types) for the shapes both apps must agree on:
`HealthResponse`, `ExtractRequest`/`ExtractResponse`, the Item type. The web
app validates every API/AI response against these, so a drifting backend
surfaces at the boundary instead of deep inside the UI.

**Learn:** why one shared schema beats two hand-written copies of a type.

### Module 5 — The product UI ✅

**Build:** the three screens (plus Home and History, which the product grew):
Capture → Review → Tasks flow, editable Review cards with confidence pills,
Tasks table with inline status select and filters, History with stat tiles.
State: **zustand** stores (shared `actionItems` store + tiny per-view
stores); **TanStack Query** for server data (health); **Tailwind CSS v4** for
styling.

**Prove it:** the full loop works — paste notes, extract, review/edit, save
to tasks, complete to history.

### Module 6 — shadcn/ui + design tokens ✅

**Build:** shadcn/ui adopted across the app (button, input, textarea, select,
dialog, badge, card, separator, label, progress). Theme built as CSS
_design tokens_ — named `--variables` in `global.css` (colors, light + dark
values) that every component references instead of hard-coding colors — the
tweakcn workflow from the outline. Theme choice persists via localStorage +
a pre-paint script in `index.html` (no flash).

**Learn:** `components/ui/` is vendored code you regenerate, not edit
casually; tokens are why the whole app re-themes from one file.

### Module 7 — Code hygiene & structure ✅ _(added mid-project — done 2026-08-14)_

**Build:** the conventions the codebase now enforces:

- `components/ui/` (shadcn primitives) vs `components/app/` (our components)
- **Three-file rule** for views: only `<name>.view.tsx`, `<name>.utils.ts`,
  `<name>.store.ts` in each `views/<name>/` folder
- kebab-case filenames everywhere; layout wrappers (`ViewShell`,
  `ScrollRegion`, `Toolbar`) and repeated patterns (pills, headers, filter
  selects) extracted into components
- `memory.md` change journal, auto-enforced by Claude Code hooks in
  `.claude/settings.json`

**Learn:** when to extract a component (duplication / self-contained logic /
unreadable parent) and when not to ("lots of JSX" alone is not a reason).

---

## Phase B — Backend depth (make the data real)

### Module 8 — Design docs before code ◻ ← **NEXT**

**Build (docs only, in `docs/`):**

1. `docs/architecture/overview.md` 🔶 — the overall mermaid diagram exists;
   extend it, and add **one mermaid diagram per service** showing how that
   service works inside (web: view → store → api layer; api: router →
   repository → db; ai: route → provider → model).
2. `docs/api-design.md` ◻ — every endpoint the product needs: method, path,
   request/response shape (reference the zod/pydantic schemas), error cases.
   Design the _contract_ before writing handlers.
3. `docs/database-schema.md` ◻ — the tables as a mermaid **ER diagram**
   (entity-relationship: boxes for tables, lines for foreign keys). Start
   small: `users`, `meetings`, `action_items` (+ status/priority as
   constrained text). Note which columns exist because of the UI (confidence,
   saved, completed date).

**Learn:** why contracts and schemas are designed on paper first — changing a
diagram is free; changing a migrated table is not.

**Prove it:** you can trace every UI field to a column and every UI action to
an endpoint.

### Module 9 — Postgres + migrations + settings ◻

**Build:**

- Add a `postgres` service to `docker-compose.yml` (pick a host port that
  doesn't collide with other local projects — 5432 was verified free here,
  so we use the default; 5433 is the usual fallback). ✅ done 2026-08-17
- In `apps/api`: **SQLAlchemy** (the ORM — maps Python classes to tables),
  **Alembic** (its _migration_ tool — versioned scripts that evolve the
  schema; note Alembic is the migration tool, not the ORM itself),
  **pydantic-settings** (typed config: the database URL and secrets come from
  env vars, validated at startup).
- Implement the Module 8 schema as models + an initial Alembic migration.
- Swap the in-memory repository class for a Postgres-backed one — the
  endpoints shouldn't change, which is exactly why Module 2 hid persistence
  behind a repository.

**Prove it:** `alembic upgrade head` creates the tables; API tests still pass
(run against a test database or keep the in-memory repo for unit tests).

### Module 10 — Wire the frontend to real persistence ◻

**Build:** replace "items live in browser memory" (they currently vanish on
refresh — only the theme persists) with API calls:

- API: real CRUD for action items (`POST/GET/PATCH /api/items`).
- Web: TanStack Query _mutations_ for save/update/complete, with the zustand
  store shrinking to genuinely client-side state (drafts, filters, UI flags).

**Prove it:** refresh the page — your tasks are still there.

### Module 11 — Database & API tooling literacy ◻

**Build (skills, not code):**

- **DBeaver:** install, connect to the Dockerized Postgres, then save an item
  in the app and watch the row appear in DBeaver.
- **Postman:** a collection for the API — call endpoints directly, save
  example requests, develop against the API without the UI in the way.

**Prove it:** you can answer "is this bug in the UI or the API?" by hitting
the endpoint in Postman and checking the row in DBeaver.

### Module 12 — Authentication ◻

**Build:**

- **Clerk** (clerk.js) in the web app: sign-in/up, user context.
- **Request-header middleware** in FastAPI: every request carries the Clerk
  token in a header; middleware verifies it and attaches the user identity to
  the request. Unauthenticated requests get 401.

**Learn:** what _middleware_ is (code that runs on every request before your
endpoint does) and why the backend must verify tokens itself — never trust
the frontend.

**Prove it:** the same Postman call succeeds with a token and fails without.

### Module 13 — Postgres Row-Level Security ◻

**Build:** RLS _policies_ — rules the database itself enforces about which
rows a user may see/change (e.g. `user_id = current_user`), so even a buggy
endpoint can't leak another user's items. Set the user id per-connection from
the verified identity in Module 12's middleware.

**Prove it:** two Clerk accounts; each sees only its own items — verified in
DBeaver and Postman, not just the UI.

---

## Phase C — Polish & follow-ups (explicitly out of the starter's scope)

- ◻ Deployment story (was deliberately excluded: no CI, no Terraform — a
  follow-up project, not part of the starter)
- ◻ Broader test coverage as the API grows real logic
- 🔶 Keep `memory.md` and the docs current as modules land (hook-enforced)

---

## Where we are (2026-08-14)

**Done:** Modules 1–7 — the entire Phase A. The scaffold, all three services
proving themselves, shared zod contracts, the full five-screen product UI on
shadcn with a token-driven theme, and a deep hygiene pass (structure rules,
naming, journaling hooks). The branch `refactor/web-restructure` (PR #1)
carries the Phase-A finish line.

**Partially done:** the overall architecture mermaid diagram exists
(`docs/architecture/overview.md`); per-service diagrams don't yet.

**Not started:** everything database-and-auth: design docs (M8), Postgres +
SQLAlchemy/Alembic/pydantic-settings (M9), real persistence in the UI (M10),
DBeaver/Postman literacy (M11), Clerk + middleware (M12), RLS (M13).

**Recommended next step:** Module 8 — write the API design and database
schema docs. It's all diagrams and prose, it forces the decisions Modules
9–13 depend on, and it's the cheapest module to revise when you change your
mind.
