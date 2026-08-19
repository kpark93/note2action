# The note2action Backend Course

**Student:** Kyle · **Mentor:** Claude · **Prerequisite:** Phase A of
`docs/roadmap.md` (done — the app works end-to-end with in-memory data)

**The goal of this course:** by the end, your action items live in a real
Postgres database, behind an authenticated API, protected by row-level
security — and _you_ wrote it, understanding every layer.

## How this course works

- **You type the code.** My job is to explain, give you the steps, review
  what you wrote, and un-stick you — not to write it for you. (This is the
  opposite of how Phase A went. That's deliberate: Phase B is where the
  learning is.)
- Each module has three parts: **What** we're implementing, **Why** it
  exists, and **How** to do it manually, step by step.
- 📖 **Terminology boxes** define each new term the first time you need it —
  not before.
- Every module ends with a **checkpoint**: something observable that proves
  it works. We don't move on until the checkpoint passes.
- Modules match `docs/roadmap.md` numbering (8–13).

---

## Module 8 — Design on paper first

### What

Three documents, no code:

1. `docs/api-design.md` — every endpoint the finished product needs
2. `docs/database-schema.md` — the tables, as a mermaid ER diagram
3. Per-service mermaid diagrams added to `docs/architecture/`

### Why

Every module after this one implements decisions made here. A wrong decision
in a diagram costs a five-minute edit; the same wrong decision in a migrated
database table costs a migration, code changes in two apps, and data
backfill. Cheap first, expensive later — so we decide while it's cheap.

### How (manually)

1. Open the app and walk each screen writing down every piece of data you
   see (title, owner, due, priority, confidence, saved, completed date…) and
   every action you can take (extract, save, edit, complete, reopen…).
2. Turn the **data** list into tables. Start with three: `users`, `meetings`,
   `action_items`. For each column write its type and whether it can be
   empty. Every action item belongs to a meeting; every meeting belongs to a
   user — those are your foreign keys.
3. Draw it as a mermaid `erDiagram` in `docs/database-schema.md`.
4. Turn the **actions** list into endpoints in `docs/api-design.md`: method,
   path, request body, response body, error cases. Point each shape at the
   zod schema in `packages/shared` that will validate it.
5. Add one mermaid flowchart per service to `docs/architecture/` showing its
   internals (web: view → store → api layer; api: router → repository → db;
   ai: route → provider → model).

> 📖 **Schema** — the formal shape of data: which fields exist, their types,
> what's required. Databases have schemas (tables/columns); APIs have schemas
> (request/response shapes). Same idea, different layer.
>
> 📖 **ER diagram** (entity-relationship) — boxes are tables, lines are
> relationships. The standard way to sketch a database before building it.
>
> 📖 **Foreign key** — a column holding another table's id, e.g.
> `action_items.meeting_id` → `meetings.id`. It's how rows point at each
> other, and the database enforces that the target row actually exists.

### Checkpoint

You can trace every field on every screen to a column, and every button to
an endpoint. I'll play the adversary: I name a UI feature, you point at the
row/endpoint that serves it.

---

## Module 9 — Postgres, the ORM, and migrations

### What

- A `postgres` service in `docker-compose.yml`
- In `apps/api`: SQLAlchemy models implementing Module 8's schema, Alembic
  migrations, and pydantic-settings for configuration
- The in-memory repository swapped for a Postgres-backed one

### Why

Right now your data lives in a Python list (server) and a zustand store
(browser) — both evaporate on restart. A database is the first _durable_
home your data gets. The ORM and migrations make the database changeable
over time without losing what's in it.

### How (manually)

1. Add the service to `docker-compose.yml`: image `postgres:17`, a named
   volume for data, env vars for user/password/db name. Map host port
   **5432** (Postgres's default — checking it's free with `lsof -i :5432`
   first is the habit; fall back to 5433 if another Postgres owns it. On
   this machine 5432 was verified free, so we use the default). ✅ done
2. `cd apps/api && uv add sqlalchemy alembic pydantic-settings psycopg`
3. Create `app/settings.py` — a pydantic-settings class that reads
   `DATABASE_URL` from the environment and fails loudly at startup if it's
   missing.
4. Write the models in `app/models` (one class per table from your ER
   diagram).
5. `uv run alembic init migrations`, point its config at your settings, then
   `uv run alembic revision --autogenerate -m "initial schema"` and **read
   the generated file before running it** — autogenerate guesses; you
   approve. Apply with `uv run alembic upgrade head`.
6. Write `PostgresItemRepository` with the same methods as the in-memory
   one, and choose the implementation in one place. The endpoints don't
   change — that's the payoff of Module 2's repository seam.

> 📖 **ORM** (object-relational mapper) — a library (SQLAlchemy here) that
> maps Python classes to tables and objects to rows, so you mostly write
> Python instead of raw SQL. Worth knowing: Alembic is _not_ the ORM — it's
> SQLAlchemy's **migration** tool.
>
> 📖 **Migration** — a small versioned script ("add table X", "add column
> Y") that upgrades a database's schema in place. The chain of migrations is
> your schema's git history.
>
> 📖 **Connection string / DATABASE_URL** — one line encoding how to reach
> the database. Ours (local dev):
> `postgresql+psycopg://postgres:postgres@localhost:5432/note2action`.
>
> 📖 **Named volume** — Docker-managed disk space that outlives the
> container, so your data survives `docker compose down`.
>
> 📖 **pydantic-settings** — typed, validated configuration loaded from
> environment variables; a missing or malformed setting fails at startup
> instead of at 2am.

### Checkpoint

`docker compose up` brings up Postgres; `alembic upgrade head` creates your
tables; the API's tests still pass; restarting the stack does not lose an
inserted row.

---

## Module 10 — Real persistence in the UI

### What

- Real CRUD endpoints on the API (`POST/GET/PATCH /api/items` per your
  Module 8 doc)
- The web app saving/loading through them with TanStack Query mutations
- The zustand store shrinking to true client-only state (drafts, filters,
  animation flags)

### Why

You discovered this yourself: refresh the page and everything but the theme
vanishes, because only the theme was ever written somewhere durable. After
this module the browser is a _view_ of the database, not the database.

### How (manually)

1. Implement the endpoints against the repository from Module 9. Validate
   request bodies with pydantic models mirroring the shared zod schemas.
2. In `apps/web/src/lib/`, add an `items.api.ts` with typed functions per
   endpoint (through the existing `/api` proxy and `http.ts`).
3. Replace store actions that mutate the items array with TanStack Query:
   `useQuery(["items"])` to load; `useMutation` + query invalidation for
   save/update/complete.
4. Audit `actionItems.store.ts`: whatever is now server data comes out;
   whatever is genuinely UI state (draft notes text, extraction-in-flight,
   filters) stays.

> 📖 **CRUD** — Create, Read, Update, Delete: the four verbs of persistence,
> mapping to POST, GET, PATCH/PUT, DELETE.
>
> 📖 **Query vs mutation** (TanStack) — a _query_ reads data and caches it;
> a _mutation_ changes data and then **invalidates** the cache so queries
> refetch fresh truth.
>
> 📖 **Server state vs client state** — server state is owned elsewhere and
> cached locally (items); client state exists only in this browser tab
> (which filter is selected). The classic mistake is storing both the same
> way; this module is the cure.

### Checkpoint

Save items, hard-refresh: still there. Kill and restart the whole stack:
still there.

---

## Module 11 — See your data: DBeaver & Postman

### What

Tooling skills, no code: DBeaver connected to your Postgres; a Postman
collection covering your API.

### Why

Until now the UI is your only window into the system — so any bug looks like
a UI bug. These two tools let you look at each layer _directly_, which is
how you answer "is it the frontend, the API, or the data?" in one minute
instead of one hour.

### How (manually)

1. Install DBeaver → new PostgreSQL connection → host `localhost`, port
   `5432`, plus the user/password/db from your compose file → open the
   `action_items` table.
2. Save an item in the app → refresh the table in DBeaver → watch your row
   exist. Edit a row in DBeaver → refresh the app → watch it change. That
   round trip is the whole lesson.
3. Install Postman → create a collection "note2action API" → one saved
   request per endpoint, with example bodies → set a collection variable
   `baseUrl = http://localhost:8001`.
4. Break something on purpose (send a bad body) and read the API's error
   response in Postman.

> 📖 **SQL client** (DBeaver) — a GUI that connects straight to the
> database: browse tables, run SQL, edit rows. The API is not involved.
>
> 📖 **API client** (Postman) — a GUI for crafting HTTP requests directly:
> the frontend is not involved. Collections are saved, shareable request
> sets.

### Checkpoint

Given a made-up bug report from me ("my item didn't save"), you demonstrate
the triage: Postman shows whether the API accepts the write; DBeaver shows
whether the row landed.

---

## Module 12 — Authentication with Clerk

### What

- Clerk in the web app: sign-up/sign-in, a signed-in user context
- FastAPI middleware that verifies Clerk's token on every request and
  rejects strangers with 401
- `user_id` on your data, written from the verified identity

### Why

Everything so far is single-player. Auth is the boundary between "demo" and
"product": requests stop being anonymous, and data gets an owner. The key
mental shift: **the backend never trusts the frontend** — it verifies the
token itself, every request.

### How (manually)

1. Create a Clerk application (their dashboard) → publishable + secret keys
   → `.env` entries in web and api (`.env.example` updated, secrets never
   committed).
2. Web: install `@clerk/clerk-react`, wrap the app in `<ClerkProvider>` (you
   already have exactly one place for this: `providers.tsx`), gate the
   routes, and attach the session token to API calls in `http.ts` via the
   `Authorization` header.
3. API: middleware that reads the `Authorization: Bearer <token>` header,
   verifies the JWT against Clerk's public keys (their `clerk-backend-api`
   Python SDK or JWKS verification), and stashes the user id on
   `request.state`. No/invalid token → 401 before any endpoint runs.
4. Add `user_id` to `action_items` (a new Alembic migration — your first
   schema _change_, which is the real migration lesson) and write it from
   the verified identity, never from the request body.

> 📖 **JWT** (JSON Web Token) — a signed blob the auth provider issues to
> the browser; the backend checks the signature to know who's calling
> without a shared session store.
>
> 📖 **Middleware** — code that runs on _every_ request before your endpoint
> does. Auth is its classic job: verify once, centrally, instead of in every
> handler.
>
> 📖 **401 vs 403** — 401 "who are you?" (no/bad token), 403 "I know who you
> are, and no" (valid token, insufficient rights).

### Checkpoint

The same Postman request succeeds with a fresh token and fails 401 without
one; a saved item's row in DBeaver carries your real Clerk user id.

---

## Module 13 — Row-Level Security

### What

Postgres RLS policies so the _database itself_ only shows each user their
own rows — enforced even if an API endpoint has a bug.

### Why

Module 12 filters data in application code (`WHERE user_id = ...`), which
means one forgotten WHERE clause leaks everyone's data. RLS moves the rule
into the database: defense in depth — the last layer holds even when the
layer above slips.

### How (manually)

1. Migration: `ALTER TABLE action_items ENABLE ROW LEVEL SECURITY;` plus a
   policy like `USING (user_id = current_setting('app.user_id'))`.
2. In the API's request handling, after the middleware verifies the user,
   set that per-connection variable (`SET app.user_id = ...`) before
   queries run — SQLAlchemy session events are the hook point.
3. Make sure the app's DB role isn't the table owner/superuser (owners
   bypass RLS by default) — this is the classic gotcha.
4. Test with two Clerk accounts.

> 📖 **RLS policy** — a rule attached to a table deciding, per row, whether
> the current database session may see or change it. Think of it as a WHERE
> clause the database appends for you and you cannot forget.
>
> 📖 **Defense in depth** — multiple independent layers each enforcing the
> same rule, so a single bug isn't a breach.

### Checkpoint

Two accounts, two browsers: each sees only its own items. Then the real
test: temporarily comment out the API's WHERE filter — the app _still_
leaks nothing, because Postgres refuses. (Then put the filter back.)

---

## Graduation

When Module 13's checkpoint passes you have the full modern stack: typed
contracts end to end, durable data, migrations, auth, and database-enforced
authorization — each layer of which you built and can explain. Phase C
(deploy, CI) becomes a follow-up course if you want it.

**Course rhythm suggestion:** one module per sitting, checkpoints strictly
enforced, and after each module you write its `memory.md` entry yourself —
explaining it in beginner terms is the proof you own it.
