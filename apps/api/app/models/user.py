"""The users table — one row per person, keyed to their Clerk identity.
Deliberately has NO row-level security: identity lookup must run before
a caller's user_id exists, so it can't be gated by that same id.
Written/read by repositories/postgres/users.py.
Path: repositories/postgres/users.py → [this file] → Postgres `users`.
"""

from sqlalchemy.orm import Mapped, mapped_column

from .base import Base


class User(Base):
    """One user row: id, display name, optional role, and Clerk link."""

    __tablename__ = "users"

    id: Mapped[int] = mapped_column(primary_key=True)
    name: Mapped[str]
    role: Mapped[str | None]
    # Clerk's user id (`user_…`) — links a verified token to our row.
    # Unique; nullable so pre-auth rows can exist until linked.
    clerk_id: Mapped[str | None] = mapped_column(unique=True)
