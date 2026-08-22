"""Health check route — the one endpoint that skips auth entirely.
Listed in core/middleware.py's PUBLIC_PATHS; no token required.
Path: client → [this file] — no service, no repository to check.
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
