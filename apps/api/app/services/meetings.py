"""Meeting use-cases. The atomic meeting+items write lives behind create.

Called by app/api/routes/meetings.py; calls the MeetingRepository
protocol (app/repositories/).
Path: route (api/routes/meetings.py) → [this file] → MeetingRepository
(repositories/).
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
    """Persist a captured meeting and its extracted items as one unit."""
    return meetings.create_meeting(user_id, request)


def list_meetings(
    meetings: MeetingRepository, user_id: int, limit: int
) -> list[Meeting]:
    """The user's most recent meetings, newest first, capped at limit."""
    return meetings.list_meetings(user_id, limit)


def get_meeting(
    meetings: MeetingRepository, user_id: int, meeting_id: int
) -> MeetingDetail | None:
    """One full meeting; None if missing or not theirs (route → 404)."""
    return meetings.get_meeting(user_id, meeting_id)
