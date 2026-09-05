# Infinite scroll — keyset pagination design

**Date:** 2026-09-03 · **Approach:** B (keyset/cursor) · **Screens:** Tasks, History, Meetings

## Goal

Replace "fetch every row once" with production-grade server-side pagination:
the API returns pages addressed by an opaque cursor; the web app loads pages
as the user scrolls. Review and the sidebar stay correct without fetching the
world.

## Why keyset (not offset)

Offset pages drift when rows are inserted/edited between fetches (duplicates
or skips — and these lists mutate constantly), and Postgres pays for every
skipped row. A keyset cursor pins the next page to the last row actually
seen: `WHERE (sort_key, id) > (cursor.sort_key, cursor.id)`. Stable under
writes, O(page) with a matching index.

## API contract (additive — bare `GET /api/items` unchanged)

| Endpoint                      | Params                               | Sort                         | Returns                                                  |
| ----------------------------- | ------------------------------------ | ---------------------------- | -------------------------------------------------------- |
| `GET /api/items?view=tasks`   | `owner status priority cursor limit` | `due ASC NULLS LAST, id ASC` | `{items, nextCursor}`                                    |
| `GET /api/items?view=history` | `owner cursor limit`                 | `completed DESC, id DESC`    | `{items, nextCursor}`                                    |
| `GET /api/items?view=review`  | —                                    | insertion order              | `{items, nextCursor: null}` (unpaginated; bounded queue) |
| `GET /api/items` (bare)       | —                                    | legacy                       | unchanged full list (back-compat; Postman untouched)     |
| `GET /api/items/summary`      | —                                    | —                            | `{done, open, review, total}` counts                     |
| `GET /api/items/{id}`         | —                                    | —                            | one item or 404 (modal's source of truth)                |
| `GET /api/meetings`           | `limit` + new `cursor`               | `captured_at DESC, id DESC`  | `{meetings, nextCursor}`                                 |

- `nextCursor` = base64url(JSON of the last row's sort key + id); `null` = no
  more pages. Invalid cursor → 422. Default `limit` 20 (cap 100).
- Tasks' cursor carries a null-flag: dated rows page through
  `(due, id) >` then fall into the `due IS NULL` tail paged by `id`.
- Filters are server-side query params now — a filter change is a new query,
  not a client-side array pass.

## Data layer (web)

- One shared items cache splits into purpose-shaped queries:
  `useTasksInfinite(filters)` / `useHistoryInfinite(owner)` /
  `useMeetingsInfinite()` (useInfiniteQuery, filters inside the query key),
  `useReviewQuery` (view=review), `useSummaryQuery` (sidebar), and
  `useItemQuery(id)` (modal).
- Rows rendered = `pages.flatMap(p => p.items)`. History's week grouping and
  Tasks' status sections stay client-side — they're presentation, not
  pagination.
- Load trigger: an IntersectionObserver sentinel `<LoadMoreSentinel>` at the
  bottom of `ScrollRegion` calls `fetchNextPage()` when visible (event-driven,
  no timers, no scroll math).
- Mutations (`usePatchItem` etc.): optimistic writes stay where speed is felt
  (Review's array cache, the modal's detail cache); paginated lists and the
  summary are invalidated on settle instead of surgically patched — pages
  re-fetch cheap and stay consistent.

## DB

Migration adds covering indexes for the two keysets:
`action_items(user_id, due, id)` and `meetings(user_id, captured_at, id)`.

## Testing

- pytest unit: cursor codec round-trip/tamper, view filtering + page walk on
  the memory repo.
- pytest integration: real-Postgres page walks including the dated→undated
  boundary, mid-scroll mutation stability, cross-user isolation.
- Postman: new "pagination" folder walking view=tasks with limit=2 plus
  summary/detail requests; existing folders untouched.
- Web: utils tests follow the slimmer `taskRows` (VM mapping only — filtering
  and sorting moved server-side).

## Out of scope

Virtualized rendering; paginating Review; deleting the legacy bare list
endpoint (deprecate once nothing calls it).
