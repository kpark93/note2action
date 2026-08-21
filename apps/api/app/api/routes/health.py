from datetime import datetime, timezone

from fastapi import APIRouter

from app.schemas import HealthResponse

router = APIRouter()


@router.get("/api/health", response_model=HealthResponse)
def health() -> HealthResponse:
    return HealthResponse(
        status="ok",
        service="note2action-api",
        time=datetime.now(timezone.utc).isoformat(),
    )
