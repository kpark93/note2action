"""The wire shape for GET /api/health.

Built and returned by api/routes/health.py.
Path: api/routes/health.py → [this file] → JSON response.
"""

from pydantic import BaseModel


class HealthResponse(BaseModel):
    """Always status="ok" today — a place to add real checks later."""

    status: str
    service: str
    time: str
