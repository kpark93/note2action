"""The action_items table — one row per extracted or edited task; RLS restricts
every query to rows whose user_id matches the caller (postgres/session.py)."""

from datetime import date

from sqlalchemy import CheckConstraint, ForeignKey, text
from sqlalchemy.orm import Mapped, mapped_column

from .base import Base


class ActionItem(Base):
    """One action item. CHECK constraints mirror app rules: closed
    priority/status sets, and completed set iff status = 'Done'."""

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
    status: Mapped[str]
    saved: Mapped[bool] = mapped_column(
        default=False, server_default=text("false")
    )
    note: Mapped[str | None]
    completed: Mapped[date | None]
