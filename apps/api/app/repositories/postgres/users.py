"""The real UserRepository — backed by the `users` table.

Called by services/users.py (resolve_user_id) on every authenticated
request. Uses core/db.py's plain SessionLocal directly, not
postgres/session.py's rls_session: `users` has no RLS policy (it's the
identity bootstrap table — see the row-level-security migration).
Path: services/users.py → [this file] → core/db.py → Postgres `users`.
"""

from sqlalchemy import select
from sqlalchemy.exc import IntegrityError

from app.core.db import SessionLocal
from app.models import User


class PostgresUserRepository:
    """Store backed by the real users table."""

    def get_or_create_user(self, clerk_id: str, name: str | None) -> int:
        """Map a verified Clerk id to our users.id, creating on first
        visit. Name laws: set on creation (falling back to "New user"),
        refreshed from Clerk when it changes, and a unique-constraint
        race on simultaneous first visits is resolved by re-reading the
        winner's row rather than erroring.
        """
        with SessionLocal() as session:
            existing = session.execute(
                select(User).where(User.clerk_id == clerk_id)
            ).scalar_one_or_none()
            if existing is not None:
                # Clerk is the source of truth for the profile — keep ours
                # fresh; None means the token carries no name claim, so keep
                # whatever we have.
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
