"""Pydantic schemas — the wire contract, mirrored in packages/shared (TS)."""

from __future__ import annotations

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


class ExtractedItem(BaseModel):
    """One item as the AI extractor produces it — no id yet; '' means 'none'.

    Mirrors `ExtractedItem` in packages/shared. The '' → NULL translation
    for `due`/`note` happens in the repository, at the database border.
    """

    title: str
    owner: str
    priority: Priority
    due: str
    confidence: int
    note: str


class Meeting(BaseModel):
    """One captured meeting — mirrors packages/shared. itemCount is derived."""

    id: int
    title: str
    capturedAt: str
    itemCount: int


class CreateMeetingRequest(BaseModel):
    """POST /api/meetings body: persist a capture and its extracted items."""

    title: str
    rawNotes: str
    items: list[ExtractedItem]


class CreateMeetingResponse(BaseModel):
    """POST /api/meetings response: the created meeting and its items."""

    meeting: Meeting
    items: list[ActionItem]


class MeetingsResponse(BaseModel):
    """GET /api/meetings — recent captures, newest first."""

    meetings: list[Meeting]


class MeetingDetail(BaseModel):
    """GET /api/meetings/{id} — one full capture, transcript included."""

    id: int
    title: str
    rawNotes: str
    capturedAt: str
    itemCount: int


class SaveToTasksResponse(BaseModel):
    """POST /api/items/save-to-tasks — how many pending items were saved."""

    updated: int


class HealthResponse(BaseModel):
    status: str
    service: str
    time: str


class ItemsResponse(BaseModel):
    items: list[ActionItem]


