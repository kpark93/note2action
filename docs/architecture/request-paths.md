# Request paths — three journeys, hop by hop

Companion to the module comments in the code: each hop names the exact file
and symbol, so you can read a journey here, then open any file on the route
and find its header agreeing with this map. (Sibling docs: `overview.md`,
`web.md`, `api.md`, `ai.md` describe the pieces; this file describes the
_trips_.)

Conventions: `→` is "calls / hands off to". Every hop is `file :: symbol`.

---

## §1 — A read: opening the Tasks screen

What it feels like: you click **Tasks** and the table is just… there.
What actually happens — and every file on this route carries a matching
`Path §1 [hop N/15]` marker in its header, so you can follow the trail
in the code itself:

1. `apps/web/src/app.tsx :: <Route path="tasks">` — the router mounts
   `TasksView`. The layout route above it already passed `RequireAuth`
   (`components/app/require-auth.tsx`), so a Clerk session exists.
2. `views/tasks/tasks.view.tsx :: TasksView` — calls the domain hook
   `useItemsQuery()`. **If the cache already has items** (the sidebar badge
   keeps this query alive), the table renders instantly from the cache and
   the rest of this journey only runs if the data is stale (older than
   `staleTime`, 30s — set in `lib/query-client.ts`).
3. `domain/items/items.queries.ts :: useItemsQuery` — TanStack Query calls
   `fetchItems` and caches the result under the key `["items"]`.
4. `domain/items/items.api.ts :: fetchItems` — builds the actual HTTP call.
5. `lib/http.ts :: request` — asks `lib/auth-token.ts` for a fresh Clerk
   session JWT (a signed token proving who you are) and attaches it as
   `Authorization: Bearer …`, then `fetch("/api/items")`.
6. **Vite dev proxy** (`apps/web/vite.config.ts`) — forwards `/api/*` from
   :5173 to the FastAPI server on :8001. (No CORS needed — the browser
   thinks it's talking to one origin.)
7. `apps/api/app/core/middleware.py :: require_verified_user` — the API's
   front door. Verifies the JWT's signature against Clerk's JWKS (published
   public keys, fetched by `core/security.py :: ClerkJWKSVerifier`). Bad or
   missing token → 401 right here; the route never runs. On success the
   verified identity rides on `request.state.identity`.
8. `apps/api/app/api/routes/items.py :: list_items` — the route. Its
   `Depends(current_user_id)` runs first:
9. `apps/api/app/api/deps.py :: current_user_id` — turns the verified Clerk
   id into our `users.id` via `services/users.py :: resolve_user_id` →
   `repositories/postgres/users.py :: get_or_create_user` (first visit
   creates the row; the token's name claim keeps the name fresh).
10. `apps/api/app/services/items.py :: list_items` — the business-rule layer
    (thin here; it exists so rules never live in routes).
11. `apps/api/app/repositories/postgres/items.py :: list_items` — opens
    `postgres/session.py :: rls_session(user_id)`, which runs
    `SET LOCAL app.user_id = <id>` — telling Postgres who's asking, for this
    transaction only. The SELECT filters by `user_id` **and** Postgres RLS
    (row-level security) filters again independently: two locks, one door.
12. `apps/api/app/repositories/mappers.py :: to_wire` — each row is
    translated from database shape (snake_case, real dates) into the wire
    shape (camelCase, ISO strings, meeting title joined in, `user_id`
    deliberately omitted).
13. `apps/api/app/schemas/items.py :: ItemsResponse` — FastAPI serializes
    the pydantic schema to JSON. Response travels back through the proxy.
14. `lib/http.ts` again — the response is parsed with the **zod** schema
    (`packages/shared/src/items.ts :: ItemsResponse`), so a drifting API
    fails loudly here, not deep inside a component.
15. `items.queries.ts` caches the items; `tasks.view.tsx` renders; the
    sidebar badges (`components/app/sidebar-nav.tsx`) update from the same
    cache — one fetch feeds every screen.

---

## §2 — An optimistic write: setting a task to "Done"

What it feels like: the row flips to Done _instantly_, History gains the
item, badges update — before the network even finishes.

1. `views/tasks/components/task-row.tsx` — the status dropdown fires
   `usePatchItem().mutate({ id, patch: { status: "Done" } })`.
2. `domain/items/items.queries.ts :: usePatchItem.onMutate` — **before any
   network**: cancels in-flight items fetches, snapshots the cache (the
   undo buffer), and applies `domain/items/items.cache.ts :: applyPatch` —
   a pure mirror of the server's rule: status → Done also stamps
   `completed` with today. Every view re-renders from the changed cache
   immediately. This is the "optimistic" part: apply now, verify after.
3. Meanwhile the real request runs: `items.api.ts :: patchItem` →
   `lib/http.ts` (token attached) → proxy → middleware (hop 7 above) →
   `routes/items.py :: update_item` → `services/items.py` →
   `repositories/postgres/items.py :: update_item`.
4. In the repository: ownership check first — someone else's row returns
   `None`, which the route turns into **404** (not 403: admitting "exists
   but not yours" would leak that the row exists). Then the patch is
   applied, the server stamps `completed` itself (clients are never trusted
   with that), and — the lesson of a real bug — the response is built
   **before** `commit()`, because our RLS identity is `SET LOCAL` and dies
   with the transaction.
5. The updated item comes back; `usePatchItem.onSuccess` writes the
   server's copy into the cache (reconciliation). **No follow-up GET** —
   the response itself is the truth.
6. **Failure branch:** if the server refuses (or is down),
   `usePatchItem.onError` restores the snapshot, refetches once (in case
   the write actually landed before the error — that exact thing happened
   in the bug above), and shows a toast via
   `components/app/toaster.tsx`: "Couldn't save the change — reverted."

Delete and Save-to-Tasks follow the same shape with their own transforms
(`removeItem`, `markAllSaved`); delete additionally refreshes meeting item
counts (`meetingsKey`), and save-to-tasks does one reconciling refetch
because it's a batch write.

---

## §3 — An AI capture: notes → extracted items → database rows

What it feels like: paste notes, click **Extract**, and reviewable items
appear (and survive a refresh).

1. `views/capture/capture.view.tsx` — Extract button calls
   `useActionItems().extractNotes(payload)` on the extraction store.
2. `domain/extraction/extraction.store.ts :: extractNotes` — a zustand
   store, not a component, so the flow keeps running even if you switch
   tabs. Sets `extracting: true`, then:
3. `domain/extraction/extraction.api.ts :: extractActionItems` →
   `lib/http.ts` → `fetch("/ai-api/extract")`. The vite proxy rewrites
   `/ai-api/*` to the **Next.js AI app** on :3000 (a separate service, so
   the Anthropic key never touches the browser or the FastAPI app).
4. `apps/ai/app/api/extract/route.ts :: POST` — validates the body against
   the shared zod `ExtractRequest`, then calls
   `apps/ai/lib/extraction.ts :: extractItems`: a `generateObject` call
   that constrains Claude's output to the shared `ExtractResponse` schema —
   the `.describe()` strings on `ExtractedItem`
   (`packages/shared/src/extraction.ts`) are literally instructions sent to
   the model.
5. Back in the store: the extracted items are normalized (confidence
   clamped to 0–100) and **immediately persisted** —
   `domain/meetings/meetings.api.ts :: createMeeting` → POST
   `/api/meetings` → middleware → `routes/meetings.py` →
   `services/meetings.py` → `repositories/postgres/meetings.py ::
create_meeting`: the meeting row and all its item rows are inserted in
   **one transaction** (all-or-nothing), `user_id` stamped from the
   verified token, never from the request body.
6. The store then invalidates `["items"]` and `["meetings"]` — Review,
   Tasks, History, and the RECENT strip all refetch the fresh truth. The
   capture now exists as rows, so the Review queue survives any refresh.

---

_If a comment in the code disagrees with this map, one of them is wrong —
say so and we'll fix whichever lies._
