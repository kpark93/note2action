"""Pydantic schemas — the wire contract, mirrored in packages/shared (TS)."""

from pydantic import BaseModel
from typing import Literal

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
    items: list[ActionItem]
