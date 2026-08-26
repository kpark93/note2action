"""Health check route — the one endpoint that skips auth (PUBLIC_PATHS in
core/middleware.py). No service, no repository."""

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
