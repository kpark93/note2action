"""FastAPI application: auth middleware, a health check, and the resource endpoints."""

from __future__ import annotations

from datetime import datetime, timezone

from fastapi import Depends, FastAPI, HTTPException, Request
from fastapi.responses import JSONResponse
from jwt.exceptions import PyJWTError

from .core.security import ClerkJWKSVerifier, TokenVerifier
from .schemas import (
    ActionItem,
    ActionItemPatch,
    CreateMeetingRequest,
    CreateMeetingResponse,
    HealthResponse,
    ItemsResponse,
    MeetingDetail,
    MeetingsResponse,
    SaveToTasksResponse,
)
from .repositories.memory import build_memory_repositories
from .repositories.postgres import build_postgres_repositories
from .repositories.protocols import Repositories
from .core.config import settings

app = FastAPI(title="note2action API")

# Swap happens here and nowhere else — see app/repositories/.
repositories: Repositories = (
    build_postgres_repositories()
    if settings.repository == "postgres"
    else build_memory_repositories()
)

# The verifier lives on app.state (not a global) so tests can swap in a fake,
# mirroring the repository seam. None = CLERK_JWKS_URL missing → loud 500s.
app.state.token_verifier = (
    ClerkJWKSVerifier(settings.clerk_jwks_url) if settings.clerk_jwks_url else None
)

# The deliberately public surface — everything else demands a verified token.
PUBLIC_PATHS = {"/api/health", "/docs", "/openapi.json"}


@app.middleware("http")
async def require_verified_user(request: Request, call_next):
    """Verify the caller on every request, before any endpoint runs.

    Middleware is auth's classic home: one central checkpoint instead of a
    check (that someone will eventually forget) in every handler. On success
    the verified Clerk user id rides along on request.state for handlers.
    """
    if request.url.path in PUBLIC_PATHS:
        return await call_next(request)

    # "Authorization: Bearer <token>" → ("Bearer", " ", "<token>").
    scheme, _, token = request.headers.get("Authorization", "").partition(" ")
    if scheme.lower() != "bearer" or not token:
        return JSONResponse(
            {"detail": "Not authenticated"},
            status_code=401,
            headers={"WWW-Authenticate": "Bearer"},
        )

    verifier: TokenVerifier | None = request.app.state.token_verifier
    if verifier is None:
        return JSONResponse(
            {"detail": "Auth is not configured — set CLERK_JWKS_URL in apps/api/.env"},
            status_code=500,
        )

    try:
        request.state.identity = verifier.verify(token)
    except PyJWTError:
        # Forged, expired, or malformed — 401 "who are you?", never details
        # an attacker could learn from.
        return JSONResponse(
            {"detail": "Invalid or expired token"},
            status_code=401,
            headers={"WWW-Authenticate": "Bearer"},
        )

    return await call_next(request)


def current_user_id(request: Request) -> int:
    """Route dependency: the verified caller's users.id (created on first visit).

    The identity comes from request.state — stamped by the middleware from a
    *verified* token — never from anything the client typed into a body.
    """
    identity = request.state.identity
    return repositories.users.get_or_create_user(identity.clerk_id, identity.name)


@app.get("/api/health", response_model=HealthResponse)
def health() -> HealthResponse:
    return HealthResponse(
        status="ok",
        service="note2action-api",
        time=datetime.now(timezone.utc).isoformat(),
    )


@app.get("/api/items", response_model=ItemsResponse)
def list_items(user_id: int = Depends(current_user_id)) -> ItemsResponse:
    return ItemsResponse(items=repositories.items.list_items(user_id))


@app.patch("/api/items/{item_id}", response_model=ActionItem)
def update_item(
    item_id: int, patch: ActionItemPatch, user_id: int = Depends(current_user_id)
) -> ActionItem:
    item = repositories.items.update_item(user_id, item_id, patch)
    if item is None:
        raise HTTPException(status_code=404, detail="Item not found")
    return item


@app.delete("/api/items/{item_id}", status_code=204)
def delete_item(item_id: int, user_id: int = Depends(current_user_id)) -> None:
    if not repositories.items.delete_item(user_id, item_id):
        raise HTTPException(status_code=404, detail="Item not found")


@app.post("/api/meetings", status_code=201, response_model=CreateMeetingResponse)
def create_meeting(
    request: CreateMeetingRequest, user_id: int = Depends(current_user_id)
) -> CreateMeetingResponse:
    return repositories.meetings.create_meeting(user_id, request)


@app.get("/api/meetings", response_model=MeetingsResponse)
def list_meetings(
    limit: int = 3, user_id: int = Depends(current_user_id)
) -> MeetingsResponse:
    return MeetingsResponse(meetings=repositories.meetings.list_meetings(user_id, limit))


@app.get("/api/meetings/{meeting_id}", response_model=MeetingDetail)
def get_meeting(
    meeting_id: int, user_id: int = Depends(current_user_id)
) -> MeetingDetail:
    meeting = repositories.meetings.get_meeting(user_id, meeting_id)
    if meeting is None:
        raise HTTPException(status_code=404, detail="Meeting not found")
    return meeting


@app.post("/api/items/save-to-tasks", response_model=SaveToTasksResponse)
def save_to_tasks(user_id: int = Depends(current_user_id)) -> SaveToTasksResponse:
    return SaveToTasksResponse(updated=repositories.items.save_all_to_tasks(user_id))
