"""The action_items table — one row per extracted or edited task.

Written/read by repositories/postgres/items.py and
repositories/postgres/meetings.py. Row-level security restricts every
query to rows whose user_id matches the caller — see
repositories/postgres/session.py.
Path: repositories/postgres/{items,meetings}.py → [this file] →
Postgres `action_items`.
"""

from datetime import date

from sqlalchemy import CheckConstraint, ForeignKey, text
from sqlalchemy.orm import Mapped, mapped_column

from .base import Base


class ActionItem(Base):
    """One action item. The CHECK constraints below are the database's
    own copy of rules the app also enforces: priority/status are closed
    sets, and `completed` is set if and only if status is 'Done' — the
    database rejects either one changing without the other."""

    __tablename__ = "action_items"
    __table_args__ = (
        CheckConstraint(
            "priority IN ('High', 'Medium', 'Low')",
            name="ck_action_items_priority",
        ),
        CheckConstraint(
            "status IN ('Not started', 'In progress', 'Blocked', 'Done')",
            name="ck_action_items_status",
        ),
        CheckConstraint(
            "(status = 'Done') = (completed IS NOT NULL)",
            name="ck_action_items_completed_iff_done",
        ),
    )

    id: Mapped[int] = mapped_column(primary_key=True)
    meeting_id: Mapped[int] = mapped_column(
        ForeignKey("meetings.id", ondelete="CASCADE")
    )
    # Denormalized owner (the meeting already knows it) so per-row security
    # checks — and Module 13's RLS policies — never need a join.
    user_id: Mapped[int] = mapped_column(ForeignKey("users.id"))
    title: Mapped[str]
    owner: Mapped[str]
    due: Mapped[date | None]
    priority: Mapped[str]
    confidence: Mapped[int]
    status: Mapped[str]
    saved: Mapped[bool] = mapped_column(
        default=False, server_default=text("false")
    )
    note: Mapped[str | None]
    completed: Mapped[date | None]
