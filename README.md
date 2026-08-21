# note2action

Paste meeting notes, extract action items with AI, review and edit them, save
them to a task list — with real accounts, a real database, and per-user data
isolation enforced by the database itself.

A full-stack monorepo: three apps and one shared package.

- **`apps/web`** — React 19 + Vite frontend. TanStack Query for server state,
  zustand for client state, react-router v7, Tailwind v4 + shadcn/ui, Clerk for
  sign-in. Screens: Home, Capture, Review, Tasks, Meetings, History.
- **`apps/api`** — FastAPI backend (Python + uv). Clerk JWT verification in
  middleware, SQLAlchemy 2 + Alembic on Postgres, and Row-Level Security so the
  database enforces per-user isolation. Persistence sits behind a repository
  seam (`postgres` for real, `memory` for tests).
- **`apps/ai`** — Next.js (App Router) + Vercel AI SDK **v6**. `/api/extract`
  turns raw notes into structured action items (plus a `/api/chat` demo).
  Defaults to Anthropic `claude-sonnet-5`.
- **`packages/shared`** — the **contract**: zod schemas (`ActionItem`,
  `Meeting`, extract requests/responses, …) used by `web` + `ai` and mirrored
  by pydantic models in the API.

The JS/TS apps live in a **pnpm workspace**. The Python app is **not** in the
workspace — it uses **uv** — but the root scripts still drive it.

## Prerequisites

| Tool   | Version         | Notes                                                 |
| ------ | --------------- | ----------------------------------------------------- |
| Node   | 20+             | 20 or newer                                           |
| pnpm   | 11+             | `corepack enable pnpm` (ships with Node)              |
| uv     | latest          | Python package manager — <https://docs.astral.sh/uv/> |
| Docker | with Compose v2 | Runs Postgres locally                                 |

## First-time setup

Each app reads its own gitignored `.env`; every one has a commented
`.env.example` to copy from.

```bash
pnpm install                            # JS/TS workspace deps

# 1. Environment files
cp apps/web/.env.example apps/web/.env  # VITE_CLERK_PUBLISHABLE_KEY
cp apps/api/.env.example apps/api/.env  # DATABASE_URL, MIGRATIONS_DATABASE_URL,
                                        #   REPOSITORY, CLERK_JWKS_URL
cp apps/ai/.env.example apps/ai/.env    # ANTHROPIC_API_KEY

# 2. Postgres (Docker), then migrations
docker compose up -d postgres
cd apps/api && uv run alembic upgrade head && cd ../..
```

Clerk bits (free dev account at <https://clerk.com>):

- **Publishable key** (`pk_test_…`) → `apps/web/.env`. Public by design — it
  only tells the browser which Clerk app to talk to.
- **JWKS URL** (API Keys → JWKS URL) → `apps/api/.env`. Public signing keys;
  the API verifies session tokens with them locally, no shared secret.
- **Session claim** — in Clerk dashboard → Sessions → Customize session token,
  add `{"name": "{{user.full_name}}"}` so the API learns each user's name from
  the verified token.

## Running it

```bash
pnpm dev:local        # web + api + ai together (Postgres stays in Docker)
```

Or pieces individually:

```bash
pnpm --filter @note2action/web dev    # web only
pnpm --filter @note2action/ai dev     # ai only
pnpm dev:api                          # api only (uv run uvicorn …)
```

> **Note on `pnpm dev` (full Docker stack):** the Compose files for web/api/ai
> predate the database and auth modules — the api container isn't wired with
> `DATABASE_URL`/Clerk env yet. Until that's revisited (deploy/CI phase), use
> Compose for Postgres only and run the apps natively with `dev:local`.

## Ports

| Service  | URL                   | Port                      |
| -------- | --------------------- | ------------------------- |
| web      | http://localhost:5173 | 5173                      |
| api      | http://localhost:8001 | 8001                      |
| ai       | http://localhost:3000 | 3000                      |
| postgres | localhost:5432        | 5432 (Docker, `postgres`) |

In dev, the web app proxies `/api/*` to the API and `/ai-api/*` to the AI app
(`vite.config.ts`), so there's no CORS config to manage.

## API surface

All routes except `/api/health` (and `/docs`) require a `Bearer` token — a
Clerk session JWT the web app attaches automatically. Every query is scoped to
the verified user.

| Method + path                   | What it does                                           |
| ------------------------------- | ------------------------------------------------------ |
| `GET /api/health`               | Liveness check (public)                                |
| `GET /api/items`                | Your action items                                      |
| `PATCH /api/items/{id}`         | Edit one item (partial update)                         |
| `DELETE /api/items/{id}`        | Delete one item                                        |
| `POST /api/items/save-to-tasks` | Promote reviewed items to the task list                |
| `POST /api/meetings`            | Save a meeting + its extracted items (one transaction) |
| `GET /api/meetings`             | Your meeting history                                   |
| `GET /api/meetings/{id}`        | One meeting with its items                             |

Interactive docs at <http://localhost:8001/docs>.

## How auth + data isolation work

Defense in depth — each layer holds even if the one above it fails:

1. **Middleware** (`apps/api/app/main.py`) verifies the Clerk JWT signature
   against the JWKS public keys and rejects anything else with 401. Identity
   comes only from the verified token, never from the request body.
2. **Queries** filter by `user_id` in the repository; rows you don't own
   answer 404 (not 403), so other users' data doesn't even reveal it exists.
3. **Row-Level Security** (Postgres): the API connects as the low-privilege
   `note2action_app` role, announces the user per transaction
   (`set_config('app.user_id', …)`), and owner-only policies on `meetings` and
   `action_items` make it impossible to read or write another user's rows —
   even if an application-level filter is forgotten. Unset user → zero rows
   (fails closed).

That's why there are **two database URLs**: `DATABASE_URL` is the app role
(RLS applies — superusers bypass it), `MIGRATIONS_DATABASE_URL` is the admin
role Alembic needs for DDL.

## Database & migrations

Schema lives in `apps/api/app/models.py` (SQLAlchemy); Alembic migrations in
`apps/api/migrations/versions/` (initial schema → user identity → RLS
policies). After changing models:

```bash
cd apps/api
uv run alembic revision --autogenerate -m "describe the change"
# review the generated file, then
uv run alembic upgrade head
```

Design docs: `docs/database-schema.md`, `docs/api-design.md`,
`docs/architecture/`.

## Scripts (run from the repo root)

| Command          | What it does                                        |
| ---------------- | --------------------------------------------------- |
| `pnpm dev:local` | Run web + api + ai natively                         |
| `pnpm dev:api`   | Run the API alone                                   |
| `pnpm test`      | Workspace tests (35 vitest) + API tests (23 pytest) |
| `pnpm typecheck` | TypeScript checks across the workspace              |
| `pnpm lint`      | ESLint (`lint:fix` to autofix)                      |
| `pnpm format`    | Prettier (`format:check` to verify only)            |
| `pnpm dev`       | Full Docker stack — see the note above              |
| `pnpm dev:down`  | Stop the Docker Compose stack                       |

Husky + lint-staged format and lint staged files on every commit.

## Where things live

- **`apps/web/src/views/`** — one folder per screen (`capture`, `review`,
  `tasks`, `meetings`, `history`, `home`, `auth`), each with its view and a
  local `components/` folder for pieces only that screen uses.
- **`apps/web/src/domain/`** — state and queries shared _between_ views:
  `items/`, `meetings/`, `extraction/`, `health/`. Each exposes an `.api.ts` +
  `.queries.ts`/`.store.ts` surface; views and app components call these, never
  `lib/http.ts` directly.
- **`apps/web/src/components/`** — `ui/` (shadcn primitives) and `app/` (app
  chrome and pieces shared by 2+ features: layout, sidebar, auth gate,
  view-shell).
- **`apps/web/src/lib/`** — the shared kernel: `http.ts` (fetch + zod
  validation + bearer token), `query-client.ts`, `auth-token.ts`,
  `theme.store.ts`, `dates.ts`, `sound.ts`, `utils.ts` (`cn()`).
- **`apps/api/app/api/routes/`** — one file per resource (`health.py`,
  `items.py`, `meetings.py`) plus `deps.py` (repositories accessor,
  current-user resolution); `app/core/` holds config/db/security/middleware
  plumbing that the rest of the app depends on but that depends on nothing
  above it.
- **`apps/api/app/services/`** — business rules, one file per domain; the only
  layer routes call, and the only layer allowed to sit between routes and
  repositories.
- **`apps/api/app/repositories/`** — the seam: `protocols.py` (the typed
  contracts), `memory.py` (in-memory fakes for tests), `postgres/` (the real
  implementations, split per domain).
- **`apps/api/app/models/`** and **`apps/api/app/schemas/`** — SQLAlchemy
  tables and pydantic request/response models, each split one file per domain.
- **`apps/api/tests/`** — pytest suite mirroring `app/`'s structure; runs
  against the in-memory repository and a fake token verifier, so no database
  or Clerk account is needed.
- **`apps/ai/lib/`** — `provider.ts` (model/provider config) and
  `extraction.ts` (extract prompt + schema handling); `app/api/` routes stay
  thin wrappers around these.
- **`packages/shared/src/`** — the zod contract, split per domain
  (`items.ts`, `meetings.ts`, `extraction.ts`, `health.ts`, …) and re-exported
  from `index.ts`. Change shapes here first, then mirror in
  `apps/api/app/models/`/`apps/api/app/schemas/`.
- **`docs/`** — roadmap, API + schema design docs, and the backend course
  (`docs/course/`) this was built through.

## Notes on a few choices

- **Python stays out of the pnpm workspace.** That's the one seam where JS
  monorepo tooling and Python don't mix cleanly; uv + root scripts is the tidy
  version of it.
- **AI is its own Next.js app**, not folded into the React app — it keeps the
  Vercel AI SDK and its keys isolated.
- **The repository seam keeps tests fast and honest**: the same protocol backs
  a Postgres implementation and an in-memory fake, so the whole API suite runs
  with zero infrastructure.
- **The server stamps facts.** `completed` dates, capture timestamps, and
  `user_id` are set server-side from verified state — clients express intent,
  the server records truth.
- **Not here yet (deliberately):** deploy, CI, and production secret
  management — that's the next phase (`docs/roadmap.md`, Phase C).
