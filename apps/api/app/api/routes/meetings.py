"""Meeting routes — capture a meeting with AI-extracted items, browse past
captures. Next hop: services/meetings.py → repositories/."""

from fastapi import APIRouter, Depends, HTTPException, Query

from app.api.deps import current_user_id, get_repositories
from app.core.cursor import CursorError
from app.repositories.protocols import Repositories
from app.schemas import (
    CreateMeetingRequest,
    CreateMeetingResponse,
    MeetingDetail,
    MeetingsPage,
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


@router.get("/api/meetings", response_model=MeetingsPage)
def list_meetings(
    limit: int = Query(default=3, ge=1, le=100),
    cursor: str | None = None,
    user_id: int = Depends(current_user_id),
    repos: Repositories = Depends(get_repositories),
) -> MeetingsPage:
    """GET /api/meetings: one keyset page, newest first (default 3 — the
    RECENT strip's size). nextCursor rides along; legacy callers ignore it."""
    try:
        return meetings_service.list_meetings_page(
            repos.meetings, user_id, cursor, limit
        )
    except CursorError as exc:
        raise HTTPException(status_code=422, detail="Invalid cursor") from exc


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
