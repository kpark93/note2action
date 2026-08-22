"""Opens a DB session stamped with the caller's identity so Postgres
RLS can enforce ownership even if app code has a bug.
Not used by users.py — no RLS there (see app/models/user.py).
Path: postgres/{items,meetings}.py → [this file] → core/db.py → Postgres.
"""

from collections.abc import Iterator
from contextlib import contextmanager

from sqlalchemy import text
from sqlalchemy.orm import Session

from app.core.db import SessionLocal


@contextmanager
def rls_session(user_id: int) -> Iterator[Session]:
    """Session carrying identity for RLS via SET LOCAL, scoped to this
    transaction; unset means RLS sees NULL — fails closed."""
    with SessionLocal() as session:
        session.execute(
            text("SELECT set_config('app.user_id', :uid, true)"),
            {"uid": str(user_id)},
        )
        yield session
