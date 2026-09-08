"""Pydantic schemas for items — the wire contract, mirrored in packages/shared.
Path §1 [hop 13/15]: mappers → here → FastAPI JSON → lib/http.ts."""

from typing import Literal

from pydantic import BaseModel

Priority = Literal["High", "Medium", "Low"]
Status = Literal["Not started", "In progress", "Blocked", "Done"]


class ActionItem(BaseModel):
    """One persisted action item — full wire shape, mirrored in
    packages/shared. All fields required; some are nullable (`| None`)."""

    id: int
    meetingId: int
    # Title of the meeting the item came from — joined in by the API for display.
    meeting: str
    title: str
    owner: str
    due: str | None
    priority: Priority
    saved: bool
    note: str | None
    status: Status
    completed: str | None


class ActionItemPatch(BaseModel):
    """Partial update for PATCH /api/items/{id}. `completed` is absent
    — the server stamps it from `status` (Done ⟺ completed set)."""

    title: str | None = None
    owner: str | None = None
    due: str | None = None
    priority: Priority | None = None
    status: Status | None = None
    saved: bool | None = None
    note: str | None = None
    # The client's local "YYYY-MM-DD" on a flip to Done — advisory input to
    # the `completed` stamp, clamped to ±1 day of UTC today (no backdating).
    completedOn: str | None = None


class ItemsBulkPatch(BaseModel):
    """PATCH /api/items body. Literal[True]: promoting the review queue is
    the only bulk transition — widen the type when a second one exists."""

    saved: Literal[True]


class BulkUpdateResponse(BaseModel):
    """PATCH /api/items — how many rows the bulk patch changed."""

    updated: int


class ItemsPage(BaseModel):
    """One keyset page — mirrors packages/shared ItemsPage. nextCursor is
    opaque base64 (core/cursor.py); None = no more pages."""

    items: list[ActionItem]
    nextCursor: str | None


class ItemSummary(BaseModel):
    """GET /api/items/summary — sidebar + History-stat counts, mirrors
    packages/shared. onTime: Done items closed on/before due (undated = on
    time); meetings: how many captures the caller owns."""

    done: int
    open: int
    review: int
    total: int
    onTime: int
    meetings: int
