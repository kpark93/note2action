"""Re-exports every pydantic schema so `from app.schemas import X` works
from one place.

Imported by app/api/routes/*.py (response_model / request bodies) and
by repositories/{memory,mappers,postgres/*}.py (the shapes they build).
Path: routes/repositories → [this file] → schemas/{health,items,
meetings}.py.
"""

from .health import HealthResponse
from .items import (
    ActionItem,
    ActionItemPatch,
    ItemsResponse,
    Priority,
    SaveToTasksResponse,
    Status,
)
from .meetings import (
    CreateMeetingRequest,
    CreateMeetingResponse,
    ExtractedItem,
    Meeting,
    MeetingDetail,
    MeetingsResponse,
)

__all__ = [
    "ActionItem",
    "ActionItemPatch",
    "CreateMeetingRequest",
    "CreateMeetingResponse",
    "ExtractedItem",
    "HealthResponse",
    "ItemsResponse",
    "Meeting",
    "MeetingDetail",
    "MeetingsResponse",
    "Priority",
    "SaveToTasksResponse",
    "Status",
]
