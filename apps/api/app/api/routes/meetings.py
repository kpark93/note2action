"""Meeting routes — capture a meeting with AI-extracted items, browse past
captures. Next hop: services/meetings.py → repositories/."""

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
    """POST /api/meetings: delegates to services/meetings.py
    create_meeting (meeting + extracted items, one call)."""
    return meetings_service.create_meeting(repos.meetings, user_id, request)


@router.get("/api/meetings", response_model=MeetingsResponse)
def list_meetings(
    limit: int = 3,
    user_id: int = Depends(current_user_id),
    repos: Repositories = Depends(get_repositories),
) -> MeetingsResponse:
    """GET /api/meetings: delegates to services/meetings.py
    list_meetings; newest first (default 3)."""
    return MeetingsResponse(
        meetings=meetings_service.list_meetings(repos.meetings, user_id, limit)
    )


@router.get("/api/meetings/{meeting_id}", response_model=MeetingDetail)
def get_meeting(
    meeting_id: int,
    user_id: int = Depends(current_user_id),
    repos: Repositories = Depends(get_repositories),
) -> MeetingDetail:
    """GET /api/meetings/{id}: delegates to services/meetings.py;
    404s not 403s when not the caller's — no leak."""
    meeting = meetings_service.get_meeting(repos.meetings, user_id, meeting_id)
    if meeting is None:
        raise HTTPException(status_code=404, detail="Meeting not found")
    return meeting
