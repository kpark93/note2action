"""Meeting use-cases. The atomic meeting+items write lives behind create."""

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
    return meetings.create_meeting(user_id, request)


def list_meetings(meetings: MeetingRepository, user_id: int, limit: int) -> list[Meeting]:
    return meetings.list_meetings(user_id, limit)


def get_meeting(
    meetings: MeetingRepository, user_id: int, meeting_id: int
) -> MeetingDetail | None:
    return meetings.get_meeting(user_id, meeting_id)
