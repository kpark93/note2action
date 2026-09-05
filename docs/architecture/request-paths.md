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
2. `views/tasks/tasks.view.tsx :: TasksView` — calls
   `useTasksInfinite(owner, status, priority)`. The filters live in the
   cache key, so each combination is its own paged walk. **If that walk's
   pages are already cached** and fresh (younger than `staleTime`, 60s —
   set in `lib/query-client.ts`), the table renders with no fetch and the
   rest of this journey doesn't run.
3. `domain/items/items.queries.ts :: useTasksInfinite` — a TanStack
   `useInfiniteQuery` under the key `["items", "tasks", owner, status,
priority]`; each page's `nextCursor` is the `pageParam` for the next.
4. `domain/items/items.api.ts :: fetchTasksPage` — builds
   `/api/items?view=tasks` plus the filter params and cursor.
5. `lib/http.ts :: request` — asks `lib/auth-token.ts` for a fresh Clerk
   session JWT (a signed token proving who you are) and attaches it as
   `Authorization: Bearer …`, then `fetch(...)`.
6. **Vite dev proxy** (`apps/web/vite.config.ts`) — forwards `/api/*` from
   :5173 to the FastAPI server on :8001. (No CORS needed — the browser
   thinks it's talking to one origin.)
7. `apps/api/app/core/middleware.py :: require_verified_user` — the API's
   front door. Verifies the JWT's signature against Clerk's JWKS (published
   public keys, fetched by `core/security.py :: ClerkJWKSVerifier`). Bad or
   missing token → 401 right here; the route never runs. On success the
   verified identity rides on `request.state.identity`.
8. `apps/api/app/api/routes/items.py :: list_items` — the route. `view` is
   **required** (there is no unpaginated dump of the table). Its
   `Depends(current_user_id)` runs first:
9. `apps/api/app/api/deps.py :: current_user_id` — turns the verified Clerk
   id into our `users.id` via `services/users.py :: resolve_user_id` →
   `repositories/postgres/users.py :: get_or_create_user` (first visit
   creates the row; the token's name claim keeps the name fresh).
10. `apps/api/app/services/items.py :: list_page` — decodes the opaque
    cursor (`core/cursor.py`); a cursor we didn't mint raises `CursorError`,
    which the route turns into a 422.
11. `apps/api/app/repositories/postgres/items.py :: list_tasks_page` — opens
    `postgres/session.py :: rls_session(user_id)` (`SET LOCAL app.user_id`),
    then one keyset query: filters, `ORDER BY due ASC NULLS LAST, id ASC`,
    `LIMIT n+1` — the extra row's existence is what proves a next page. The
    WHERE filters by `user_id` **and** Postgres RLS filters again
    independently: two locks, one door.
12. `apps/api/app/repositories/mappers.py :: to_wire` — each row is
    translated from database shape (snake_case, real dates) into the wire
    shape (camelCase, ISO strings, meeting title joined in, `user_id`
    deliberately omitted).
13. `apps/api/app/schemas/items.py :: ItemsPage` — FastAPI serializes the
    page (`items` + `nextCursor`) to JSON. Response travels back through
    the proxy.
14. `lib/http.ts` again — the response is parsed with the **zod** schema
    (`packages/shared/src/items.ts :: ItemsPage`), so a drifting API fails
    loudly here, not deep inside a component.
15. `items.queries.ts` caches the page; `tasks.view.tsx` renders it; when
    the `components/app/load-more-sentinel.tsx` row scrolls into view, the
    view calls `fetchNextPage()` and hops 4–14 repeat with the cursor. The
    sidebar badges live on their own tiny query (`useSummaryQuery` →
    `GET /api/items/summary` — counts in SQL, no rows).

---

## §2 — An optimistic write: setting a task to "Done"

What it feels like: the row flips to Done _instantly_, History gains the
item, badges update — before the network even finishes.

1. `views/tasks/components/task-row.tsx` — the status dropdown fires
   `usePatchItem().mutate({ id, patch: { status: "Done" } })`.
2. `domain/items/items.queries.ts :: usePatchItem.onMutate` — **before any
   network**: cancels in-flight items fetches, snapshots the Review cache
   (the undo buffer), then applies `domain/items/items.cache.ts ::
applyPatch` in three places — the Review list, the item's detail entry,
   and in place across every cached tasks/history page (`patchPages`). All
   mirror the server's rule: status → Done also stamps `completed` with
   today. Every view re-renders from the changed caches immediately. This
   is the "optimistic" part: apply now, verify after.
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
   server's copy into the detail cache (reconciliation — the response
   itself is the truth for that entry). Then `onSettled` invalidates only
   what the client couldn't make true itself (`items.cache.ts ::
keptOnSettle` decides): the reconciled detail and delta'd summary are
   kept, and a status-only change between non-Done states keeps every walk
   whose membership can't have moved — only status-_filtered_ tasks caches
   refetch. Anything touching Done (either direction), or any other field,
   settles the pages fully: membership and order are the server's call.
   Meetings-wise, only `["meetings", "detail"]` invalidates — a patch
   can't change `itemCount`, so lists stay untouched.
6. **Failure branch:** if the server refuses (or is down),
   `usePatchItem.onError` restores the snapshot and toasts ("Couldn't save
   the change — reverted."); the settle-time invalidation then refetches —
   in case the write actually landed before the error, the database gets
   the last word (that exact thing happened in the bug above).

Delete and Save-to-Tasks follow the same shape with their own transforms
(`removeItem`, `markAllSaved`). Their settle scopes differ on purpose:
delete invalidates **all** meetings shapes (`itemCount`s changed);
save-to-tasks, like patch, touches only meeting details (a `saved` flag
changes item state, not counts).

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
5. Back in the store: the extracted items are **immediately persisted** —
   `domain/meetings/meetings.api.ts :: createMeeting` → POST
   `/api/meetings` → middleware → `routes/meetings.py` →
   `services/meetings.py` → `repositories/postgres/meetings.py ::
create_meeting`: the meeting row and all its item rows are inserted in
   **one transaction** (all-or-nothing), `user_id` stamped from the
   verified token, never from the request body.
6. The store then invalidates `["items"]` (awaited — Review renders these
   rows next) and `["meetings"]` (fire-and-forget — the RECENT strip
   refreshes without holding up the navigation). The capture now exists as
   rows, so the Review queue survives any refresh.

---

_If a comment in the code disagrees with this map, one of them is wrong —
say so and we'll fix whichever lies._
