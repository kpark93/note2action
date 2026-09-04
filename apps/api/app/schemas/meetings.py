"""Pydantic schemas for meetings — the wire contract, mirrored in
packages/shared (TS). Next hop: api/routes/meetings.py → JSON response."""

from pydantic import BaseModel

from .items import ActionItem, Priority


class ExtractedItem(BaseModel):
    """One item as the AI extractor produces it — no id yet; '' means
    'none' (translated to NULL in the repository)."""

    title: str
    owner: str
    priority: Priority
    due: str
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
    """GET /api/meetings/{id} — one full capture: transcript plus the
    items extracted from it (the modal's status pills)."""

    id: int
    title: str
    rawNotes: str
    capturedAt: str
    itemCount: int
    items: list[ActionItem]


class MeetingsPage(BaseModel):
    """GET /api/meetings — one keyset page, newest first; mirrors
    packages/shared MeetingsPage. nextCursor None = no more pages."""

    meetings: list[Meeting]
    nextCursor: str | None
