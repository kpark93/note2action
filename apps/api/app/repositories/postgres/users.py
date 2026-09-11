"""The real UserRepository — plain SessionLocal; `users` has no RLS (bootstrap table)."""

from sqlalchemy import select
from sqlalchemy.exc import IntegrityError

from app.core.db import SessionLocal
from app.models import User


class PostgresUserRepository:
    """Store backed by the real users table."""

    def get_or_create_user(self, clerk_id: str, name: str | None) -> int:
        """Clerk id → users.id; name refreshed on change, None never erases it."""
        with SessionLocal() as session:
            existing = session.execute(
                select(User).where(User.clerk_id == clerk_id)
            ).scalar_one_or_none()
            if existing is not None:
                # Clerk is the source of truth; a claimless token keeps what we have.
                if name and existing.name != name:
                    existing.name = name
                    session.commit()
                return existing.id
            user = User(name=name or "New user", clerk_id=clerk_id)
            session.add(user)
            try:
                session.commit()
            except IntegrityError:
                # Two first-requests raced; the unique constraint picked one winner.
                session.rollback()
                return session.execute(
                    select(User.id).where(User.clerk_id == clerk_id)
                ).scalar_one()
            return user.id
