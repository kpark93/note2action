"""Persistence lives behind a small interface so implementations can be swapped.

Two implementations exist: Postgres (production, chosen via REPOSITORY=postgres
in .env) and in-memory (tests and dev without Docker). app/main.py picks one;
nothing else knows which is running.
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
        """Map a verified Clerk user id to our users.id, creating on first visit.

        `name` comes from the token's custom session claim: used at creation
        (falling back to "New user"), and refreshed when Clerk's value
        changes. None means "token doesn't say" — never overwrite with it.
        """
        ...


class ItemRepository(Protocol):
    """The persistence boundary for a user's action items.

    Every method takes the *verified* user id and answers only for that
    user's rows. Asking about someone else's row looks identical to asking
    about a row that doesn't exist (None/False → 404) — no existence leaks.
    """

    def list_items(self, user_id: int) -> list[ActionItem]: ...

    def update_item(
        self, user_id: int, item_id: int, patch: ActionItemPatch
    ) -> ActionItem | None: ...

    def delete_item(self, user_id: int, item_id: int) -> bool: ...

    def save_all_to_tasks(self, user_id: int) -> int: ...


class MeetingRepository(Protocol):
    """The persistence boundary for meetings and the items captured with them.

    Same law as ItemRepository: every method takes the *verified* user id
    and answers only for that user's rows — someone else's meeting looks
    identical to one that doesn't exist (None → 404), no existence leaks.
    """

    def create_meeting(
        self, user_id: int, request: CreateMeetingRequest
    ) -> CreateMeetingResponse: ...

    def list_meetings(self, user_id: int, limit: int) -> list[Meeting]: ...

    def get_meeting(self, user_id: int, meeting_id: int) -> MeetingDetail | None: ...


@dataclass(frozen=True)
class Repositories:
    users: UserRepository
    items: ItemRepository
    meetings: MeetingRepository
