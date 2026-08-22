from sqlalchemy.orm import Mapped, mapped_column

from .base import Base

class User(Base):
    __tablename__ = "users"

    id: Mapped[int] = mapped_column(primary_key=True)
    name: Mapped[str]
    role: Mapped[str | None]
    # Clerk's user id (`user_…`) — the link between a verified token and our
    # row. Unique; nullable so pre-auth rows can exist until they're linked.
    clerk_id: Mapped[str | None] = mapped_column(unique=True)
