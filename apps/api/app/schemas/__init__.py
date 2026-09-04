"""Re-exports every pydantic schema so `from app.schemas import X` works from
one place."""

from .health import HealthResponse
from .items import (
    ActionItem,
    ActionItemPatch,
    ItemsPage,
    ItemsResponse,
    ItemSummary,
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
    MeetingsPage,
    MeetingsResponse,
)

__all__ = [
    "ActionItem",
    "ActionItemPatch",
    "CreateMeetingRequest",
    "CreateMeetingResponse",
    "ExtractedItem",
    "HealthResponse",
    "ItemSummary",
    "ItemsPage",
    "ItemsResponse",
    "Meeting",
    "MeetingDetail",
    "MeetingsPage",
    "MeetingsResponse",
    "Priority",
    "SaveToTasksResponse",
    "Status",
]
