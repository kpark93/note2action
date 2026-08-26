"""The meetings table — one row per captured meeting; RLS restricts every query
to the caller's rows (see postgres/session.py)."""

from datetime import datetime

from sqlalchemy import DateTime, ForeignKey, Text
from sqlalchemy.orm import Mapped, mapped_column

from .base import Base


class Meeting(Base):
    """One captured meeting: owner, title, raw notes, and capture time."""

    __tablename__ = "meetings"

    id: Mapped[int] = mapped_column(primary_key=True)
    user_id: Mapped[int] = mapped_column(ForeignKey("users.id"))
    title: Mapped[str]
    raw_notes: Mapped[str] = mapped_column(Text)
    captured_at: Mapped[datetime] = mapped_column(DateTime(timezone=True))
