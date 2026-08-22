"""Meeting routes — capture a meeting with its AI-extracted items, and
browse past captures. Called by the browser via the /api proxy;
delegates to services/meetings.py → whichever MeetingRepository is
configured.
Path: browser → [this file] → services/meetings.py → repositories/ →
schemas/meetings.py. See request-paths.md §3 (an AI capture, end to end).
"""

from fastapi import APIRouter, Depends, HTTPException

from app.api.deps import current_user_id, get_repositories
from app.repositories.protocols import Repositories
from app.schemas import (
    CreateMeetingRequest,
    CreateMeetingResponse,
    MeetingDetail,
    MeetingsResponse,
)
from app.services import meetings as meetings_service

router = APIRouter()


@router.post(
    "/api/meetings", status_code=201, response_model=CreateMeetingResponse
)
def create_meeting(
    request: CreateMeetingRequest,
    user_id: int = Depends(current_user_id),
    repos: Repositories = Depends(get_repositories),
) -> CreateMeetingResponse:
    """POST /api/meetings: persist a captured meeting plus its
    AI-extracted action items in one call."""
    return meetings_service.create_meeting(repos.meetings, user_id, request)


@router.get("/api/meetings", response_model=MeetingsResponse)
def list_meetings(
    limit: int = 3,
    user_id: int = Depends(current_user_id),
    repos: Repositories = Depends(get_repositories),
) -> MeetingsResponse:
    """GET /api/meetings: the caller's most recent captures, newest
    first (default 3)."""
    return MeetingsResponse(
        meetings=meetings_service.list_meetings(repos.meetings, user_id, limit)
    )


@router.get("/api/meetings/{meeting_id}", response_model=MeetingDetail)
def get_meeting(
    meeting_id: int,
    user_id: int = Depends(current_user_id),
    repos: Repositories = Depends(get_repositories),
) -> MeetingDetail:
    """GET /api/meetings/{id}: one full capture, transcript included.
    404s, never 403s, when it isn't the caller's — same non-leak rule."""
    meeting = meetings_service.get_meeting(repos.meetings, user_id, meeting_id)
    if meeting is None:
        raise HTTPException(status_code=404, detail="Meeting not found")
    return meeting
