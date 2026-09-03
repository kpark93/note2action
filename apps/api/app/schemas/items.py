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


class SaveToTasksResponse(BaseModel):
    """POST /api/items/save-to-tasks — how many pending items were saved."""

    updated: int


class ItemsResponse(BaseModel):
    """GET /api/items — every action item the caller owns."""

    items: list[ActionItem]
