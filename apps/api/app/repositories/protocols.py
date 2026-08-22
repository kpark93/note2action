"""Persistence behind a small interface: Postgres (production) or
in-memory (tests/dev) — app/main.py picks one, nothing else knows which.
Implemented by memory.py, postgres/*.py; used by api/deps.py, services/*.py.
Path: app/main.py → [this file] (the shape) →
repositories/{memory,postgres}.
"""

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
        """Maps a verified Clerk id to our users.id, creating on first
        visit. `name`: sets it at creation ("New user" if absent),
        refreshes it on change; None never overwrites (token said nothing).
        """
        ...


class ItemRepository(Protocol):
    """Persistence boundary for a user's action items; every method takes
    the *verified* user id — someone else's row looks like a missing one
    (None/False → 404), never leaking existence."""

    def list_items(self, user_id: int) -> list[ActionItem]: ...

    def update_item(
        self, user_id: int, item_id: int, patch: ActionItemPatch
    ) -> ActionItem | None: ...

    def delete_item(self, user_id: int, item_id: int) -> bool: ...

    def save_all_to_tasks(self, user_id: int) -> int: ...


class MeetingRepository(Protocol):
    """Persistence boundary for meetings; same law as ItemRepository —
    every method takes the *verified* user id, and someone else's meeting
    looks like a missing one (None → 404), no existence leaks."""

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
