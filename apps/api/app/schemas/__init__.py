"""Re-exports every pydantic schema so `from app.schemas import X` works from
one place."""

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
