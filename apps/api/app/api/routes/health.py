"""Health check route — the one endpoint that skips auth entirely.

Listed in core/middleware.py's PUBLIC_PATHS, so it answers with no token
required; used by anything checking the API is up (proxy healthcheck,
uptime monitors).
Path: client → [this file] — no service, no repository, nothing to check.
"""

from datetime import datetime, timezone

from fastapi import APIRouter

from app.schemas import HealthResponse

router = APIRouter()


@router.get("/api/health", response_model=HealthResponse)
def health() -> HealthResponse:
    """Report that the API process is alive, with a UTC timestamp."""
    return HealthResponse(
        status="ok",
        service="note2action-api",
        time=datetime.now(timezone.utc).isoformat(),
    )
