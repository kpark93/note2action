"""Persistence behind a small interface: Postgres (production) or in-memory
(tests/dev) — app/main.py picks one, nothing else knows which."""

from dataclasses import dataclass
from typing import Protocol

from app.schemas.items import ActionItem, ActionItemPatch
from app.schemas.meetings import (
    CreateMeetingRequest,
    CreateMeetingResponse,
    Meeting,
    MeetingDetail,
)


class UserRepository(Protocol):
    """Maps a verified Clerk id onto our users.id, creating on first visit."""

    def get_or_create_user(self, clerk_id: str, name: str | None) -> int:
        """Maps Clerk id to users.id. Name: set at creation ("New user"
        if absent), refreshed on change; None never erases it."""
        ...


class ItemRepository(Protocol):
    """Persistence boundary for action items; someone else's row looks
    like a missing one (None/False → 404) — never leaking existence."""

    def list_items(self, user_id: int) -> list[ActionItem]: ...

    def update_item(
        self, user_id: int, item_id: int, patch: ActionItemPatch
    ) -> ActionItem | None: ...

    def delete_item(self, user_id: int, item_id: int) -> bool: ...

    def save_all_to_tasks(self, user_id: int) -> int: ...


class MeetingRepository(Protocol):
    """Persistence boundary for meetings; same 404-not-403 law as
    ItemRepository — no existence leaks."""

    def create_meeting(
        self, user_id: int, request: CreateMeetingRequest
    ) -> CreateMeetingResponse: ...

    def list_meetings(self, user_id: int, limit: int) -> list[Meeting]: ...

    def get_meeting(
        self, user_id: int, meeting_id: int
    ) -> MeetingDetail | None: ...


@dataclass(frozen=True)
class Repositories:
    """The three repositories bundled together; built once in app/main.py
    and reached by routes through api/deps.py's get_repositories()."""

    users: UserRepository
    items: ItemRepository
    meetings: MeetingRepository
