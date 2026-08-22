# Monorepo Restructure — Design Spec

**Date:** 2026-08-21 · **Status:** approved in chat, pending spec review
**Branch:** `refactor/monorepo-restructure` (off `main` after PR #3)
**Model repo:** [fastapi/full-stack-fastapi-template](https://github.com/fastapi/full-stack-fastapi-template) — its `backend/app` skeleton, adapted (all apps stay under `apps/`)

## 1. Goal

Restructure every package in the monorepo so each file has a single
responsibility and each layer can be tested or swapped independently:

- **apps/api** adopts the template's skeleton (`api/routes/` per resource,
  `core/`, tests mirroring source) plus a thin `services/` layer, with the
  repository seam **kept** and split per domain (approved: "keep seam, split it").
- **apps/web** stays feature-first (`views/`, three-file pattern, kebab-case)
  and gains a `domain/` layer for state and queries shared between views;
  feature-specific components move into their feature's folder.
- **apps/ai** separates route handlers from provider/prompt logic.
- **packages/shared** splits the zod contract per domain.
- Root shape (`apps/`, `packages/`, `docs/`, config files) is unchanged.

This is a **pure refactor**: zero behavior change, zero dependency changes,
no route/schema/database changes. The proof obligation is the existing suite:
**35 vitest + 23 pytest green, typecheck, lint, and web build clean** after
every phase.

## 2. Global constraints

1. No behavior change: same endpoints, same status codes, same schemas, same
   UI. Tests are _moved and re-pointed_, not rewritten (import paths, file
   locations, and mechanical splits only).
2. No new runtime dependencies in any package.
3. Web files kebab-case (`extraction.store.ts`, not `actionItems.store.ts`);
   Python stays snake_case.
4. Verification bar per phase: `pnpm typecheck && pnpm lint && pnpm test`
   (58 tests) and `pnpm --filter @note2action/web build`.
5. `App.tsx → app.tsx` is a case-only rename on a case-insensitive filesystem —
   must use `git mv` so git records it.
6. Alembic: migration files never import app code (verified), but
   `migrations/env.py` imports `app.models` (Base) and `app.settings` — both
   import sites must be updated (`app.models` package re-export keeps the first
   working; the second becomes `app.core.config`).
7. Docker/tooling unaffected by design: api Dockerfile copies the whole dir and
   runs `app.main:app` (unchanged path); vite proxy, tsconfig `@/*` alias,
   pytest config (`testpaths=["tests"]`, `pythonpath=["."]`) all keep working.
8. README's "Where things live" section is updated to the new structure at the
   end (README was already rewritten on 2026-08-20; those uncommitted edits ride
   this branch).

## 3. Target structure

### 3.1 Backend — `apps/api/`

```text
apps/api/
├── app/
│   ├── main.py                  # app factory only: create FastAPI app, register
│   │                            #   middleware, include api_router, build state
│   ├── api/
│   │   ├── main.py              # api_router assembling the route modules
│   │   ├── deps.py              # route dependencies: repositories accessor,
│   │   │                        #   current_user_id (identity → user id)
│   │   └── routes/
│   │       ├── health.py        # GET /api/health
│   │       ├── items.py         # GET /api/items, PATCH/DELETE /api/items/{id},
│   │       │                    #   POST /api/items/save-to-tasks
│   │       └── meetings.py      # POST/GET /api/meetings, GET /api/meetings/{id}
│   ├── core/                    # plumbing; imports NOTHING from api/services/repositories
│   │   ├── config.py            # Settings (from settings.py)
│   │   ├── db.py                # engine + SessionLocal (from db.py)
│   │   ├── security.py          # VerifiedUser, TokenVerifier protocol,
│   │   │                        #   identity_from_claims, ClerkJWKSVerifier (from auth.py)
│   │   └── middleware.py        # require_verified_user middleware + PUBLIC_PATHS
│   ├── models/                  # SQLAlchemy tables, one per file
│   │   ├── __init__.py          # re-exports Base, User, Meeting, ActionItem
│   │   ├── base.py              # DeclarativeBase
│   │   ├── user.py
│   │   ├── meeting.py
│   │   └── action_item.py
│   ├── schemas/                 # pydantic API models (from schemas.py)
│   │   ├── __init__.py          # re-exports (routes import from submodules)
│   │   ├── health.py            # HealthResponse
│   │   ├── items.py             # ActionItem, ActionItemPatch, ItemsResponse,
│   │   │                        #   SaveToTasksResponse
│   │   └── meetings.py          # Meeting, CreateMeetingRequest/Response,
│   │                            #   MeetingsResponse, MeetingDetail
│   ├── services/                # business rules; the only layer routes call
│   │   ├── users.py             # resolve_user_id(repo, identity) -> int
│   │   ├── items.py             # list/update/delete/save_all_to_tasks
│   │   └── meetings.py          # create (atomic meeting+items), list, get
│   └── repositories/            # the seam, split per domain
│       ├── protocols.py         # UserRepository, ItemRepository, MeetingRepository,
│       │                        #   Repositories container dataclass
│       ├── memory.py            # _MemoryState + three in-memory fakes sharing it;
│       │                        #   SEED_CLERK_ID lives here
│       └── postgres/
│           ├── __init__.py      # build_postgres_repositories(...)
│           ├── session.py       # rls_session(user_id): SET LOCAL app.user_id
│           ├── users.py         # get_or_create (name laws + IntegrityError retry)
│           ├── items.py
│           └── meetings.py
├── migrations/                  # stays at api root (deviation from template noted)
└── tests/                       # mirrors source, template-style
    ├── conftest.py              # FakeVerifier, AUTH, autouse wiring fixture
    ├── api/
    │   └── routes/
    │       ├── test_health.py
    │       ├── test_auth.py
    │       ├── test_items.py
    │       └── test_meetings.py
    └── repositories/
        └── test_repository.py   # repository laws (name laws, ownership)
```

**Layer contracts (exact seams):**

- `repositories/protocols.py`
  - `UserRepository`: `get_or_create_user(clerk_id: str, name: str | None) -> int`
    (stays a repository method: atomicity + unique-violation retry are data-layer
    concerns; the name laws remain implemented in both impls and are pinned by
    the shared law tests).
  - `ItemRepository`: `list_items(user_id) -> list[ActionItem]`,
    `update_item(user_id, item_id, patch) -> ActionItem | None`,
    `delete_item(user_id, item_id) -> bool`, `save_all_to_tasks(user_id) -> int`.
  - `MeetingRepository`: `create_meeting(user_id, request) -> CreateMeetingResponse`,
    `list_meetings(user_id, limit) -> list[Meeting]`,
    `get_meeting(user_id, meeting_id) -> MeetingDetail | None`.
  - `Repositories`: frozen dataclass `{users, items, meetings}` — the app-state
    wiring unit. Signatures are today's `repository.py` methods verbatim; only
    their grouping changes.
- `memory.py`: one `_MemoryState` (users, names, meetings, items, counters);
  three small classes each taking the state — the in-memory impls of the three
  protocols. `build_memory_repositories() -> Repositories`.
- `postgres/`: three classes using `session.py`'s `rls_session(user_id)`
  context manager; `users.py` keeps plain `SessionLocal` (identity bootstrap
  precedes RLS identity). `build_postgres_repositories() -> Repositories`.
- `services/*`: plain functions, repository (protocol type) as first argument.
  Services never import FastAPI — no `Request`, no `HTTPException`; they return
  values / `None` / counts and routes translate to HTTP (404, 204, …).
- `api/deps.py`: `get_repositories(request) -> Repositories` (reads
  `request.app.state.repositories`); `current_user_id(request) -> int` (reads
  `request.state.identity` set by middleware, calls
  `services.users.resolve_user_id`).
- `main.py` wiring: `app.state.repositories = build_*_repositories()` chosen by
  `settings.repository`; `app.state.token_verifier = ClerkJWKSVerifier(...)` or
  `None` exactly as today.
- `tests/conftest.py`: autouse fixture sets `app.state.repositories =
build_memory_repositories()` and `app.state.token_verifier = FakeVerifier()`
  (replaces today's module-global patching — app.state becomes the single
  injection point).

### 3.2 Frontend — `apps/web/src/`

```text
apps/web/src/
├── main.tsx
├── app.tsx                      # routes only (renamed from App.tsx)
├── providers.tsx                # Clerk + QueryClient + auth-token bridge
├── global.css
├── views/                       # feature modules; a view's components/ folder
│   │                            #   holds pieces only that feature uses
│   ├── capture/
│   │   ├── capture.view.tsx
│   │   └── components/          # notes-editor, recent-captures
│   ├── review/
│   │   ├── review.view.tsx, review.store.ts, review.utils.ts (+ test)
│   │   └── components/          # review-card, confidence-pill
│   ├── tasks/
│   │   ├── tasks.view.tsx, tasks.store.ts, tasks.utils.ts (+ test)
│   │   └── components/          # task-row, priority-badge
│   ├── history/
│   │   ├── history.view.tsx, history.store.ts, history.utils.ts (+ test)
│   │   └── components/          # history-row, stat-card
│   ├── home/
│   │   ├── home.view.tsx
│   │   └── components/          # recap-card
│   ├── meetings/                # meetings.view.tsx
│   └── auth/                    # sign-in.view.tsx, sign-up.view.tsx
├── domain/                      # state & queries shared between views; never imports views/
│   ├── items/                   # items.api.ts, items.queries.ts (items half of old
│   │                            #   lib/items.queries.ts), items.types.ts (view-model,
│   │                            #   from store/actionItems.types.ts), items.utils.ts
│   │                            #   (+ test, from lib/items.ts), items.constants.ts
│   │                            #   (OWNERS, LOW_CONFIDENCE_THRESHOLD, derived STATUSES/PRIORITIES)
│   ├── meetings/                # meetings.api.ts, meetings.queries.ts
│   │                            #   (meetings hooks split out of items.queries.ts)
│   ├── extraction/              # extraction.api.ts, extraction.store.ts,
│   │                            #   extraction.constants.ts (SAMPLES, DEFAULT_*)
│   └── health/                  # health.queries.ts (sidebar's health query)
├── components/
│   ├── ui/                      # shadcn primitives (unchanged)
│   └── app/                     # chrome + primitives used by 2+ features:
│       │                        #   app-layout, sidebar, sidebar-nav, require-auth,
│       │                        #   view-shell, view-header, scroll-region, toolbar,
│       │                        #   section-heading, step-label, empty-state,
│       │                        #   filter-select
├── lib/                         # shared kernel; imports nothing above it
│   ├── http.ts                  # fetch + zod validation + bearer token
│   ├── query-client.ts          # the QueryClient (moved out of providers.tsx so
│   │                            #   domain stores never import upward)
│   ├── auth-token.ts
│   ├── utils.ts                 # cn()
│   ├── dates.ts (+ test)
│   ├── sound.ts
│   └── theme.store.ts           # UI preference state (zustand, no server deps)
└── test/
    └── fixtures.ts
```

**Contract-derived constants:** enum lists the web duplicates today
(`STATUSES`, `PRIORITIES`) are replaced with derivations from the zod contract
(`Status.options`, `Priority.options`) in `domain/items/items.constants.ts`,
which also takes OWNERS and LOW_CONFIDENCE_THRESHOLD (shared across 4+
features). TODAY moves into `views/history/history.utils.ts` (single user);
SAMPLES/DEFAULT_RAW/DEFAULT_MEETING_TITLE into
`domain/extraction/extraction.constants.ts` (store-only).

### 3.3 AI app — `apps/ai/`

```text
apps/ai/
├── app/
│   ├── layout.tsx, page.tsx
│   └── api/
│       ├── chat/route.ts        # thin: parse → call lib → stream response
│       └── extract/route.ts     # thin: parse → call lib → respond
└── lib/
    ├── provider.ts              # model/provider config (from app/api/provider.ts)
    └── extraction.ts            # extract prompt + schema handling (from route body)
```

### 3.4 Shared contract — `packages/shared/src/`

```text
packages/shared/src/
├── index.ts                     # re-exports only (existing import sites unchanged)
├── app.ts                       # APP_NAME
├── health.ts                    # HealthResponse
├── items.ts                     # Priority, Status, ActionItem, ActionItemPatch,
│                                #   ItemsResponse, SaveToTasksResponse
├── meetings.ts                  # Meeting, CreateMeetingRequest/Response,
│                                #   MeetingsResponse, MeetingDetail (imports items.ts)
└── extraction.ts                # ExtractedItem, ExtractRequest, ExtractResponse
```

## 4. Boundary rules

1. **Backend, one direction:** `routes → services → repositories → models`.
   Routes: HTTP in/out only. Services: business rules, no FastAPI imports.
   Repositories: data access, no business rules beyond data integrity.
   `core/` sits below all three and imports none of them. `schemas/` may be
   imported by routes, services, and repositories (it is the data shape, not a
   layer). Circular imports become structurally impossible.
2. **The seam is typed and injected:** services and deps depend on protocols;
   concrete impls are chosen once, in `main.py`, onto `app.state`. Tests swap
   `app.state.repositories` and `app.state.token_verifier` — nothing else.
3. **Frontend: components never fetch.** Views and app-components call hooks
   from `domain/*/…queries.ts`; only those call `lib/http.ts`; only `http.ts`
   knows tokens and validation. Import direction:
   `views / components/app → domain → lib`; `components/ui` imports only
   `lib/utils`. Never view→view; never domain→views. Domain modules may import
   each other's public surface (e.g. extraction → meetings) but cycles are
   forbidden.
4. **Shared types at the bottom.** `packages/shared` imports from no app;
   web/ai import it; API pydantic schemas mirror it. All dependency arrows
   point downward.

### 4.5 Style & uniformity laws (approved addition, 2026-08-21)

Loose coupling and glance-readability are requirements, not aspirations:

1. **Uniform module anatomy per layer.** Files of the same kind read the same
   top-to-bottom: routes = router declaration → endpoints in path order;
   services = imports → public functions; `*.queries.ts` = query keys → hooks;
   views = hooks → derived state → handlers → JSX. You know where to look
   before you open the file.
2. **Small files.** Soft cap ~150 lines for source files (shadcn `ui/`
   primitives exempt); crossing it is a signal to split, not a hard failure.
3. **Modules expose a surface, not internals.** Cross-module imports go through
   the module's public file (`domain/items/items.queries.ts`, not a reach into
   its helpers); helpers not exported from that surface are private.
4. **Import order mirrors the layer order.** Grouped: external packages →
   `@note2action/shared` → lower layers → siblings. Web uses `@/` for
   cross-folder imports, `./` within a folder.
5. **Comments state constraints only** (existing house rule) — no banner
   comments, no narration; if code needs narration, restructure the code.
6. **No cleverness.** Early returns over nesting, explicit names over
   abbreviations, no chained one-liners that need mental unpacking. Match each
   language's existing formatting (prettier/eslint for TS; current style for
   Python — no new formatters added).

## 5. Old → new mapping

### Backend

| Today                                        | Becomes                                                                                                                                         |
| -------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------- |
| `app/settings.py`                            | `app/core/config.py`                                                                                                                            |
| `app/db.py`                                  | `app/core/db.py`                                                                                                                                |
| `app/auth.py`                                | `app/core/security.py`                                                                                                                          |
| `app/main.py` (152)                          | split: `app/main.py` (factory) + `app/core/middleware.py` + `app/api/main.py` + `app/api/deps.py` + `app/api/routes/{health,items,meetings}.py` |
| `app/models.py`                              | `app/models/{base,user,meeting,action_item}.py` + re-exporting `__init__.py`                                                                    |
| `app/schemas.py` (120)                       | `app/schemas/{health,items,meetings}.py`                                                                                                        |
| `app/repository.py` (470)                    | `app/repositories/protocols.py`, `memory.py`, `postgres/{session,users,items,meetings}.py`                                                      |
| `tests/test_{health,auth,items,meetings}.py` | `tests/api/routes/` (same names)                                                                                                                |
| `tests/test_repository.py`                   | `tests/repositories/test_repository.py`                                                                                                         |
| `migrations/env.py` import of `app.settings` | `app.core.config`                                                                                                                               |

### Web (every move is import-evidence-backed; siblings imported via `./` re-verified at planning)

| Today                                                                                                                                                                                                    | Becomes                                                                                                                                                                                                                                                           |
| -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `App.tsx`                                                                                                                                                                                                | `app.tsx` (git mv, case-only)                                                                                                                                                                                                                                     |
| `queryClient` inside `providers.tsx`                                                                                                                                                                     | `lib/query-client.ts` — fixes the one upward import (`store` → `providers`)                                                                                                                                                                                       |
| `store/actionItems.store.ts`                                                                                                                                                                             | `domain/extraction/extraction.store.ts`                                                                                                                                                                                                                           |
| `store/actionItems.types.ts`                                                                                                                                                                             | `domain/items/items.types.ts` (items view-model; unused `Screen` type deleted — zero importers)                                                                                                                                                                   |
| `store/actionItems.constants.ts`                                                                                                                                                                         | split: OWNERS + LOW_CONFIDENCE_THRESHOLD + derived STATUSES/PRIORITIES → `domain/items/items.constants.ts`; TODAY → `views/history/history.utils.ts` (its only user); SAMPLES + DEFAULT_RAW + DEFAULT_MEETING_TITLE → `domain/extraction/extraction.constants.ts` |
| `store/theme.store.ts`                                                                                                                                                                                   | `lib/theme.store.ts`                                                                                                                                                                                                                                              |
| `lib/actionItems.api.ts`                                                                                                                                                                                 | `domain/extraction/extraction.api.ts`                                                                                                                                                                                                                             |
| `lib/items.api.ts`                                                                                                                                                                                       | `domain/items/items.api.ts`                                                                                                                                                                                                                                       |
| `lib/items.ts` (+ `lib/items.test.ts`)                                                                                                                                                                   | `domain/items/items.utils.ts` (+ `items.utils.test.ts`)                                                                                                                                                                                                           |
| `lib/items.queries.ts`                                                                                                                                                                                   | split → `domain/items/items.queries.ts` + `domain/meetings/meetings.queries.ts`                                                                                                                                                                                   |
| `lib/meetings.api.ts`                                                                                                                                                                                    | `domain/meetings/meetings.api.ts`                                                                                                                                                                                                                                 |
| `lib/health.ts`                                                                                                                                                                                          | `domain/health/health.queries.ts`                                                                                                                                                                                                                                 |
| `lib/dates.ts` (+test), `lib/sound.ts`, `lib/http.ts`, `lib/auth-token.ts`, `lib/utils.ts`                                                                                                               | stay `lib/`                                                                                                                                                                                                                                                       |
| `components/app/notes-editor, recent-captures`                                                                                                                                                           | `views/capture/components/`                                                                                                                                                                                                                                       |
| `components/app/review-card, confidence-pill`                                                                                                                                                            | `views/review/components/`                                                                                                                                                                                                                                        |
| `components/app/task-row, priority-badge`                                                                                                                                                                | `views/tasks/components/`                                                                                                                                                                                                                                         |
| `components/app/slot-number.tsx`                                                                                                                                                                         | stays — imported by `completion-card.tsx` via a relative path the original grep filtered out (execution-time correction 2026-08-21)                                                                                                                               |
| `components/app/history-row, stat-card`                                                                                                                                                                  | `views/history/components/`                                                                                                                                                                                                                                       |
| `components/app/recap-card`                                                                                                                                                                              | `views/home/components/`                                                                                                                                                                                                                                          |
| `components/app/app-layout, sidebar, sidebar-nav, require-auth, recent-modal, completion-card, view-shell, view-header, scroll-region, toolbar, section-heading, step-label, empty-state, filter-select` | stay `components/app/` (chrome or used by chrome: `recent-modal` ← app-layout, `completion-card` ← sidebar)                                                                                                                                                       |

### AI + shared

| Today                                               | Becomes                                                             |
| --------------------------------------------------- | ------------------------------------------------------------------- |
| `apps/ai/lib/provider.ts`                           | already in place (no move — earlier survey misread the tree)        |
| extract prompt/model call inside `extract/route.ts` | `apps/ai/lib/extraction.ts` (route stays thin)                      |
| `packages/shared/src/index.ts` (168)                | `app/health/items/meetings/extraction.ts` + re-exporting `index.ts` |

## 6. Testing strategy

- **No test rewrites.** API tests move to the mirrored tree; only imports and
  the conftest wiring change (module-global patch → `app.state`). Web tests
  stay colocated with what they test and move with it.
- Phase gates: backend restructure, web restructure, ai + shared restructure —
  each ends with the full verification bar (§2.4) green before the next begins.
- The example flow (§7) doubles as the smoke test: after each phase, capture →
  extract → save → tasks must work against the live stack (manual check at
  the end, Kyle's checkpoint).

## 7. Reference flow — one meeting, storage to screen

`models/meeting.py` (row + RLS policy in migrations) →
`repositories/postgres/meetings.py` inserts meeting + items inside
`session.py`'s RLS transaction → `services/meetings.py` enforces the one-
transaction rule with `user_id` from verified identity →
`api/routes/meetings.py`: `CreateMeetingRequest` in, `Depends(current_user_id)`
from `api/deps.py`, `CreateMeetingResponse` out — after `core/middleware.py` +
`core/security.py` verified the JWT. Web: `views/capture/capture.view.tsx` →
`useCreateMeeting()` in `domain/meetings/meetings.queries.ts` →
`lib/http.ts` (token + zod validation against `packages/shared/meetings.ts`) →
invalidates `["items"]` / `["meetings"]` → Tasks and History refetch.

## 8. Out of scope

- No new features, endpoints, schema fields, or migrations.
- No dependency changes; no Docker/CI work (Phase C).
- No renaming of API routes, query keys, env vars, or database objects.
- No rewriting of component internals beyond what a move/split mechanically
  requires.

## 9. Planning-time resolutions (all §9 items verified 2026-08-21)

- `recent-modal` ← `app-layout.tsx`, `completion-card` ← `sidebar.tsx`: both
  stay in `components/app/`. `slot-number.tsx`: stays, imported by completion-card via a relative path the planning grep missed.
- `lib/items.queries.ts` split line: `itemsKey`, `useItemsQuery`,
  `usePatchItem`, `useDeleteItem`, `useSaveToTasks` → items;
  `meetingsKey`, `useMeetingsQuery`, `useMeetingQuery` → meetings
  (`useDeleteItem` imports `meetingsKey` from the meetings module — it
  invalidates meeting counts on delete).
- `extraction.store.ts` moves whole (its state/actions are one cohesive
  capture-session concern); its `queryClient` import repoints to
  `lib/query-client.ts`.
- Constants: see §3.2. `actionItems.types.ts` belongs to the items domain
  (12 importers, all items-related), not extraction; its `Screen` type is
  dead and is deleted.
