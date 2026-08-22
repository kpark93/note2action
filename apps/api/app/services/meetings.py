"""Meeting use-cases. The atomic meeting+items write lives behind create.
Calls the MeetingRepository protocol (app/repositories/).
Path: routes/meetings.py → [this file] → MeetingRepository
(repositories/postgres/meetings.py).
"""

from app.repositories.protocols import MeetingRepository
from app.schemas.meetings import (
    CreateMeetingRequest,
    CreateMeetingResponse,
    Meeting,
    MeetingDetail,
)


def create_meeting(
    meetings: MeetingRepository, user_id: int, request: CreateMeetingRequest
) -> CreateMeetingResponse:
    """Calls MeetingRepository.create_meeting (meeting + items,
    one unit)."""
    return meetings.create_meeting(user_id, request)


def list_meetings(
    meetings: MeetingRepository, user_id: int, limit: int
) -> list[Meeting]:
    """Calls MeetingRepository.list_meetings; newest first, capped."""
    return meetings.list_meetings(user_id, limit)


def get_meeting(
    meetings: MeetingRepository, user_id: int, meeting_id: int
) -> MeetingDetail | None:
    """Calls MeetingRepository.get_meeting; None if missing/not
    theirs (route → 404)."""
    return meetings.get_meeting(user_id, meeting_id)
