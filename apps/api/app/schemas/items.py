"""Pydantic item schemas — the wire contract, mirrored in packages/shared."""

from datetime import date
from typing import Literal

from pydantic import BaseModel

Priority = Literal["High", "Medium", "Low"]
Status = Literal["Not started", "In progress", "Blocked", "Done"]


class ActionItem(BaseModel):
    """One persisted item — full wire shape; all fields required, some nullable."""

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
    """Partial update for PATCH /api/items/{id}; `completed` is server-stamped."""

    title: str | None = None
    owner: str | None = None
    # Pydantic parses the wire's "YYYY-MM-DD"; garbage 422s at the border.
    due: date | None = None
    priority: Priority | None = None
    status: Status | None = None
    saved: bool | None = None
    note: str | None = None
    # Client's local day for the Done stamp; clamped to ±1 day of UTC today.
    completedOn: str | None = None


class ItemsBulkPatch(BaseModel):
    """PATCH /api/items body; Literal[True] because promote is the only bulk move."""

    saved: Literal[True]


class BulkUpdateResponse(BaseModel):
    """PATCH /api/items — how many rows the bulk patch changed."""

    updated: int


class ItemsPage(BaseModel):
    """One keyset page; opaque nextCursor, None = no more pages."""

    items: list[ActionItem]
    nextCursor: str | None


class ItemSummary(BaseModel):
    """Summary counts; onTime = Done on/before due (undated counts as on time)."""

    done: int
    open: int
    review: int
    total: int
    onTime: int
    meetings: int
