"""The wire shape for GET /api/health, built and returned by
api/routes/health.py."""

from pydantic import BaseModel


class HealthResponse(BaseModel):
    """Always status="ok" today — a place to add real checks later."""

    status: str
    service: str
    time: str
