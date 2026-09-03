"""Meeting use-cases — the atomic meeting+items write lives behind create.
Next hop: the MeetingRepository protocol (repositories/)."""

from datetime import datetime

from app.core.cursor import CursorError, decode_cursor, encode_cursor
from app.repositories.protocols import MeetingRepository
from app.schemas.meetings import (
    CreateMeetingRequest,
    CreateMeetingResponse,
    MeetingDetail,
    MeetingsPage,
)


def create_meeting(
    meetings: MeetingRepository, user_id: int, request: CreateMeetingRequest
) -> CreateMeetingResponse:
    """Calls MeetingRepository.create_meeting (meeting + items,
    one unit)."""
    return meetings.create_meeting(user_id, request)


def list_meetings_page(
    meetings: MeetingRepository,
    user_id: int,
    cursor_raw: str | None,
    limit: int,
) -> MeetingsPage:
    """One keyset page, newest first. Cursor shape: {"t": ISO ts, "i": id}."""
    cursor = None
    if cursor_raw:
        payload = decode_cursor(cursor_raw)
        t, i = payload.get("t"), payload.get("i")
        if not isinstance(i, int) or not isinstance(t, str):
            raise CursorError("bad meetings cursor shape")
        try:
            datetime.fromisoformat(t)
        except ValueError as exc:
            raise CursorError("bad cursor timestamp") from exc
        cursor = {"t": t, "i": i}
    page, nxt = meetings.list_meetings_page(user_id, cursor, limit)
    return MeetingsPage(
        meetings=page, nextCursor=encode_cursor(nxt) if nxt else None
    )


def get_meeting(
    meetings: MeetingRepository, user_id: int, meeting_id: int
) -> MeetingDetail | None:
    """Calls MeetingRepository.get_meeting; None if missing/not
    theirs (route → 404)."""
    return meetings.get_meeting(user_id, meeting_id)
