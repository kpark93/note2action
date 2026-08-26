# Monorepo Restructure Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Restructure all four packages for single responsibility — apps/api onto the FastAPI full-stack-template skeleton (routes/core/services/split repositories), apps/web onto views/domain/lib layers, shared and ai split per domain — with zero behavior change.

**Architecture:** Pure refactor in three phases (API, web, shared+ai). Every task moves or mechanically splits existing code, re-points importers, and must end with the full suite green. Layer rules: API `routes → services → repositories → models` with `core/` below all; web `views/components-app → domain → lib`.

**Tech Stack:** FastAPI + SQLAlchemy + uv/pytest; React 19 + Vite + TanStack Query + zustand + vitest; zod contract in packages/shared; pnpm workspace.

**Spec:** `docs/superpowers/specs/2026-08-21-monorepo-restructure-design.md` — the binding authority; read it first. Line numbers below reference the files as they exist at branch start (commit them mentally before moving code).

## Global Constraints

- Pure refactor: same endpoints, status codes, schemas, UI. Tests are moved and re-pointed, never rewritten beyond imports and mechanical splits.
- No new runtime dependencies. No route/query-key/env-var/database renames.
- Web files kebab-case; Python snake_case. Named exports (no new default exports).
- Verification bar (phase gates): `pnpm typecheck && pnpm lint && pnpm test` → 35 vitest + 23 pytest, then `pnpm --filter @note2action/web build`.
- Per-task quick gate: API tasks `cd apps/api && uv run pytest -q` → `23 passed`; web tasks `pnpm --filter @note2action/web test` → 35 passed **and** `pnpm --filter @note2action/web typecheck`.
- Style laws (spec §4.5): uniform module anatomy per layer; ~150-line soft cap; imports grouped external → shared → lower layers → siblings; comments state constraints only; no cleverness.
- Commits: one per task on `refactor/monorepo-restructure`, message style `refactor(api): …` / `refactor(web): …`. **No pushes. No AI-attribution trailers or footers — house rule.** Husky/lint-staged will format staged files on commit; if it modifies files, re-stage and re-commit.
- Preserve existing doc-comments when moving code: the module/class/method docstrings and inline comments are course material — they travel with the code verbatim unless the split makes them false.

---

## Phase 1 — apps/api (Tasks 1–6)

Working dir for shell steps: `apps/api` unless stated. Test command: `uv run pytest -q`.

### Task 1: `core/` package (config, db, security)

**Files:**

- Create: `app/core/__init__.py` (empty)
- Move: `app/settings.py` → `app/core/config.py`; `app/db.py` → `app/core/db.py`; `app/auth.py` → `app/core/security.py`
- Modify: `app/core/db.py:4`, `app/main.py:11,24`, `app/repository.py:20`, `migrations/env.py:13`, `tests/conftest.py:7`, `tests/test_auth.py:12`

**Interfaces:**

- Produces: `app.core.config.settings`, `app.core.db.SessionLocal` / `engine`, `app.core.security.{VerifiedUser, TokenVerifier, InvalidTokenError-raising identity_from_claims, ClerkJWKSVerifier}` — same symbols, new homes. All later tasks import from these paths.

- [ ] **Step 1: Move the files**

```bash
mkdir -p app/core && touch app/core/__init__.py
git mv app/settings.py app/core/config.py
git mv app/db.py app/core/db.py
git mv app/auth.py app/core/security.py
```

- [ ] **Step 2: Fix the five import sites**

| File                 | Old                                                       | New                                                                |
| -------------------- | --------------------------------------------------------- | ------------------------------------------------------------------ |
| `app/core/db.py`     | `from app.settings import settings`                       | `from app.core.config import settings`                             |
| `app/main.py`        | `from .auth import ClerkJWKSVerifier, TokenVerifier`      | `from .core.security import ClerkJWKSVerifier, TokenVerifier`      |
| `app/main.py`        | `from .settings import settings`                          | `from .core.config import settings`                                |
| `app/repository.py`  | `from .db import SessionLocal`                            | `from .core.db import SessionLocal`                                |
| `migrations/env.py`  | `from app.settings import settings`                       | `from app.core.config import settings`                             |
| `tests/conftest.py`  | `from app.auth import VerifiedUser`                       | `from app.core.security import VerifiedUser`                       |
| `tests/test_auth.py` | `from app.auth import VerifiedUser, identity_from_claims` | `from app.core.security import VerifiedUser, identity_from_claims` |

- [ ] **Step 3: Verify** — Run: `uv run pytest -q` · Expected: `23 passed`
- [ ] **Step 4: Commit**

```bash
git add -A && git commit -m "refactor(api): move settings/db/auth into app/core"
```

### Task 2: `models/` and `schemas/` packages

**Files:**

- Create: `app/models/{__init__,base,user,meeting,action_item}.py`, `app/schemas/{__init__,health,items,meetings}.py`
- Delete (via split): `app/models.py`, `app/schemas.py`

**Interfaces:**

- Produces: `app.models` re-exports `Base, User, Meeting, ActionItem` (existing `from .models import …` sites and `migrations/env.py`'s `from app.models import Base` keep working unchanged). `app.schemas` re-exports every schema name; submodules become the canonical homes: `app.schemas.items.{Priority, Status, ActionItem, ActionItemPatch, ItemsResponse, SaveToTasksResponse}`, `app.schemas.meetings.{ExtractedItem, Meeting, CreateMeetingRequest, CreateMeetingResponse, MeetingsResponse, MeetingDetail}`, `app.schemas.health.HealthResponse`.

- [ ] **Step 1: Split `app/models.py`** (content moves verbatim, docstrings included)

`base.py`: the `Base(DeclarativeBase)` class (models.py:6–7) with imports `from sqlalchemy.orm import DeclarativeBase`.
`user.py`: `User` (9–17); `meeting.py`: `Meeting` (19–26); `action_item.py`: `ActionItem` (28–58). Each imports what its columns need (`from datetime import date, datetime`, `from sqlalchemy.orm import Mapped, mapped_column`, `from sqlalchemy import ForeignKey, Text, DateTime, CheckConstraint, text`, `from .base import Base` — keep only the names each file uses).
`__init__.py`:

```python
from .base import Base
from .user import User
from .meeting import Meeting
from .action_item import ActionItem

__all__ = ["Base", "User", "Meeting", "ActionItem"]
```

Then `git rm app/models.py` (after copying; or `git mv app/models.py app/models/action_item.py` first and carve the others out of it — either way, no content changes).

- [ ] **Step 2: Split `app/schemas.py`** the same way

`items.py`: module docstring (schemas.py:1) + `Priority`, `Status` aliases (8–9), `ActionItem` (11–30), `ActionItemPatch` (33–47), `SaveToTasksResponse` (105–108), `ItemsResponse` (117–118). Imports: `from pydantic import BaseModel`, `from typing import Literal`.
`meetings.py`: `ExtractedItem` (50–62), `Meeting` (65–71), `CreateMeetingRequest` (74–79), `CreateMeetingResponse` (82–86), `MeetingsResponse` (89–92), `MeetingDetail` (95–102). Imports: `from pydantic import BaseModel` and `from .items import ActionItem, Priority`.
`health.py`: `HealthResponse` (111–114).
`__init__.py` re-exports all names (same `__all__` pattern as models).

- [ ] **Step 3: Verify** — Run: `uv run pytest -q` · Expected: `23 passed`
- [ ] **Step 4: Commit** — `git add -A && git commit -m "refactor(api): split models and schemas into per-domain modules"`

### Task 3: `repositories/` package (the seam, split)

**Files:**

- Create: `app/repositories/{__init__,protocols,mappers,memory}.py`, `app/repositories/postgres/{__init__,session,users,items,meetings}.py`
- Delete: `app/repository.py`
- Modify: `app/main.py`, `tests/conftest.py`, `tests/test_repository.py`, `tests/test_auth.py`

**Interfaces:**

- Produces (later tasks depend on these exact names):
  - `app.repositories.protocols`: `UserRepository`, `ItemRepository`, `MeetingRepository` (Protocols; method signatures identical to today's `repository.py:89–114`, regrouped), and

    ```python
    @dataclass(frozen=True)
    class Repositories:
        users: UserRepository
        items: ItemRepository
        meetings: MeetingRepository
    ```

  - `app.repositories.memory`: `SEED_CLERK_ID`, `MemoryState`, `build_memory_repositories() -> Repositories`. The three memory classes expose the shared state as a **public** `state` attribute (fakes are white-box by design; tests read `…users.state.user_names`).
  - `app.repositories.postgres`: `build_postgres_repositories() -> Repositories`.
  - `app.repositories.mappers`: `to_wire(row, meeting_title)`, `new_item(item_id, meeting_id, meeting_title, extracted)` (was `_new_item` — public inside the package).

- [ ] **Step 1: `protocols.py`** — module docstring from repository.py:1–6; move the Protocol docstring + methods from repository.py:81–114, regrouped: `get_or_create_user` (89–96) into `UserRepository`; `list_items/update_item/delete_item/save_all_to_tasks` (98–106) into `ItemRepository`; `create_meeting/list_meetings/get_meeting` (108–114) into `MeetingRepository`; add the `Repositories` dataclass above. Imports: `from dataclasses import dataclass`, `from typing import Protocol`, `from app.schemas.items import ActionItem, ActionItemPatch`, `from app.schemas.meetings import CreateMeetingRequest, CreateMeetingResponse, Meeting, MeetingDetail`.

- [ ] **Step 2: `mappers.py`** — move `to_wire` (35–50) and `_new_item` (53–73, renamed `new_item`, docstring kept). Imports: `from app.models import ActionItem as ActionItemRow`, `from app.schemas.items import ActionItem`, `from app.schemas.meetings import ExtractedItem`.

- [ ] **Step 3: `memory.py`** — `SEED_CLERK_ID` + comment (76–78), `_MeetingRecord` (117–125), then:

```python
class MemoryState:
    """All the fake's data in one place, shared by the three repositories —
    mirroring how the Postgres impls share one database. Seeded with one
    user, one meeting, two items (ids 1-2 / meeting id 1 are claimed)."""
```

with the seed `__init__` from repository.py:136–155 (fields lose their underscores: `users`, `user_names`, `next_user_id`, `meetings`, `items`, `next_item_id`, `next_meeting_id`) and the two helpers `item_count` / `owns_meeting` (157–164, de-underscored). Then three classes, each `def __init__(self, state: MemoryState) -> None: self.state = state`, with method bodies moved verbatim from 166–275 (`self._users` → `self.state.users`, `self._owns_meeting(…)` → `self.state.owns_meeting(…)`, etc.; the `InMemoryItemRepository` class docstring 129–134 moves onto `MemoryState`):

- `MemoryUserRepository`: `get_or_create_user` (166–176)
- `MemoryItemRepository`: `list_items` (178–181), `update_item` (183–197), `delete_item` (199–204), `save_all_to_tasks` (206–216)
- `MemoryMeetingRepository`: `create_meeting` (218–247, `_new_item` → `new_item` from `.mappers`), `list_meetings` (249–263), `get_meeting` (265–275)

```python
def build_memory_repositories() -> Repositories:
    state = MemoryState()
    return Repositories(
        users=MemoryUserRepository(state),
        items=MemoryItemRepository(state),
        meetings=MemoryMeetingRepository(state),
    )
```

- [ ] **Step 4: `postgres/`** — `session.py`: `_rls_session` (278–293) renamed `rls_session`, docstring verbatim; imports `contextmanager`, `Iterator`, `text`, `Session`, `from app.core.db import SessionLocal`. `users.py`: `PostgresUserRepository` with `get_or_create_user` (305–329) — class docstring from 297–303 moves here (it describes the isolation strategy; trim to what applies). `items.py`: `PostgresItemRepository` with 331–382. `meetings.py`: `PostgresMeetingRepository` with 384–470. Each imports exactly what its methods use (`select`, `func`, `sql_update`, `IntegrityError`, `date`, `datetime`, `timezone`, `from .session import rls_session`, `from ..mappers import to_wire`, models, schemas). `postgres/__init__.py`:

```python
from app.repositories.protocols import Repositories
from .items import PostgresItemRepository
from .meetings import PostgresMeetingRepository
from .users import PostgresUserRepository


def build_postgres_repositories() -> Repositories:
    return Repositories(
        users=PostgresUserRepository(),
        items=PostgresItemRepository(),
        meetings=PostgresMeetingRepository(),
    )
```

Also `app/repositories/__init__.py`: empty (import from submodules — the canonical-home rule).

- [ ] **Step 5: Re-point `app/main.py`** — replace lines 23 and 28–33 with:

```python
from .repositories.memory import build_memory_repositories
from .repositories.postgres import build_postgres_repositories
from .repositories.protocols import Repositories

# Swap happens here and nowhere else — see app/repositories/.
repositories: Repositories = (
    build_postgres_repositories()
    if settings.repository == "postgres"
    else build_memory_repositories()
)
```

and mechanically re-point every call: `repository.get_or_create_user` → `repositories.users.get_or_create_user`; `repository.list_items/update_item/delete_item/save_all_to_tasks` → `repositories.items.…`; `repository.create_meeting/list_meetings/get_meeting` → `repositories.meetings.…`.

- [ ] **Step 6: Re-point tests** — `conftest.py`: `from app.repository import InMemoryItemRepository, SEED_CLERK_ID` → `from app.repositories.memory import build_memory_repositories, SEED_CLERK_ID`; fixture body line → `main_module.repositories = build_memory_repositories()`. `test_repository.py`: `from app.repository import InMemoryItemRepository, to_wire` → `from app.repositories.mappers import to_wire` + `from app.repositories.memory import MemoryState, MemoryUserRepository`; in the name-laws test `repo = InMemoryItemRepository()` → `repo = MemoryUserRepository(MemoryState())` and `repo._user_names[…]` → `repo.state.user_names[…]` (5 sites). `test_auth.py`: `repo = main_module.repository` → `users = main_module.repositories.users`; `repo.get_or_create_user(…)` → `users.get_or_create_user(…)`; `repo._user_names[user_id]` → `users.state.user_names[user_id]`.

- [ ] **Step 7: Delete the monolith** — `git rm app/repository.py`
- [ ] **Step 8: Verify** — `uv run pytest -q` · Expected: `23 passed`
- [ ] **Step 9: Commit** — `git add -A && git commit -m "refactor(api): split repository seam into per-domain protocols and impls"`

### Task 4: `services/` layer

**Files:**

- Create: `app/services/{__init__,users,items,meetings}.py` (`__init__` empty)
- Modify: `app/main.py` (routes call services)

**Interfaces:**

- Produces: `app.services.users.resolve_user_id(users: UserRepository, identity: VerifiedUser) -> int`; `app.services.items.{list_items, update_item, delete_item, save_all_to_tasks}`; `app.services.meetings.{create_meeting, list_meetings, get_meeting}` — each takes its repository protocol first, then today's route arguments; return types identical to the repository methods. Services import zero FastAPI symbols.

- [ ] **Step 1: Write the three service modules**

`users.py`:

```python
"""User rules: a verified identity maps onto exactly one users row."""

from app.core.security import VerifiedUser
from app.repositories.protocols import UserRepository


def resolve_user_id(users: UserRepository, identity: VerifiedUser) -> int:
    """The verified caller's users.id, created on first visit.

    Identity comes from a verified token — never from anything the client
    typed into a body. The repository owns the name laws and race handling.
    """
    return users.get_or_create_user(identity.clerk_id, identity.name)
```

`items.py`:

```python
"""Item use-cases. Thin today; business rules land here, not in routes."""

from app.repositories.protocols import ItemRepository
from app.schemas.items import ActionItem, ActionItemPatch


def list_items(items: ItemRepository, user_id: int) -> list[ActionItem]:
    return items.list_items(user_id)


def update_item(
    items: ItemRepository, user_id: int, item_id: int, patch: ActionItemPatch
) -> ActionItem | None:
    return items.update_item(user_id, item_id, patch)


def delete_item(items: ItemRepository, user_id: int, item_id: int) -> bool:
    return items.delete_item(user_id, item_id)


def save_all_to_tasks(items: ItemRepository, user_id: int) -> int:
    return items.save_all_to_tasks(user_id)
```

`meetings.py`: same shape — `create_meeting(meetings, user_id, request) -> CreateMeetingResponse`, `list_meetings(meetings, user_id, limit) -> list[Meeting]`, `get_meeting(meetings, user_id, meeting_id) -> MeetingDetail | None`, importing `MeetingRepository` and the meeting schemas, each a one-line delegation with docstring `"""Meeting use-cases. The atomic meeting+items write lives behind create."""` at module level.

- [ ] **Step 2: Re-point `app/main.py`** — `current_user_id` body becomes `return users_service.resolve_user_id(repositories.users, identity)`; each route body calls its service (`items_service.list_items(repositories.items, user_id)` etc.). Import as `from .services import items as items_service, meetings as meetings_service, users as users_service`.
- [ ] **Step 3: Verify** — `uv run pytest -q` · Expected: `23 passed`
- [ ] **Step 4: Commit** — `git add -A && git commit -m "refactor(api): add thin services layer between routes and repositories"`

### Task 5: `api/` package, `core/middleware.py`, factory `main.py`

**Files:**

- Create: `app/core/middleware.py`, `app/api/{__init__,main,deps}.py`, `app/api/routes/{__init__,health,items,meetings}.py`
- Modify: `app/main.py` (shrinks to the factory), `tests/conftest.py` (app.state injection), `tests/test_auth.py`

**Interfaces:**

- Consumes: services (Task 4), `Repositories`/builders (Task 3), `core.security` (Task 1).
- Produces: `app.core.middleware.{PUBLIC_PATHS, require_verified_user}`; `app.api.deps.{get_repositories(request) -> Repositories, current_user_id(request) -> int}`; `app.api.main.api_router`; `app.main.app` with `app.state.repositories` + `app.state.token_verifier` as the only injection points.

- [ ] **Step 1: `core/middleware.py`** — move main.py:41–83 verbatim (comment + `PUBLIC_PATHS` + `require_verified_user`, WITHOUT the `@app.middleware` decorator — it becomes a plain async function). Imports: `from fastapi import Request`, `from fastapi.responses import JSONResponse`, `from jwt.exceptions import PyJWTError`, `from app.core.security import TokenVerifier`.

- [ ] **Step 2: `api/deps.py`**

```python
"""Route dependencies — how handlers reach state the middleware verified."""

from fastapi import Request

from app.repositories.protocols import Repositories
from app.services import users as users_service


def get_repositories(request: Request) -> Repositories:
    return request.app.state.repositories


def current_user_id(request: Request) -> int:
    """The verified caller's users.id (created on first visit).

    The identity comes from request.state — stamped by the middleware from a
    *verified* token — never from anything the client typed into a body.
    """
    identity = request.state.identity
    return users_service.resolve_user_id(
        get_repositories(request).users, identity
    )
```

- [ ] **Step 3: Route modules** — each starts `router = APIRouter()`; endpoint functions move verbatim from main.py with `@app.` → `@router.`, plus a `repos: Repositories = Depends(get_repositories)` parameter, calling the services exactly as main.py does after Task 4. `health.py`: the health endpoint (96–102; no deps). `items.py`: list/update/delete (105–123) + save-to-tasks (150–152). `meetings.py`: create/list/get (126–147). Imports per file: `from fastapi import APIRouter, Depends, HTTPException`, `from app.api.deps import current_user_id, get_repositories`, `from app.repositories.protocols import Repositories`, the service module, and the schemas each route names. `api/main.py`:

```python
from fastapi import APIRouter

from app.api.routes import health, items, meetings

api_router = APIRouter()
api_router.include_router(health.router)
api_router.include_router(items.router)
api_router.include_router(meetings.router)
```

- [ ] **Step 4: Shrink `app/main.py` to the factory** (docstring updated to `"""FastAPI application factory — wiring only: state, middleware, routers."""`; the original state-choosing comments from lines 28 and 35–36 stay with their lines):

```python
from fastapi import FastAPI

from .api.main import api_router
from .core.config import settings
from .core.middleware import require_verified_user
from .core.security import ClerkJWKSVerifier
from .repositories.memory import build_memory_repositories
from .repositories.postgres import build_postgres_repositories

app = FastAPI(title="note2action API")

app.state.repositories = (
    build_postgres_repositories()
    if settings.repository == "postgres"
    else build_memory_repositories()
)
app.state.token_verifier = (
    ClerkJWKSVerifier(settings.clerk_jwks_url)
    if settings.clerk_jwks_url
    else None
)
app.middleware("http")(require_verified_user)
app.include_router(api_router)
```

- [ ] **Step 5: Re-point tests to app.state** — `conftest.py` fixture: `main_module.repositories = …` → `main_module.app.state.repositories = build_memory_repositories()` (docstring's "regardless of .env" promise still holds — say so). `test_auth.py`: `users = main_module.repositories.users` → `users = main_module.app.state.repositories.users`.
- [ ] **Step 6: Verify** — `uv run pytest -q` · Expected: `23 passed`. Also boot it: `uv run uvicorn app.main:app --port 8099 &`, `curl -s localhost:8099/api/health | grep ok`, kill it.
- [ ] **Step 7: Commit** — `git add -A && git commit -m "refactor(api): route modules, deps, middleware module, factory main"`

### Task 6: mirror the tests tree

**Files:**

- Move: `tests/test_{health,auth,items,meetings}.py` → `tests/api/routes/`; `tests/test_repository.py` → `tests/repositories/`
- Create: `tests/api/__init__.py`, `tests/api/routes/__init__.py`, `tests/repositories/__init__.py` (all empty)

- [ ] **Step 1: Move**

```bash
mkdir -p tests/api/routes tests/repositories
touch tests/api/__init__.py tests/api/routes/__init__.py tests/repositories/__init__.py
git mv tests/test_health.py tests/test_auth.py tests/test_items.py tests/test_meetings.py tests/api/routes/
git mv tests/test_repository.py tests/repositories/
```

No import edits needed: `tests.conftest` still resolves (pythonpath=".") and conftest applies to the whole subtree.

- [ ] **Step 2: Verify** — `uv run pytest -q` · Expected: `23 passed` (same count — nothing lost in the move)
- [ ] **Step 3: Phase gate** — from repo root: `pnpm typecheck && pnpm lint && pnpm test && pnpm --filter @note2action/web build` · Expected: all green, 35 + 23.
- [ ] **Step 4: Commit** — `git add -A && git commit -m "refactor(api): mirror tests tree to source layout"`

---

## Phase 2 — apps/web (Tasks 7–11)

Working dir: repo root. Quick gate per task: `pnpm --filter @note2action/web typecheck && pnpm --filter @note2action/web test` → 35 passed.

### Task 7: `domain/meetings` + `domain/health`

**Files:**

- Move: `apps/web/src/lib/meetings.api.ts` → `apps/web/src/domain/meetings/meetings.api.ts`; `apps/web/src/lib/health.ts` → `apps/web/src/domain/health/health.queries.ts`
- Create: `apps/web/src/domain/meetings/meetings.queries.ts`
- Modify: `apps/web/src/lib/items.queries.ts`, `apps/web/src/store/actionItems.store.ts`, `apps/web/src/components/app/sidebar.tsx`, plus every importer of the meetings hooks (Step 3)

**Interfaces:**

- Produces: `@/domain/meetings/meetings.queries` exporting `meetingsKey`, `useMeetingsQuery`, `useMeetingQuery`; `@/domain/meetings/meetings.api` exporting `createMeeting`, `fetchMeetings`, `fetchMeeting`; `@/domain/health/health.queries` exporting `getHealth`, `useHealth`.

- [ ] **Step 1: Extract the meetings hooks** — new `meetings.queries.ts` takes, verbatim from `lib/items.queries.ts`: `export const meetingsKey = ["meetings"] as const;` (line 16), `useMeetingsQuery` (51–56), `useMeetingQuery` + its doc comment (58–65). Header:

```ts
// TanStack Query hooks for meetings (captures) — server state, cached.
import { useQuery } from "@tanstack/react-query";
import { fetchMeeting, fetchMeetings } from "@/domain/meetings/meetings.api";
```

- [ ] **Step 2: Shrink `lib/items.queries.ts`** — delete the moved lines; replace its `meetingsKey` definition/use with `import { meetingsKey } from "@/domain/meetings/meetings.queries";` (the `useDeleteItem` invalidation comment "A delete changes the meetings' itemCounts too." stays). Drop the now-unused `fetchMeeting, fetchMeetings` import.
- [ ] **Step 3: Re-point importers** (typecheck is the safety net — it must end clean):
  - `@/lib/meetings.api` → `@/domain/meetings/meetings.api` in: `store/actionItems.store.ts`, `lib/items.queries.ts` (removed in Step 2).
  - Meetings hooks (`useMeetingsQuery`, `useMeetingQuery`, `meetingsKey`) now import from `@/domain/meetings/meetings.queries` in whichever of these currently pull them from `@/lib/items.queries`: `components/app/recent-captures.tsx`, `components/app/recent-modal.tsx`, `views/meetings/meetings.view.tsx`, `views/home/home.view.tsx`, `views/history/history.view.tsx`, `store/actionItems.store.ts` (check each file's named imports; items hooks stay put for now).
  - `@/lib/health` → `@/domain/health/health.queries` in `components/app/sidebar.tsx`.
- [ ] **Step 4: Verify** — quick gate (35 tests + typecheck) and `pnpm lint`.
- [ ] **Step 5: Commit** — `git add -A && git commit -m "refactor(web): meetings and health domain modules"`

### Task 8: `domain/items`

**Files:**

- Move: `lib/items.api.ts` → `domain/items/items.api.ts`; `lib/items.ts` → `domain/items/items.utils.ts`; `lib/items.test.ts` → `domain/items/items.utils.test.ts`; `lib/items.queries.ts` → `domain/items/items.queries.ts`; `store/actionItems.types.ts` → `domain/items/items.types.ts`
- Create: `domain/items/items.constants.ts`
- Modify: `views/history/history.utils.ts` (+ its test if it imported TODAY), every importer listed in Step 3

**Interfaces:**

- Produces: `@/domain/items/items.queries` (`itemsKey`, `useItemsQuery`, `usePatchItem`, `useDeleteItem`, `useSaveToTasks`); `@/domain/items/items.api` (`fetchItems`, `patchItem`, `deleteItem`, `saveAllToTasks`, `ItemPatch`); `@/domain/items/items.types` (`ActionItem`, `Priority`, `Status` — the dead `Screen` type is deleted); `@/domain/items/items.utils` (`initials`, `isLow`, `openItems`, `doneItems`, `pendingItems`, `savedTasks`, `Summary`, `summary`); `@/domain/items/items.constants` (`OWNERS`, `STATUSES`, `PRIORITIES`, `LOW_CONFIDENCE_THRESHOLD`).

- [ ] **Step 1: Move the five files** (`git mv`), fixing their own imports: `items.api.ts`'s `from "@/store/actionItems.types"` → `from "@/domain/items/items.types"`; `items.utils.ts` likewise, and its `LOW_CONFIDENCE_THRESHOLD` import → `from "@/domain/items/items.constants"`; in `items.types.ts` delete the `Screen` type (zero importers) and keep the rest verbatim.
- [ ] **Step 2: `items.constants.ts`** — new content (OWNERS comment and values verbatim from `actionItems.constants.ts:5–11,25–26`):

```ts
// Item option lists shared across features. STATUSES/PRIORITIES derive from
// the zod contract — one source of truth, no drift.
import { Priority, Status } from "@note2action/shared";

export const OWNERS = [
  "Rachel Ng",
  "Kyle Park",
  "Marcus Hale",
  "Priya Shah",
  "Unassigned",
] as const;

export const STATUSES: Status[] = [...Status.options];
export const PRIORITIES: Priority[] = [...Priority.options];

/** Confidence below this is flagged as "needs review". */
export const LOW_CONFIDENCE_THRESHOLD = 80;
```

- [ ] **Step 3: Re-point importers** — mechanical, then typecheck:
  - `@/lib/items.queries` → `@/domain/items/items.queries`: `components/app/{task-row,review-card,history-row,sidebar-nav,recent-captures,completion-card,recent-modal}.tsx`, `views/{home/home,review/review,tasks/tasks,history/history,meetings/meetings}.view.tsx`, `store/actionItems.store.ts` (each keeps only the item-hook names; meetings names came from Task 7).
  - `@/lib/items` → `@/domain/items/items.utils`: `components/app/{sidebar-nav,completion-card}.tsx`, `views/home/home.view.tsx`, `views/tasks/{tasks.view.tsx,tasks.utils.ts}`, `views/review/review.utils.ts`, `views/history/history.utils.ts`.
  - `@/store/actionItems.types` → `@/domain/items/items.types`: `test/fixtures.ts`, `components/app/{task-row,review-card,history-row,priority-badge}.tsx`, `views/tasks/{tasks.utils.ts,tasks.view.tsx}`, `views/review/review.utils.ts`, `views/history/history.utils.ts` (items.api/items.utils already fixed in Step 1).
  - `@/store/actionItems.constants` → `@/domain/items/items.constants` for `OWNERS`/`STATUSES`/`PRIORITIES`/`LOW_CONFIDENCE_THRESHOLD`: `components/app/{notes-editor,review-card}.tsx`, `views/tasks/tasks.view.tsx`, `views/review/review.utils.ts`, `views/history/history.view.tsx`.
  - `TODAY`: define at the top of `views/history/history.utils.ts` (its only consumer), comment kept: `/** "Today" is pinned so the seeded due/completed dates stay meaningful. */ const TODAY = "2026-08-11";` — export it only if `history.utils.test.ts` imports it (check; keep the test compiling without edits beyond the import path).
- [ ] **Step 4: Verify** — quick gate + `pnpm lint`.
- [ ] **Step 5: Commit** — `git add -A && git commit -m "refactor(web): items domain module; contract-derived constants"`

### Task 9: `domain/extraction`, `lib/query-client.ts`, dissolve `store/`

**Files:**

- Create: `apps/web/src/lib/query-client.ts`
- Move: `lib/actionItems.api.ts` → `domain/extraction/extraction.api.ts`; `store/actionItems.store.ts` → `domain/extraction/extraction.store.ts`; `store/theme.store.ts` → `lib/theme.store.ts`
- Create: `domain/extraction/extraction.constants.ts` (from the rest of `store/actionItems.constants.ts`); delete `store/actionItems.constants.ts` and the empty `store/`
- Modify: `providers.tsx`, `components/app/{notes-editor,recent-captures,recent-modal,sidebar}.tsx`, `views/capture/capture.view.tsx`, `views/meetings/meetings.view.tsx`

**Interfaces:**

- Produces: `@/lib/query-client` exporting `queryClient`; `@/domain/extraction/extraction.store` exporting `useActionItems`; `@/domain/extraction/extraction.api` exporting `extractActionItems`; `@/domain/extraction/extraction.constants` exporting `DEFAULT_RAW`, `DEFAULT_MEETING_TITLE`, `SAMPLES`.

- [ ] **Step 1: `lib/query-client.ts`** — move the `queryClient` declaration + its two comments verbatim from `providers.tsx:8–20`; `providers.tsx` gains `import { queryClient } from "@/lib/query-client";` and loses the `QueryClient` import if now unused. (This kills the app's one upward import: domain store → providers.)
- [ ] **Step 2: `extraction.constants.ts`** — module comment from `actionItems.constants.ts:1–2` + `SAMPLE` (28–35), `DEFAULT_RAW`, `DEFAULT_MEETING_TITLE` (37–38), `SAMPLES` (40–73), all verbatim. No imports needed.
- [ ] **Step 3: Move the store and api** — `extraction.store.ts` import block becomes: `@/domain/extraction/extraction.api` (extractActionItems), `@/domain/meetings/meetings.api`, `@/domain/items/items.queries` (itemsKey), `@/domain/meetings/meetings.queries` (meetingsKey), `@/lib/query-client`, `./extraction.constants`. Body untouched. `extraction.api.ts`: only its filename changes; header comment stays.
- [ ] **Step 4: Re-point store importers** — `@/store/actionItems.store` → `@/domain/extraction/extraction.store` in `components/app/{notes-editor,recent-captures,recent-modal}.tsx`, `views/capture/capture.view.tsx`, `views/meetings/meetings.view.tsx`; `@/store/theme.store` → `@/lib/theme.store` in `components/app/sidebar.tsx`. Then `rmdir apps/web/src/store` (must already be empty).
- [ ] **Step 5: Verify** — quick gate + `pnpm lint`; also `grep -rn "@/store/\|@/providers\"" apps/web/src --include='*.ts*'` → only `main.tsx`'s relative `./providers` remains (no `@/store` hits at all).
- [ ] **Step 6: Commit** — `git add -A && git commit -m "refactor(web): extraction domain, query-client in lib, store folder dissolved"`

### Task 10: feature components into their views

**Files:**

- Move (git mv, no content edits except sibling-relative imports that break):
  - → `views/capture/components/`: `notes-editor.tsx`, `recent-captures.tsx`
  - → `views/review/components/`: `review-card.tsx`, `confidence-pill.tsx`
  - → `views/tasks/components/`: `task-row.tsx`, `priority-badge.tsx`
  - → `views/history/components/`: `history-row.tsx`, `stat-card.tsx`
  - → `views/home/components/`: `recap-card.tsx`
- Delete: `components/app/slot-number.tsx` (zero importers — dead)
- Modify: the importing views (Step 2); inside moved files, `./confidence-pill` (in review-card) and `./priority-badge` (in task-row) keep working because the pairs move together — verify, don't assume.

- [ ] **Step 1: Move + delete** with `git mv` / `git rm`.
- [ ] **Step 2: Re-point view imports** — `@/components/app/notes-editor` → `./components/notes-editor` etc. in `views/capture/capture.view.tsx` (notes-editor, recent-captures), `views/review/review.view.tsx` (review-card), `views/tasks/tasks.view.tsx` (task-row), `views/history/history.view.tsx` (history-row, stat-card), `views/home/home.view.tsx` (recap-card). Cross-check nothing else imported the moved files: `grep -rn "components/app/\(notes-editor\|recent-captures\|review-card\|confidence-pill\|task-row\|priority-badge\|history-row\|stat-card\|recap-card\|slot-number\)" apps/web/src` → zero hits.
- [ ] **Step 3: Verify** — quick gate + `pnpm lint`.
- [ ] **Step 4: Commit** — `git add -A && git commit -m "refactor(web): feature components move into their views"`

### Task 11: `app.tsx` rename + phase sweep

- [ ] **Step 1:** `git mv apps/web/src/App.tsx apps/web/src/app.tsx` (if the case-insensitive FS rejects it: `git mv App.tsx app-tmp.tsx && git mv app-tmp.tsx app.tsx`). Update `main.tsx`: `from "./App"` → `from "./app"`.
- [ ] **Step 2: Layer-rule sweep** (all must return zero):

```bash
grep -rn '@/views/' apps/web/src/domain apps/web/src/lib apps/web/src/components 2>/dev/null
grep -rn '@/domain/' apps/web/src/lib 2>/dev/null
grep -rn '@/store/\|@/lib/items\b\|@/lib/meetings\|@/lib/health\|@/lib/actionItems' apps/web/src 2>/dev/null
```

(`components/app` → `@/domain` is allowed; `components/ui` must import only `@/lib/utils` — spot-check.)

- [ ] **Step 3: Phase gate** — `pnpm typecheck && pnpm lint && pnpm test && pnpm --filter @note2action/web build` · Expected: 35 + 23, build clean.
- [ ] **Step 4: Commit** — `git add -A && git commit -m "refactor(web): kebab-case app entry; layer sweep clean"`

---

## Phase 3 — packages/shared + apps/ai + docs (Tasks 12–14)

### Task 12: split the shared contract

**Files:**

- Create: `packages/shared/src/{app,health,items,extraction,meetings}.ts`
- Modify: `packages/shared/src/index.ts` (re-exports only)

**Interfaces:**

- Produces: identical public API from the package root — consumers change nothing. Internal homes: `app.ts` (`APP_NAME`), `health.ts` (`HealthResponse`), `items.ts` (`Priority`, `Status`, `ActionItem`, `ItemsResponse`, `ActionItemPatch`, `SaveToTasksResponse`), `extraction.ts` (`ExtractedItem`, `ExtractRequest`, `ExtractResponse` — imports `Priority` from `./items`), `meetings.ts` (`Meeting`, `CreateMeetingRequest`, `CreateMeetingResponse`, `MeetingsResponse`, `MeetingDetail` — imports `ActionItem` from `./items`, `ExtractedItem` from `./extraction`).

- [ ] **Step 1: Split** — move each schema+type pair verbatim (doc comments included; the schema/type-sharing explainer comment from index.ts:1–9 moves to `items.ts`, the busiest file). Every submodule starts `import { z } from "zod";`. New `index.ts`:

```ts
// Shared contract between the frontend(s) and the API — re-exports only;
// each domain's schemas live in their own module.
export * from "./app";
export * from "./health";
export * from "./items";
export * from "./extraction";
export * from "./meetings";
```

- [ ] **Step 2: Verify** — full bar from root: `pnpm typecheck && pnpm lint && pnpm test` (35 + 23; both web and ai consume the package root and must not notice).
- [ ] **Step 3: Commit** — `git add -A && git commit -m "refactor(shared): split zod contract per domain behind re-exporting index"`

### Task 13: ai extraction module

**Files:**

- Create: `apps/ai/lib/extraction.ts`
- Modify: `apps/ai/app/api/extract/route.ts`

**Interfaces:**

- Produces: `extractItems(request: ExtractRequest): Promise<ExtractResponse>` in `@/lib/extraction` (`apps/ai/lib/provider.ts` is already in place — nothing moves there).

- [ ] **Step 1: `lib/extraction.ts`** — move the `generateObject` call with its system/prompt strings and comments verbatim from the route:

```ts
import { generateObject } from "ai";
import { ExtractResponse, type ExtractRequest } from "@note2action/shared";
import { extractModel } from "@/lib/provider";

/**
 * Run the extraction model over raw notes. `generateObject` constrains the
 * model to the ExtractResponse schema and validates the result, so callers
 * always get well-formed items back.
 */
export async function extractItems(request: ExtractRequest): Promise<ExtractResponse> {
  const { notes, meetingTitle, today, owners } = request;
  const { object } = await generateObject({
    model: extractModel(),
    schema: ExtractResponse,
    system: /* moved verbatim from route.ts */,
    prompt: /* moved verbatim from route.ts */,
  });
  return object;
}
```

(The two template strings move exactly as they are in `route.ts` today — no wording changes; the model prompt is behavior.)

- [ ] **Step 2: Thin the route** to:

```ts
import { ExtractRequest } from "@note2action/shared";
import { extractItems } from "@/lib/extraction";

// Extraction can take a few seconds for long transcripts.
export const maxDuration = 30;

export async function POST(req: Request) {
  const request = ExtractRequest.parse(await req.json());
  return Response.json(await extractItems(request));
}
```

- [ ] **Step 3: Verify** — `pnpm --filter @note2action/ai typecheck && pnpm lint`.
- [ ] **Step 4: Commit** — `git add -A && git commit -m "refactor(ai): extraction logic behind lib module, thin route"`

### Task 14: README + final gate

**Files:**

- Modify: `README.md` — the "Where things live" section only.

- [ ] **Step 1: Rewrite "Where things live"** to match the new trees (source of truth: spec §3): web bullet points become `views/` (feature modules with local `components/`), `domain/` (items/meetings/extraction/health — state & queries shared between views), `components/` (ui + app chrome), `lib/` (http, query-client, auth-token, theme, dates, sound, utils); api bullets become `app/api/routes/` + `deps`, `app/core/`, `app/services/`, `app/repositories/` (protocols, memory, postgres), `app/models/` + `app/schemas/` per domain, `tests/` mirroring source; shared bullet notes the per-domain modules behind `index.ts`; ai bullet notes `lib/provider.ts` + `lib/extraction.ts`.
- [ ] **Step 2: Final full gate** — `pnpm typecheck && pnpm lint && pnpm test && pnpm --filter @note2action/web build` · Expected: 35 + 23, clean build.
- [ ] **Step 3: Smoke check (manual, Kyle's checkpoint)** — with Postgres up and `.env`s in place: `pnpm dev:local`, sign in, capture → extract → review → save to tasks; items and history render. No code changes expected from this step — it proves the refactor never touched behavior.
- [ ] **Step 4: Commit** — `git add -A && git commit -m "docs: point README at the restructured tree"`
