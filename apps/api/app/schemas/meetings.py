from pydantic import BaseModel

from .items import ActionItem, Priority

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
