"""The users table; deliberately NO RLS — identity lookup runs before a user_id exists."""

from sqlalchemy.orm import Mapped, mapped_column

from .base import Base


class User(Base):
    """One user row: id, display name, optional role, and Clerk link."""

    __tablename__ = "users"

    id: Mapped[int] = mapped_column(primary_key=True)
    name: Mapped[str]
    role: Mapped[str | None]
    # Clerk's user id — unique; nullable so pre-auth rows can exist until linked.
    clerk_id: Mapped[str | None] = mapped_column(unique=True)
