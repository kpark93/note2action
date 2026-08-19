from datetime import date, datetime

from sqlalchemy.orm import DeclarativeBase, Mapped, mapped_column
from sqlalchemy import ForeignKey, Text, DateTime, CheckConstraint, text

class Base(DeclarativeBase):
    pass 

class User(Base):
    __tablename__ = "users"

    id: Mapped[int] = mapped_column(primary_key=True)
    name: Mapped[str]
    role: Mapped[str | None]

class Meeting(Base):
    __tablename__ = "meetings"

    id: Mapped[int] = mapped_column(primary_key=True)
    user_id: Mapped[int] = mapped_column(ForeignKey("users.id"))
    title: Mapped[str]
    raw_notes: Mapped[str] = mapped_column(Text)
    captured_at: Mapped[datetime] = mapped_column(DateTime(timezone=True))

class ActionItem(Base):
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
        )
    )

    id: Mapped[int] = mapped_column(primary_key=True)
    meeting_id: Mapped[int] = mapped_column(ForeignKey("meetings.id", ondelete="CASCADE"))
    title: Mapped[str]
    owner: Mapped[str]
    due: Mapped[date | None]
    priority: Mapped[str]
    confidence: Mapped[int]
    status: Mapped[str]
    saved: Mapped[bool] = mapped_column(default=False, server_default=text("false"))
    note: Mapped[str | None]
    completed: Mapped[date | None]


