"""The real UserRepository — backed by the `users` table.

Uses core/db.py's plain SessionLocal, not rls_session: `users` has
no RLS (it's the identity bootstrap table).
Path: services/users.py → [this file] → core/db.py → Postgres `users`.
"""

from sqlalchemy import select
from sqlalchemy.exc import IntegrityError

from app.core.db import SessionLocal
from app.models import User


class PostgresUserRepository:
    """Store backed by the real users table."""

    def get_or_create_user(self, clerk_id: str, name: str | None) -> int:
        """Maps Clerk id to users.id; name set at creation ("New user"
        if absent) and refreshed on change; None never erases it."""
        with SessionLocal() as session:
            existing = session.execute(
                select(User).where(User.clerk_id == clerk_id)
            ).scalar_one_or_none()
            if existing is not None:
                # Clerk is the source of truth; None means the token
                # carries no name claim, so keep what we have.
                if name and existing.name != name:
                    existing.name = name
                    session.commit()
                return existing.id
            user = User(name=name or "New user", clerk_id=clerk_id)
            session.add(user)
            try:
                session.commit()
            except IntegrityError:
                # Two first-requests raced to create the same user; the unique
                # constraint let exactly one win — read the winner's row.
                session.rollback()
                return session.execute(
                    select(User.id).where(User.clerk_id == clerk_id)
                ).scalar_one()
            return user.id
