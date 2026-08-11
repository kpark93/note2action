# note2action

A notes → action-items app, built as a full-stack monorepo. Three apps and one
shared package:

- **`apps/web`** — React 19 + Vite frontend. Proves the wiring by calling the
  API's `/api/health` and rendering the result.
- **`apps/api`** — FastAPI backend (Python + uv). `/api/health` and an example
  `/api/items` endpoint, with persistence behind a swappable in-memory
  repository. One pytest per endpoint.
- **`apps/ai`** — Next.js (App Router) app using the Vercel AI SDK **v6**: a
  `/api/chat` route (`streamText`) and a minimal chat page (`useChat`). Defaults
  to Anthropic `claude-sonnet-5`, provider swappable.
- **`packages/shared`** — shared TypeScript types/constants used by `web` + `ai`.

The JS/TS apps live in a **pnpm workspace**. The Python app is **not** in the
workspace — it uses **uv** — but the root scripts still drive it.

## Prerequisites

| Tool | Version | Notes |
| --- | --- | --- |
| Node | 20+ | 20 or newer |
| pnpm | 9+ | `corepack enable pnpm` (ships with Node) |
| uv | latest | Python package manager — <https://docs.astral.sh/uv/> |
| Docker | with Compose v2 | Only needed for the Docker quickstart |

## Quickstart — Docker (one command)

```bash
# (optional) enable AI chat: add your Anthropic key
cp apps/ai/.env.example apps/ai/.env   # then edit ANTHROPIC_API_KEY

pnpm dev            # docker compose up --build
pnpm dev:down       # stop everything
```

- web → <http://localhost:5173>
- api → <http://localhost:8000> (docs at `/docs`)
- ai  → <http://localhost:3000>

## Quickstart — local (no Docker)

```bash
pnpm install                          # install JS/TS workspace deps
cp apps/ai/.env.example apps/ai/.env  # add ANTHROPIC_API_KEY for the AI app

pnpm dev:local                        # runs web + api + ai together
```

`dev:local` runs all three with `concurrently`: `web` and `ai` via pnpm, and
`api` via `uv run` (uv creates its virtualenv automatically on first run).

Run pieces individually if you prefer:

```bash
pnpm --filter @note2action/web dev    # web only
pnpm --filter @note2action/ai dev     # ai only
pnpm dev:api                          # api only (uv run uvicorn …)
```

## Ports

| App | URL | Port |
| --- | --- | --- |
| web | http://localhost:5173 | 5173 |
| api | http://localhost:8000 | 8000 |
| ai  | http://localhost:3000 | 3000 |

In dev, the web app proxies `/api/*` to the API, so there's no CORS config to
manage.

## Scripts (run from the repo root)

| Command | What it does |
| --- | --- |
| `pnpm dev` | Build + run everything with Docker Compose |
| `pnpm dev:down` | Stop the Docker Compose stack |
| `pnpm dev:local` | Run web + api + ai natively (no Docker) |
| `pnpm lint` | Type-check the JS/TS apps (`--if-present`) |
| `pnpm test` | Run workspace tests + the API's pytest suite |

## Where to add your code

- **`apps/web/src/`** — frontend pages/components. `App.tsx` is the example
  health-check page; add your UI here. The Vite proxy (`vite.config.ts`) sends
  `/api/*` to the backend.
- **`apps/api/app/`** — backend. Add endpoints in `main.py`, request/response
  models in `models.py`. To use a real database, implement `ItemRepository`
  (`repository.py`) with a DB-backed class and construct it in `main.py`.
  Add a test per endpoint under `apps/api/tests/`.
- **`apps/ai/app/`** — the chat page (`page.tsx`) and the `/api/chat` route
  (`api/chat/route.ts`). Swap the model/provider in `lib/provider.ts`.
- **`packages/shared/src/`** — types/constants shared by `web` and `ai`. Keep
  them in sync with the API's models in `apps/api/app/models.py`.

## Notes on a few choices

- **Python stays out of the pnpm workspace.** That's the one seam where JS
  monorepo tooling and Python don't mix cleanly; uv + root scripts is the tidy
  version of it.
- **AI is its own Next.js app**, not folded into the React app — it keeps the
  Vercel AI SDK and its keys isolated.
- **Bare-bones on purpose:** no auth, no database, no CI, no infra/Terraform, no
  component libraries. Everything starts with a single command, and each app
  proves it works (health check through the web UI, one passing API test, one
  streamed chat reply).
