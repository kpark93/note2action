# API Design — note2action

Module 8 deliverable. The contract, designed before the handlers exist.
Companion to `docs/database-schema.md` — every endpoint here reads or writes
the tables defined there. Implemented across Modules 9–10.

## Conventions

- **Two backends, one browser.** The web app talks to the FastAPI service
  through the Vite `/api/*` proxy, and to the AI (Next.js) service through
  the `/ai-api/*` proxy. Action-item _persistence_ is FastAPI's job;
  _extraction_ is the AI app's job. They never call each other — the browser
  orchestrates.
- JSON everywhere. Dates are `YYYY-MM-DD` strings; timestamps are ISO-8601.
- The frontend's `""` for "no date" becomes `NULL` in the database — the API
  layer translates at the boundary, both directions.
- Errors use FastAPI's shape: `{"detail": ...}`. `422` = body failed
  validation (wrong enum value, malformed date); `404` = no such row.
- **Auth (Module 12):** every `/api/*` endpoint below will require
  `Authorization: Bearer <token>` and answer `401` without it. Until then,
  all data implicitly belongs to the single seeded user.

## Existing endpoints (implemented today)

### GET /api/health

**What:** liveness check; feeds the sidebar health dot.
**Response:** `HealthResponse` — `{status, service, time}`.
**Errors:** none (if it errors, that _is_ the signal).

### GET /api/items _(stub — to be replaced, see below)_

Currently returns placeholder `Item {id, title, done}` objects from the
in-memory repository. The shape predates the real schema; Module 10 replaces
it with the full action-item contract.

### POST /api/extract _(AI app, reached via the `/ai-api` proxy)_

**What:** turns raw notes into structured action items. No persistence —
pure transformation.
**Request:** `ExtractRequest` — `{notes, meetingTitle, today, owners[]}`.
**Response:** `ExtractResponse` — `{items: ExtractedItem[]}` where each item
is `{title, owner, priority, due, confidence, note}`.
**Errors:** `500` when the model call fails (no key, service down).

## Target endpoints (Modules 9–10)

### POST /api/meetings

**What:** persist a capture — one meeting plus its extracted items, in one
transaction. Called right after extraction succeeds; this is the moment data
becomes durable.
**Request:** `{title, rawNotes, items: ExtractedItem[]}`.
**Response:** `201` with the created meeting `{id, title, capturedAt}` and
its items (full action-item shape, ids assigned, `status "Not started"`,
`saved false`, `completed null`).
**Errors:** `422` invalid body.
**Decision — persist at extraction, not at Save-to-Tasks.** The schema's
`saved` boolean encodes the Review→Tasks workflow, which only works if
Review items are already rows (`saved=false`). Bonus: the Review queue
survives a refresh — the exact bug Module 10 exists to fix.

### GET /api/meetings

**What:** recent captures, newest first — serves the RECENT strip on
Capture. `?limit=` (default 3).
**Response:** `{meetings: [{id, title, capturedAt, itemCount}]}` —
`itemCount` is derived (`COUNT` of the meeting's items), never stored.
**Errors:** none.

### GET /api/meetings/{id}

**What:** one full capture, including the transcript — serves the
recent-capture modal and "Load into capture".
**Response:** `{id, title, rawNotes, capturedAt, itemCount}`.
**Errors:** `404`.

### GET /api/items

**What:** all action items for the user — Review, Tasks, History, and the
Home counts are all client-side slices of this one list.
**Response:** `{items: [...]}` — full shape: `{id, meetingId, meeting, title,
owner, due, priority, confidence, status, saved, note, completed}`.
**Errors:** none.
**Decision — `meeting` (the title) rides along on every item.** The Review
cards display the meeting name; making the API join it in (one query,
server-side) beats every client fetching and cross-referencing the meetings
list just to label cards.
**Decision — no server-side filters yet.** The UI's owner/status filters
stay client-side: the dataset is one user's items, small enough that a
second round-trip per dropdown change buys nothing. Add query params only
when data outgrows this.

### PATCH /api/items/{id}

**What:** edit one or more fields of one item. One endpoint covers five UI
actions: Review inline edits, Confirm (`confidence: 100`), the Tasks status
dropdown, Send-back-to-Review (`saved: false`), and History's Reopen
(`status: "In progress"`).
**Request:** partial item — any of `title, owner, due, priority,
confidence, status, saved`. **`completed` is not accepted**: the server
sets it to today when status transitions to `Done` and clears it when
status leaves `Done`. The client's clock is not a source of truth.
**Response:** the full updated item.
**Errors:** `404` · `422`.

### POST /api/items/save-to-tasks

**What:** the "Save N to Tasks" button — set `saved=true` on every pending
item (`saved=false`, status ≠ `Done`).
**Request:** empty body.
**Response:** `{updated: <count>}`.
**Errors:** none (zero pending items is a valid no-op, `{updated: 0}`).
**Decision — one batch endpoint, not N PATCHes.** The button's meaning is
atomic ("save the whole batch"); N requests would mean N chances for a
partial failure the UI has no way to display.

### DELETE /api/items/{id}

**What:** Discard on the Review screen. A real delete — the row is gone,
matching today's UI behavior.
**Response:** `204`, no body.
**Errors:** `404`.

## Deliberately NOT endpoints

Typing/pasting notes, Paste-sample, filters, the low-confidence toggle,
navigation, theme toggle, word counts — all client-only state or derived
display. No server round-trip earns its keep for any of them.

## UI action → endpoint trace (the Module 8 checkpoint map)

| UI action                       | Endpoint                                           |
| ------------------------------- | -------------------------------------------------- |
| Extract action items            | `POST /api/extract` (AI) then `POST /api/meetings` |
| Recent strip / transcript modal | `GET /api/meetings`, `GET /api/meetings/{id}`      |
| Any screen loads its items      | `GET /api/items`                                   |
| Edit title/owner/due/priority   | `PATCH /api/items/{id}`                            |
| Confirm                         | `PATCH /api/items/{id}` `{confidence: 100}`        |
| Discard                         | `DELETE /api/items/{id}`                           |
| Save N to Tasks                 | `POST /api/items/save-to-tasks`                    |
| Status dropdown (incl. Done)    | `PATCH /api/items/{id}` `{status: ...}`            |
| Send back to Review             | `PATCH /api/items/{id}` `{saved: false}`           |
| Reopen from History             | `PATCH /api/items/{id}` `{status: "In progress"}`  |

## Schema gaps (Module 10 work in `packages/shared`)

| Gap                                                     | Fix                                                                           |
| ------------------------------------------------------- | ----------------------------------------------------------------------------- |
| `Item {id, title, done}` is a placeholder               | Replace with a full `ActionItem` schema mirroring the DB row                  |
| No `Meeting` schema                                     | Add one (`{id, title, capturedAt, itemCount}` + full variant with `rawNotes`) |
| No patch/request schemas                                | Add `ActionItemPatch`, `CreateMeetingRequest`                                 |
| Frontend `id` is `number`, shared `Item.id` is `string` | Standardize on `number` to match `IDENTITY` columns                           |
