"""Pydantic schemas — the wire contract, mirrored in packages/shared (TS).

Built by repositories/mappers.py and the repositories themselves;
returned by api/routes/items.py as response_model, so FastAPI uses
these to serialize the JSON the browser receives.
Path §1 [hop 13/15]: mappers (hop 12) → [this file] → FastAPI serializes
JSON (hop 8's response_model) → back through the proxy to lib/http.ts
(hop 14), then the cache and your screen (hop 15).
"""

from typing import Literal

from pydantic import BaseModel

Priority = Literal["High", "Medium", "Low"]
Status = Literal["Not started", "In progress", "Blocked", "Done"]


class ActionItem(BaseModel):
    """One persisted action item — the full wire shape, mirrored in packages/shared.

    Every field is required. `due`/`note`/`completed` are nullable (`| None`)
    but must still be present: "nullable" and "optional" are different promises.
    """

    id: int
    meetingId: int
    # Title of the meeting the item came from — joined in by the API for display.
    meeting: str
    title: str
    owner: str
    due: str | None
    priority: Priority
    confidence: int
    saved: bool
    note: str | None
    status: Status
    completed: str | None


class ActionItemPatch(BaseModel):
    """Partial update for PATCH /api/items/{id} — only the fields being changed.

    `completed` is deliberately absent: the server stamps it from `status`
    (Done ⟺ completed set), so clients can never break that rule.
    """

    title: str | None = None
    owner: str | None = None
    due: str | None = None
    priority: Priority | None = None
    confidence: int | None = None
    status: Status | None = None
    saved: bool | None = None
    note: str | None = None


class SaveToTasksResponse(BaseModel):
    """POST /api/items/save-to-tasks — how many pending items were saved."""

    updated: int


class ItemsResponse(BaseModel):
    """GET /api/items — every action item the caller owns."""

    items: list[ActionItem]
