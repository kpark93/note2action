"""The action_items table — one row per task; RLS scopes every query to the caller."""

from datetime import date

from sqlalchemy import CheckConstraint, ForeignKey, text
from sqlalchemy.orm import Mapped, mapped_column

from .base import Base


class ActionItem(Base):
    """One action item; CHECKs pin priority/status sets and completed iff Done."""

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
    # Denormalized owner so per-row checks and RLS policies never need a join.
    user_id: Mapped[int] = mapped_column(ForeignKey("users.id"))
    title: Mapped[str]
    owner: Mapped[str]
    due: Mapped[date | None]
    priority: Mapped[str]
    status: Mapped[str]
    saved: Mapped[bool] = mapped_column(default=False, server_default=text("false"))
    note: Mapped[str | None]
    completed: Mapped[date | None]
