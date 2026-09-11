"""Pydantic meeting schemas — the wire contract, mirrored in packages/shared."""

from datetime import date
from typing import Literal

from pydantic import BaseModel

from .items import ActionItem, Priority


class ExtractedItem(BaseModel):
    """One extractor item — no id yet; '' means none (NULL in the repository)."""

    title: str
    owner: str
    priority: Priority
    # "YYYY-MM-DD" parses to a date; "" means none; garbage 422s here.
    due: date | Literal[""]
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


class MeetingDetail(BaseModel):
    """GET /api/meetings/{id} — one full capture: transcript plus its items."""

    id: int
    title: str
    rawNotes: str
    capturedAt: str
    itemCount: int
    items: list[ActionItem]


class MeetingsPage(BaseModel):
    """GET /api/meetings — one keyset page, newest first; None cursor = no more."""

    meetings: list[Meeting]
    nextCursor: str | None
